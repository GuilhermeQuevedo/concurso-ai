export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  version: string;
  timestamp: string;
  preferences: CookiePreferences;
}

export const COOKIE_CONSENT_VERSION = 'consent_v1';
export const COOKIE_CONSENT_STORAGE_KEY = 'engrama_cookie_consent';
