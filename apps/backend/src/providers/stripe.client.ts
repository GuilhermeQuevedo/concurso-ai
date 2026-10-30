import Stripe from 'stripe';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

export interface StripeInvoiceSummary {
  id: string;
  number: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: Stripe.Invoice.Status | null;
  created: number;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
}

export interface CreateCheckoutSessionOptions {
  customerId: string;
  customerEmail: string;
  priceId?: string;
  planType?: string;
  mode?: Stripe.Checkout.SessionCreateParams.Mode;
  successUrl: string;
  cancelUrl: string;
}

export class StripeClient {
  private readonly stripe: Stripe | null = null;

  constructor() {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-09-30.endive',
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.stripe && env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.trim().length > 0);
  }

  private getInstance(): Stripe {
    if (!this.stripe || !env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.trim().length === 0) {
      throw new AppError(
        500,
        'STRIPE_NOT_CONFIGURED',
        'Chave secreta do Stripe (STRIPE_SECRET_KEY) não está configurada no servidor. Adicione a chave no arquivo .env.',
      );
    }
    return this.stripe;
  }

  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    const stripe = this.getInstance();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      try {
        const existing = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!existing.deleted) {
          return existing.id;
        }
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code !== 'resource_missing') {
          throw err;
        }
      }
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(params: CreateCheckoutSessionOptions): Promise<{ id: string; url: string | null }> {
    const stripe = this.getInstance();

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (params.priceId) {
      lineItems = [{ price: params.priceId, quantity: 1 }];
    } else {
      // Plano inteligente dinâmico caso priceId específico não tenha sido criado no Dashboard da Stripe
      let name = 'Engrama Pro — Plano Anual';
      let unitAmount = 23988; // R$ 239,88/ano (equivalente a R$ 19,99/mês)
      let recurring: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring = {
        interval: 'year',
      };

      if (params.planType === 'monthly') {
        name = 'Engrama Pro — Plano Mensal';
        unitAmount = 2999; // R$ 29,99/mês
        recurring = { interval: 'month', interval_count: 1 };
      } else if (params.planType === 'semestral' || params.planType === 'semiannual') {
        name = 'Engrama Pro — Plano Semestral';
        unitAmount = 14994; // R$ 149,94 a cada 6 meses (equivalente a R$ 24,99/mês)
        recurring = { interval: 'month', interval_count: 6 };
      }

      lineItems = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name,
              description:
                'Acesso ilimitado ao Engrama Pro: Questões inéditas comentadas, Tríade do Caderno de Erros, Flashcards SM-2 e Redações com IA.',
            },
            unit_amount: unitAmount,
            recurring: params.mode === 'payment' ? undefined : recurring,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: params.mode ?? 'subscription',
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        planType: params.planType ?? 'default',
      },
    });

    return { id: session.id, url: session.url };
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const stripe = this.getInstance();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  }

  constructWebhookEvent(payload: Buffer | string, signature: string | undefined): Stripe.Event {
    const stripe = this.getInstance();

    if (env.STRIPE_WEBHOOK_SECRET && signature) {
      return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    }

    if (typeof payload === 'string') {
      return JSON.parse(payload) as Stripe.Event;
    }
    return JSON.parse(payload.toString('utf8')) as Stripe.Event;
  }

  async listCustomerInvoices(customerId: string): Promise<StripeInvoiceSummary[]> {
    const stripe = this.getInstance();

    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 24,
      });

      return invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        pdfUrl: inv.invoice_pdf ?? null,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      }));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'resource_missing') {
        return [];
      }
      throw err;
    }
  }
}
