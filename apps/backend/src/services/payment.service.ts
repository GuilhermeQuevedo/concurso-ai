import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';

type EntitlementStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'REFUNDED';

const ACTIVE_EVENTS = [
  'paid',
  'approved',
  'order_approved',
  'compra_aprovada',
  'completed',
  'active',
  'subscription_renewed',
  'subscription_active',
];
const INACTIVE_EVENTS: Record<string, EntitlementStatus> = {
  refunded: 'REFUNDED',
  compra_reembolsada: 'REFUNDED',
  chargedback: 'REFUNDED',
  chargeback: 'REFUNDED',
  canceled: 'CANCELED',
  cancelled: 'CANCELED',
  subscription_canceled: 'CANCELED',
  subscription_late: 'EXPIRED',
  expired: 'EXPIRED',
};

function unknown(value: unknown): Record<string, unknown> {
  return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
}

function pickEmail(payload: Record<string, unknown>): string | null {
  const customer = unknown(payload.Customer ?? payload.customer ?? payload.buyer);
  const email = (customer.email ?? payload.email ?? payload.Email) as string | undefined;
  return email ? email.toLowerCase().trim() : null;
}

function pickEvent(payload: Record<string, unknown>): string {
  const sub = unknown(payload.Subscription ?? payload.subscription);
  const raw =
    (payload.order_status ?? payload.webhook_event_type ?? payload.event ?? sub.status ?? '') as string;
  return String(raw).toLowerCase().trim();
}

function mapStatus(event: string): EntitlementStatus | null {
  if (ACTIVE_EVENTS.includes(event)) return 'ACTIVE';
  if (event in INACTIVE_EVENTS) return INACTIVE_EVENTS[event];
  return null;
}

function pickAmountCents(payload: Record<string, unknown>): number | null {
  const commissions = unknown(payload.Commissions ?? payload.commissions);
  const order = unknown(payload.order ?? payload.Order);
  const candidates = [
    commissions.charge_amount,
    payload.charge_amount,
    order.amount,
    payload.amount,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return null;
}

export class PaymentService {
  async handleKiwifyWebhook(payload: Record<string, unknown>) {
    const email = pickEmail(payload);
    const event = pickEvent(payload);
    const status = mapStatus(event);

    if (!email || !status) {
      return { handled: false, email, event };
    }

    const product = unknown(payload.Product ?? payload.product);
    const externalRef = (payload.order_id ?? payload.order_ref ?? payload.id ?? null) as string | null;
    const productId = (product.product_id ?? product.id ?? null) as string | null;

    await prisma.entitlement.upsert({
      where: { email },
      create: { email, status, provider: 'kiwify', externalRef, productId },
      update: { status, externalRef, productId },
    });

    await prisma.payment.create({
      data: { email, event, status, amountCents: pickAmountCents(payload), provider: 'kiwify', externalRef, productId },
    });

    return { handled: true, email, event, status };
  }

  async getAccess(email: string) {
    const normalized = email.toLowerCase().trim();
    const entitlement = await prisma.entitlement.findUnique({ where: { email: normalized } });
    const now = new Date();
    const active =
      !!entitlement &&
      entitlement.status === 'ACTIVE' &&
      (!entitlement.expiresAt || entitlement.expiresAt > now);

    return {
      active,
      enforced: env.REQUIRE_SUBSCRIPTION,
      status: entitlement?.status ?? 'NONE',
      expiresAt: entitlement?.expiresAt ?? null,
      checkoutUrl: env.KIWIFY_CHECKOUT_URL,
    };
  }
}
