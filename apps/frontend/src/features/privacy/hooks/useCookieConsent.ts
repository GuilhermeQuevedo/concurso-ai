import { useState, useEffect, useCallback } from 'react';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  type CookieConsentRecord,
  type CookiePreferences,
} from '../types/cookie-consent.types';

export function readStoredConsent(): CookieConsentRecord | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (parsed.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredConsent(preferences: CookiePreferences): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    preferences,
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('engrama_cookie_consent_updated', { detail: record }));
  } catch (err) {
    console.warn('[CookieConsent] Falha ao persistir consentimento:', err);
  }
  return record;
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentRecord | null>(readStoredConsent);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentRecord>;
      if (customEvent.detail) {
        setConsent(customEvent.detail);
      } else {
        setConsent(readStoredConsent());
      }
    };

    window.addEventListener('engrama_cookie_consent_updated', handleUpdate);
    return () => {
      window.removeEventListener('engrama_cookie_consent_updated', handleUpdate);
    };
  }, []);

  const hasConsented = consent !== null && consent.version === COOKIE_CONSENT_VERSION;

  const acceptAll = useCallback(() => {
    const record = saveStoredConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    setConsent(record);
    setIsPreferencesOpen(false);
  }, []);

  const acceptNecessaryOnly = useCallback(() => {
    const record = saveStoredConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setConsent(record);
    setIsPreferencesOpen(false);
  }, []);

  const saveCustomPreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      const record = saveStoredConsent({
        necessary: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
      });
      setConsent(record);
      setIsPreferencesOpen(false);
    },
    [],
  );

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      setConsent(null);
      setIsPreferencesOpen(true);
      window.dispatchEvent(new CustomEvent('engrama_cookie_consent_updated', { detail: null }));
    } catch (err) {
      console.warn('[CookieConsent] Erro ao redefinir consentimento:', err);
    }
  }, []);

  return {
    consent,
    hasConsented,
    isAnalyticsAllowed: Boolean(consent?.preferences.analytics),
    isMarketingAllowed: Boolean(consent?.preferences.marketing),
    isPreferencesOpen,
    openPreferences: () => setIsPreferencesOpen(true),
    closePreferences: () => setIsPreferencesOpen(false),
    acceptAll,
    acceptNecessaryOnly,
    saveCustomPreferences,
    resetConsent,
  };
}
