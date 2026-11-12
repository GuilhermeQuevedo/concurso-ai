import { invalidateSubscriptionCache } from '../middlewares/subscription.middleware.js';
import type Stripe from 'stripe';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';
import { StripeClient, type StripeInvoiceSummary } from '../providers/stripe.client.js';
import type { CreateCheckoutSessionDTO } from '../validators/stripe.validators.js';

export class StripeService {
  constructor(private readonly client = new StripeClient()) {}

  getConfig() {
    return {
      publishableKey: env.STRIPE_PUBLISHABLE_KEY ?? '',
      isConfigured: this.client.isConfigured(),
      plans: {
        monthly: {
          priceId: env.STRIPE_PRICE_ID_MONTHLY ?? null,
          interval: 'month',
        },
        semestral: {
          priceId: env.STRIPE_PRICE_ID_SEMESTRAL ?? null,
          interval: '6_months',
        },
        yearly: {
          priceId: env.STRIPE_PRICE_ID_YEARLY ?? null,
          interval: 'year',
        },
      },
    };
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDTO): Promise<{ id: string; url: string | null }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    const customerId = await this.client.getOrCreateCustomer(userId, user.email, user.name);

    const priceId = this.resolvePriceId(dto);
    const successUrl = dto.successUrl ?? `${env.APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl ?? `${env.APP_URL}/dashboard?payment=cancelled`;

    return this.client.createCheckoutSession({
      customerId,
      customerEmail: user.email,
      priceId,
      planType: dto.planType,
      mode: 'subscription',
      successUrl,
      cancelUrl,
    });
  }

  async createBillingPortalSession(userId: string): Promise<{ url: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    const customerId = await this.client.getOrCreateCustomer(userId, user.email, user.name);
    const returnUrl = `${env.APP_URL}/dashboard`;

    return this.client.createBillingPortalSession(customerId, returnUrl);
  }

  async listInvoices(userId: string): Promise<StripeInvoiceSummary[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return [];
    }

    return this.client.listCustomerInvoices(user.stripeCustomerId);
  }

  async handleWebhook(rawBody: Buffer | string, signature: string | undefined): Promise<{ handled: boolean; eventType: string }> {
    const event = this.client.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return { handled: true, eventType: event.type };
  }

  private resolvePriceId(dto: CreateCheckoutSessionDTO): string | undefined {
    if (dto.priceId) return dto.priceId;
    if (dto.planType === 'yearly' && env.STRIPE_PRICE_ID_YEARLY) return env.STRIPE_PRICE_ID_YEARLY;
    if ((dto.planType === 'semestral' || dto.planType === 'semiannual') && env.STRIPE_PRICE_ID_SEMESTRAL) return env.STRIPE_PRICE_ID_SEMESTRAL;
    if (dto.planType === 'monthly' && env.STRIPE_PRICE_ID_MONTHLY) return env.STRIPE_PRICE_ID_MONTHLY;
    return env.STRIPE_PRICE_ID_MONTHLY ?? undefined;
  }

  /**
   * Verifica se o titular associado ao evento já foi eliminado ou anonimizado (Art. 18 LGPD).
   * Impede que webhooks tardios da Stripe reativem contas, recriem entitlements
   * ou persistam dados de titulares já expurgados.
   */
  async isUserErased(email?: string | null, customerId?: string | null): Promise<boolean> {
    if (email && email.toLowerCase().startsWith('deleted_')) {
      return true;
    }

    if (customerId) {
      const userByCustomer = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { erasureStatus: true, email: true },
      });
      if (
        userByCustomer &&
        (userByCustomer.erasureStatus === 'COMPLETED' || userByCustomer.email.startsWith('deleted_'))
      ) {
        return true;
      }
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const userByEmail = await prisma.user.findFirst({
        where: { email: cleanEmail },
        select: { erasureStatus: true },
      });
      if (userByEmail && userByEmail.erasureStatus === 'COMPLETED') {
        return true;
      }
    }

    return false;
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const email = session.customer_details?.email?.toLowerCase().trim() ?? session.customer_email?.toLowerCase().trim();
    const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null);
    if (!email) return;

    if (await this.isUserErased(email, customerId)) {
      console.log('[StripeWebhook] Ignorando checkout.session.completed: usuário já eliminado/anonimizado.');
      return;
    }

    const externalRef = (typeof session.subscription === 'string' ? session.subscription : session.id) ?? null;

    await prisma.entitlement.upsert({
      where: { email },
      create: {
        email,
        status: 'ACTIVE',
        provider: 'stripe',
        externalRef,
      },
      update: {
        status: 'ACTIVE',
        provider: 'stripe',
        externalRef,
      },
    });

    invalidateSubscriptionCache(email);
    await prisma.payment.create({
      data: {
        email,
        event: 'checkout.session.completed',
        status: 'ACTIVE',
        amountCents: session.amount_total ?? 0,
        currency: (session.currency ?? 'brl').toUpperCase(),
        provider: 'stripe',
        externalRef,
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    if (await this.isUserErased(null, customerId)) {
      console.log(`[StripeWebhook] Ignorando customer.subscription.updated para customer ${customerId}: usuário já eliminado/anonimizado.`);
      return;
    }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { email: true, erasureStatus: true },
    });

    if (!user?.email || user.erasureStatus === 'COMPLETED' || user.email.startsWith('deleted_')) return;

    const email = user.email.toLowerCase().trim();
    const status = subscription.status === 'active' || subscription.status === 'trialing'
      ? 'ACTIVE'
      : subscription.status === 'canceled'
        ? 'CANCELED'
        : 'EXPIRED';

    const item = subscription.items.data[0];
    const periodEnd = item?.current_period_end;
    const expiresAt = periodEnd ? new Date(periodEnd * 1000) : null;
    const productId = item?.price.id ?? null;

    await prisma.entitlement.upsert({
      where: { email },
      create: {
        email,
        status,
        provider: 'stripe',
        externalRef: subscription.id,
        productId,
        expiresAt,
      },
      update: {
        status,
        provider: 'stripe',
        externalRef: subscription.id,
        productId,
        expiresAt,
      },
    });
    invalidateSubscriptionCache(email);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    if (await this.isUserErased(null, customerId)) {
      console.log(`[StripeWebhook] Ignorando customer.subscription.deleted para customer ${customerId}: usuário já eliminado/anonimizado.`);
      return;
    }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { email: true, erasureStatus: true },
    });

    if (!user?.email || user.erasureStatus === 'COMPLETED' || user.email.startsWith('deleted_')) return;

    await prisma.entitlement.updateMany({
      where: { email: user.email.toLowerCase().trim() },
      data: { status: 'CANCELED' },
    });
    invalidateSubscriptionCache(user.email);
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const email = invoice.customer_email?.toLowerCase().trim();
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? null);
    if (!email) return;

    if (await this.isUserErased(email, customerId)) {
      console.log('[StripeWebhook] Ignorando invoice.payment_succeeded: usuário já eliminado/anonimizado.');
      return;
    }

    await prisma.payment.create({
      data: {
        email,
        event: 'invoice.payment_succeeded',
        status: 'PAID',
        amountCents: invoice.amount_paid,
        currency: (invoice.currency ?? 'brl').toUpperCase(),
        provider: 'stripe',
        externalRef: invoice.id,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const email = invoice.customer_email?.toLowerCase().trim();
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? null);
    if (!email) return;

    if (await this.isUserErased(email, customerId)) {
      console.log('[StripeWebhook] Ignorando invoice.payment_failed: usuário já eliminado/anonimizado.');
      return;
    }

    await prisma.payment.create({
      data: {
        email,
        event: 'invoice.payment_failed',
        status: 'FAILED',
        amountCents: invoice.amount_due,
        currency: (invoice.currency ?? 'brl').toUpperCase(),
        provider: 'stripe',
        externalRef: invoice.id,
      },
    });
  }
}
