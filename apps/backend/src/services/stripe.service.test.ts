import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../database/prisma.js';
import { StripeService } from './stripe.service.js';
import type Stripe from 'stripe';

describe('StripeService (Segurança e Ciclo de Vida de Webhooks — Gap G03)', () => {
  const stripeService = new StripeService();
  const testRunId = Date.now();
  const activeEmail = `stripe_active_${testRunId}@teste.com`;
  const erasedEmail = `stripe_erased_${testRunId}@teste.com`;
  const activeCustomerId = `cus_active_${testRunId}`;
  const erasedCustomerId = `cus_erased_${testRunId}`;

  let activeUserId = '';
  let erasedUserId = '';

  before(async () => {
    // 1. Cria usuário ativo regular com Stripe Customer ID
    const activeUser = await prisma.user.create({
      data: {
        name: 'Usuário Ativo Stripe',
        email: activeEmail,
        password: 'Password123!',
        role: 'USER',
        stripeCustomerId: activeCustomerId,
      },
    });
    activeUserId = activeUser.id;

    // 2. Cria usuário eliminado/anonimizado
    const erasedUser = await prisma.user.create({
      data: {
        name: 'Usuário Anonimizado',
        email: erasedEmail,
        password: 'Password123!',
        role: 'USER',
        stripeCustomerId: erasedCustomerId,
        erasureStatus: 'COMPLETED',
        erasureCompletedAt: new Date(),
      },
    });
    erasedUserId = erasedUser.id;
  });

  after(async () => {
    const userIds = [activeUserId, erasedUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.entitlement.deleteMany({
        where: { email: { in: [activeEmail, erasedEmail] } },
      });
      await prisma.payment.deleteMany({
        where: { email: { in: [activeEmail, erasedEmail] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  });

  describe('isUserErased (Validação de Titulares Eliminados)', () => {
    it('deve identificar e-mail anonimizado interno deleted_... como eliminado', async () => {
      const isErased = await stripeService.isUserErased('deleted_uuid_aleatorio@engrama.internal');
      assert.strictEqual(isErased, true);
    });

    it('deve identificar usuário por customerId com erasureStatus COMPLETED', async () => {
      const isErased = await stripeService.isUserErased(null, erasedCustomerId);
      assert.strictEqual(isErased, true);
    });

    it('deve identificar usuário por e-mail com erasureStatus COMPLETED', async () => {
      const isErased = await stripeService.isUserErased(erasedEmail);
      assert.strictEqual(isErased, true);
    });

    it('deve retornar false para usuário ativo com cadastro regular', async () => {
      const isErased = await stripeService.isUserErased(activeEmail, activeCustomerId);
      assert.strictEqual(isErased, false);
    });
  });

  describe('Bloqueio de Recriação de Dados via Webhooks (Defesa em Profundidade)', () => {
    it('NÃO deve recriar entitlement quando receber subscription.updated de usuário eliminado', async () => {
      const mockSubscription = {
        id: `sub_test_${testRunId}`,
        customer: erasedCustomerId,
        status: 'active',
        items: {
          data: [{ price: { id: 'price_yearly' }, current_period_end: Math.floor(Date.now() / 1000) + 3600 }],
        },
      } as unknown as Stripe.Subscription;

      // Executa o handler diretamente
      // @ts-expect-error Acessando método privado para teste unitário
      await stripeService.handleSubscriptionUpdated(mockSubscription);

      // Verifica que NENHUM entitlement foi recriado para o usuário eliminado
      const entitlement = await prisma.entitlement.findUnique({
        where: { email: erasedEmail },
      });
      assert.strictEqual(entitlement, null, 'Entitlement não deve ser recriado para usuário já eliminado');
    });

    it('NÃO deve recriar pagamento quando receber checkout.session.completed de usuário eliminado', async () => {
      const mockSession = {
        id: `cs_test_${testRunId}`,
        customer: erasedCustomerId,
        customer_email: erasedEmail,
        subscription: `sub_test_${testRunId}`,
        amount_total: 19900,
        currency: 'brl',
      } as unknown as Stripe.Checkout.Session;

      // @ts-expect-error Acessando método privado para teste unitário
      await stripeService.handleCheckoutSessionCompleted(mockSession);

      const payment = await prisma.payment.findFirst({
        where: { email: erasedEmail },
      });
      assert.strictEqual(payment, null, 'Pagamento não deve ser criado para e-mail já eliminado');
    });

    it('deve processar normalmente subscription.deleted de usuário eliminado sem lançar erro', async () => {
      const mockSubscription = {
        id: `sub_test_${testRunId}`,
        customer: erasedCustomerId,
        status: 'canceled',
      } as unknown as Stripe.Subscription;

      // Não deve lançar exceção
      await assert.doesNotReject(async () => {
        // @ts-expect-error Acesso de teste
        await stripeService.handleSubscriptionDeleted(mockSubscription);
      });
    });
  });
});
