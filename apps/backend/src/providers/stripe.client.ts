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
    return Boolean(this.stripe && env.STRIPE_SECRET_KEY);
  }

  private getInstance(): Stripe {
    if (!this.stripe) {
      throw new AppError(500, 'STRIPE_NOT_CONFIGURED', 'Chave secreta do Stripe não está configurada no servidor');
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

  async createCheckoutSession(params: {
    customerId: string;
    customerEmail: string;
    priceId?: string;
    mode?: Stripe.Checkout.SessionCreateParams.Mode;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; url: string | null }> {
    const stripe = this.getInstance();

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (params.priceId) {
      lineItems = [{ price: params.priceId, quantity: 1 }];
    } else {
      lineItems = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Assinatura Pro Engrama (Plano em Definição)',
              description: 'Acesso completo a todas as ferramentas de IA, plano de estudos e redações.',
            },
            unit_amount: 4990, // R$ 49,90/mês provisório de teste
            recurring: params.mode === 'payment' ? undefined : { interval: 'month' },
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
