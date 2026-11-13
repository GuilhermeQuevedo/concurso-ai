import { prisma } from '../database/prisma.js';
import { parseContacts } from '../utils/contact-parser.js';
import { maskEmail, maskName, maskPhone, hashEmail } from '../utils/mask.js';
import { AdminAuditService } from './admin-audit.service.js';
import type { AuditContext } from '../types/express.js';
import type { AdminPaginationDTO, ImportContactsDTO } from '../validators/admin.validators.js';
import { AppError } from '../middlewares/error-handler.js';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export class AdminService {
  constructor(private readonly auditService = new AdminAuditService()) {}

  async getOverview() {
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      totalUsers,
      activeSubscribers,
      newUsers7,
      newUsers30,
      questionsAnswered,
      essays,
      flashcards,
      sessions,
      contests,
      revenueAgg,
      paymentsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.entitlement.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.questionAttempt.count(),
      prisma.essay.count(),
      prisma.flashcard.count(),
      prisma.studySession.count(),
      prisma.contest.count(),
      prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users: { total: totalUsers, newLast7: newUsers7, newLast30: newUsers30 },
      subscriptions: { active: activeSubscribers },
      engagement: { questionsAnswered, essays, flashcards, sessions, contests },
      revenue: {
        receivedCents: revenueAgg._sum.amountCents ?? 0,
        paymentsCount,
      },
    };
  }

  /**
   * Listagem de usuários paginada (padrão 50, máx 100) com PII mascarada por padrão.
   * Registra a consulta na trilha de auditoria administrativa.
   */
  async getUsers(pagination?: AdminPaginationDTO, auditContext?: AuditContext) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 50));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          streak: { select: { current: true, longest: true } },
          _count: { select: { attempts: true, essays: true, flashcards: true, studySessions: true } },
        },
      }),
      prisma.user.count(),
    ]);

    const emails = users.map((u) => u.email.toLowerCase());
    const entitlements = await prisma.entitlement.findMany({ where: { email: { in: emails } } });
    const now = new Date();
    const entMap = new Map(
      entitlements.map((e) => [
        e.email,
        e.status === 'ACTIVE' && (!e.expiresAt || e.expiresAt > now)
          ? { provider: e.provider, expiresAt: e.expiresAt && e.expiresAt.getFullYear() < 2099 ? e.expiresAt : null }
          : null,
      ]),
    );

    // Registra a consulta de listagem no log de auditoria
    if (auditContext) {
      await this.auditService.recordAudit({
        adminId: auditContext.adminId,
        action: 'USER_LIST_VIEW',
        resourceType: 'USER',
        resourceCount: users.length,
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    const maskedUsers = users.map((u) => ({
      id: u.id,
      name: maskName(u.name),
      email: maskEmail(u.email),
      phone: maskPhone(u.phone),
      isMasked: true,
      role: u.role,
      createdAt: u.createdAt,
      activeSubscriber: !!entMap.get(u.email.toLowerCase()),
      access: entMap.get(u.email.toLowerCase()) ?? null,
      streak: u.streak?.current ?? 0,
      questionsAnswered: u._count.attempts,
      essays: u._count.essays,
      flashcards: u._count.flashcards,
      sessions: u._count.studySessions,
    }));

    return {
      users: maskedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Revela dados pessoais (nome, e-mail, telefone) de um usuário específico mediante justificativa formal.
   * Acesso auditado e registrado no log imutável.
   */
  async revealUserPii(targetUserId: string, justification: string, auditContext: AuditContext) {
    if (!justification || justification.trim().length < 10) {
      throw new AppError(400, 'JUSTIFICATION_REQUIRED', 'A justificativa deve conter no mínimo 10 caracteres');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    // Registra a revelação na trilha de auditoria
    await this.auditService.recordAudit({
      adminId: auditContext.adminId,
      action: 'USER_PII_REVEAL',
      resourceType: 'USER',
      resourceCount: 1,
      resourceIds: [targetUserId],
      justification: justification.trim(),
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isMasked: false,
    };
  }

  /**
   * Importa contatos registrando a operação de importação na trilha de auditoria
   * e filtrando contra a lista de supressão (hashes de e-mails descadastrados).
   */
  async importContacts(dto: ImportContactsDTO, auditContext?: AuditContext) {
    const parsed = parseContacts(dto.text);
    if (parsed.length === 0) {
      return { parsed: 0, imported: 0, skippedSuppressed: 0 };
    }

    // Identificar e-mails válidos e gerar hashes para consulta na lista de supressão
    const emailHashMap = new Map<string, string>();
    for (const c of parsed) {
      if (c.email) {
        emailHashMap.set(c.email, hashEmail(c.email));
      }
    }

    const uniqueHashes = Array.from(new Set(emailHashMap.values()));
    const suppressed =
      uniqueHashes.length > 0
        ? await prisma.contactSuppression.findMany({
            where: { emailHash: { in: uniqueHashes } },
            select: { emailHash: true },
          })
        : [];
    const suppressedSet = new Set(suppressed.map((s) => s.emailHash));

    // Filtrar contatos suprimidos
    const validContacts: typeof parsed = [];
    let skippedSuppressed = 0;

    for (const contact of parsed) {
      if (contact.email) {
        const h = emailHashMap.get(contact.email);
        if (h && suppressedSet.has(h)) {
          skippedSuppressed++;
          continue;
        }
      }
      validContacts.push(contact);
    }

    let importedCount = 0;
    if (validContacts.length > 0) {
      const result = await prisma.contact.createMany({
        data: validContacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          source: dto.source ?? 'importacao',
          legalBasis: dto.legalBasis,
          consentProofNotes: dto.consentProofNotes,
          legitimateInterestAssessmentRef: dto.legitimateInterestAssessmentRef,
          importedBy: auditContext?.adminId ?? 'admin',
        })),
      });
      importedCount = result.count;
    }

    if (auditContext) {
      await this.auditService.recordAudit({
        adminId: auditContext.adminId,
        action: 'CONTACT_IMPORT',
        resourceType: 'CONTACT',
        resourceCount: importedCount,
        justification: `Base: ${dto.legalBasis} | Pulados: ${skippedSuppressed} | Origem: ${dto.consentProofNotes.slice(0, 100)}`,
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return {
      parsed: parsed.length,
      imported: importedCount,
      skippedSuppressed,
    };
  }

  /**
   * Registra opt-out de um contato/lead, persistindo o hash irreversível na lista de supressão
   * e marcando contatos existentes com flag unsubscribed = true.
   */
  async optOutContact(email: string, reason?: string) {
    const normalized = email.trim().toLowerCase();
    const emailHash = hashEmail(normalized);

    // Upsert na tabela de supressão garantindo idempotência
    await prisma.contactSuppression.upsert({
      where: { emailHash },
      update: { reason: reason ?? 'USER_OPT_OUT' },
      create: {
        emailHash,
        reason: reason ?? 'USER_OPT_OUT',
      },
    });

    // Atualiza contatos existentes marcando unsubscribed = true
    const updated = await prisma.contact.updateMany({
      where: { email: { equals: normalized } },
      data: { unsubscribed: true },
    });

    return {
      success: true,
      message: 'Descadastro registrado com sucesso.',
      emailHash,
      contactsSuppressed: updated.count,
    };
  }

  /**
   * Listagem paginada de contatos com PII mascarada por padrão.
   */
  async listContacts(pagination?: AdminPaginationDTO, auditContext?: AuditContext) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 50));
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count(),
    ]);

    if (auditContext) {
      await this.auditService.recordAudit({
        adminId: auditContext.adminId,
        action: 'CONTACT_LIST_VIEW',
        resourceType: 'CONTACT',
        resourceCount: contacts.length,
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    const maskedContacts = contacts.map((c) => ({
      id: c.id,
      name: maskName(c.name),
      email: c.email ? maskEmail(c.email) : null,
      phone: c.phone ? maskPhone(c.phone) : null,
      notes: c.notes,
      source: c.source,
      createdAt: c.createdAt,
      isMasked: true,
    }));

    return {
      contacts: maskedContacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Revela dados pessoais de um contato mediante justificativa.
   */
  async revealContactPii(contactId: string, justification: string, auditContext: AuditContext) {
    if (!justification || justification.trim().length < 10) {
      throw new AppError(400, 'JUSTIFICATION_REQUIRED', 'A justificativa deve conter no mínimo 10 caracteres');
    }

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new AppError(404, 'CONTACT_NOT_FOUND', 'Contato não encontrado');
    }

    await this.auditService.recordAudit({
      adminId: auditContext.adminId,
      action: 'CONTACT_PII_REVEAL',
      resourceType: 'CONTACT',
      resourceCount: 1,
      resourceIds: [contactId],
      justification: justification.trim(),
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });

    return {
      ...contact,
      isMasked: false,
    };
  }

  async deleteContact(id: string, auditContext?: AuditContext) {
    const deleted = await prisma.contact.delete({ where: { id } });

    if (auditContext) {
      await this.auditService.recordAudit({
        adminId: auditContext.adminId,
        action: 'CONTACT_DELETE',
        resourceType: 'CONTACT',
        resourceCount: 1,
        resourceIds: [id],
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return deleted;
  }
}
