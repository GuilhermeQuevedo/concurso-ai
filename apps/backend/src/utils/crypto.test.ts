import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptData, decryptData, isEncrypted } from './crypto.js';
import { AppError } from '../middlewares/error-handler.js';

describe('crypto.ts (AES-256-GCM Envelope Encryption)', () => {
  const plainText = 'ya29.a0AXooCguSAMPLE_GOOGLE_OAUTH_TOKEN_TEST_VALUE_12345';
  const userId = 'user_clx999test_aad';

  it('deve realizar roundtrip com sucesso quando AAD estiver correto', () => {
    const encrypted = encryptData(plainText, userId);
    assert.strictEqual(isEncrypted(encrypted), true);
    assert.ok(encrypted.startsWith('v1:'));

    const decrypted = decryptData(encrypted, userId);
    assert.strictEqual(decrypted, plainText);
  });

  it('deve realizar roundtrip com sucesso sem AAD', () => {
    const encrypted = encryptData(plainText);
    assert.strictEqual(isEncrypted(encrypted), true);

    const decrypted = decryptData(encrypted);
    assert.strictEqual(decrypted, plainText);
  });

  it('deve falhar com AppError ao tentar decifrar com AAD incorreto', () => {
    const encrypted = encryptData(plainText, userId);

    assert.throws(
      () => decryptData(encrypted, 'wrong_user_id'),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'CRYPTO_ERROR');
        return true;
      },
    );
  });

  it('deve falhar com AppError quando o payload for adulterado (tampered ciphertext)', () => {
    const encrypted = encryptData(plainText, userId);
    const parts = encrypted.split(':');
    // Adulterando o ciphertext invertendo um byte
    const cipherBuf = Buffer.from(parts[3], 'base64');
    cipherBuf[0] ^= 0xff;
    const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${cipherBuf.toString('base64')}`;

    assert.throws(
      () => decryptData(tamperedPayload, userId),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'CRYPTO_ERROR');
        return true;
      },
    );
  });

  it('deve falhar com AppError quando a authentication tag for adulterada', () => {
    const encrypted = encryptData(plainText, userId);
    const parts = encrypted.split(':');
    // Adulterando a tag
    const tamperedTag = 'AAA' + parts[2].slice(3);
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedTag}:${parts[3]}`;

    assert.throws(
      () => decryptData(tamperedPayload, userId),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'CRYPTO_ERROR');
        return true;
      },
    );
  });

  it('deve falhar com AppError para payloads sem o prefixo de versão correto', () => {
    const unversionedPayload = 'iv_base64:tag_base64:cipher_base64';
    assert.strictEqual(isEncrypted(unversionedPayload), false);

    assert.throws(
      () => decryptData(unversionedPayload, userId),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'CRYPTO_ERROR');
        return true;
      },
    );
  });

  it('deve falhar com AppError para strings arbitrárias ou textos em claro', () => {
    assert.strictEqual(isEncrypted('plain-token-12345'), false);

    assert.throws(
      () => decryptData('plain-token-12345', userId),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'CRYPTO_ERROR');
        return true;
      },
    );
  });

  it('deve gerar IVs diferentes e ciphertexts distintos para o mesmo texto plano', () => {
    const encrypted1 = encryptData(plainText, userId);
    const encrypted2 = encryptData(plainText, userId);

    assert.notStrictEqual(encrypted1, encrypted2);

    const iv1 = encrypted1.split(':')[1];
    const iv2 = encrypted2.split(':')[1];
    assert.notStrictEqual(iv1, iv2);

    // Ambos devem decifrar para o mesmo texto original
    assert.strictEqual(decryptData(encrypted1, userId), plainText);
    assert.strictEqual(decryptData(encrypted2, userId), plainText);
  });

  it('isEncrypted deve retornar false para valores não-string ou nulos', () => {
    assert.strictEqual(isEncrypted(null), false);
    assert.strictEqual(isEncrypted(undefined), false);
    assert.strictEqual(isEncrypted(12345), false);
    assert.strictEqual(isEncrypted({}), false);
  });
});
