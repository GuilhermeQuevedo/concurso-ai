import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  type CookieConsentRecord,
} from './types/cookie-consent.types.js';
import { readStoredConsent, saveStoredConsent } from './hooks/useCookieConsent.js';
import { telemetryService } from './services/telemetry.service.js';

// Mock de localStorage e DOM para o ambiente Node
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();

// Mock global de window e localStorage se não existirem
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    writable: true,
  });
}

if (typeof globalThis.document === 'undefined') {
  Object.defineProperty(globalThis, 'document', {
    value: {
      getElementById: () => null,
      createElement: () => ({ id: '', async: false, src: '' }),
      head: { appendChild: () => {} },
    },
    writable: true,
  });
}

describe('Consentimento de Cookies e Telemetria (Gap G01)', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Banner e Versionamento de Consentimento', () => {
    it('deve retornar null se nenhum consentimento prévio foi registrado (banner deve aparecer)', () => {
      const consent = readStoredConsent();
      assert.strictEqual(consent, null);
    });

    it('deve descartar consentimento de versão antiga e exigir nova coleta (banner reaparece)', () => {
      const outdated: CookieConsentRecord = {
        version: 'consent_v0_legacy',
        timestamp: new Date().toISOString(),
        preferences: {
          necessary: true,
          analytics: true,
          marketing: true,
        },
      };
      mockStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(outdated));

      const consent = readStoredConsent();
      assert.strictEqual(consent, null, 'Versão obsoleta não pode ser aceita');
    });

    it('deve reconhecer consentimento da versão atual consent_v1 (banner não reaparece)', () => {
      const valid: CookieConsentRecord = {
        version: COOKIE_CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        preferences: {
          necessary: true,
          analytics: false,
          marketing: false,
        },
      };
      mockStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(valid));

      const consent = readStoredConsent();
      assert.ok(consent);
      assert.strictEqual(consent.version, COOKIE_CONSENT_VERSION);
      assert.strictEqual(consent.preferences.necessary, true);
      assert.strictEqual(consent.preferences.analytics, false);
    });

    it('deve salvar consentimento com timestamp e versão oficial consent_v1', () => {
      const saved = saveStoredConsent({
        necessary: true,
        analytics: true,
        marketing: false,
      });

      assert.strictEqual(saved.version, COOKIE_CONSENT_VERSION);
      assert.strictEqual(saved.preferences.analytics, true);
      assert.strictEqual(saved.preferences.marketing, false);

      const fromStorage = JSON.parse(mockStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) || '{}') as CookieConsentRecord;
      assert.strictEqual(fromStorage.version, COOKIE_CONSENT_VERSION);
      assert.strictEqual(fromStorage.preferences.analytics, true);
    });
  });

  describe('Bloqueio Estrito de Analytics e Telemetria', () => {
    it('deve bloquear analytics quando não há consentimento registrado', () => {
      assert.strictEqual(telemetryService.isAnalyticsAllowed(), false);
      const injected = telemetryService.initAnalytics('G-FAKE123');
      assert.strictEqual(injected, false, 'Script analítico deve ser bloqueado');
    });

    it('deve bloquear analytics quando o usuário optou por "Aceitar apenas necessários"', () => {
      saveStoredConsent({
        necessary: true,
        analytics: false,
        marketing: false,
      });

      assert.strictEqual(telemetryService.isAnalyticsAllowed(), false);
      const injected = telemetryService.initAnalytics('G-FAKE123');
      assert.strictEqual(injected, false, 'Analytics não pode ser disparado');
    });

    it('deve permitir analytics somente após consentimento explícito', () => {
      saveStoredConsent({
        necessary: true,
        analytics: true,
        marketing: false,
      });

      assert.strictEqual(telemetryService.isAnalyticsAllowed(), true);
      const injected = telemetryService.initAnalytics('G-FAKE123');
      assert.strictEqual(injected, true, 'Analytics deve ser autorizado pós-consentimento');
    });
  });
});
