import { readStoredConsent } from '../hooks/useCookieConsent';

/**
 * Gerenciador de inicialização condicional de scripts de terceiros (Analytics / Marketing).
 * Bloqueia qualquer disparo antes da obtenção de consentimento livre e informado (LGPD Art. 7º, I).
 */
export const telemetryService = {
  isAnalyticsAllowed(): boolean {
    const consent = readStoredConsent();
    return Boolean(consent?.preferences.analytics);
  },

  isMarketingAllowed(): boolean {
    const consent = readStoredConsent();
    return Boolean(consent?.preferences.marketing);
  },

  /**
   * Dispara a inicialização de provedores analíticos caso consentido pelo titular.
   */
  initAnalytics(analyticsId?: string): boolean {
    if (!this.isAnalyticsAllowed()) {
      return false;
    }

    if (!analyticsId || typeof window === 'undefined') {
      return false;
    }

    // Exemplo de injeção segura pós-consentimento:
    // Garante que o script só é inserido no DOM após aprovação explícita
    const existing = document.getElementById('engrama-analytics-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'engrama-analytics-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
      document.head.appendChild(script);
    }
    return true;
  },
};
