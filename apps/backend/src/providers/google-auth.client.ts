import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

interface GoogleTokenInfoResponse {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  aud?: string;
  error_description?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleV3UserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export class GoogleAuthClient {
  private readonly clientId = env.GOOGLE_CLIENT_ID;
  private readonly clientSecret = env.GOOGLE_CLIENT_SECRET;

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientId.trim().length > 0);
  }

  getAuthUrl(state: string, customRedirectUri?: string): string {
    if (!this.clientId) {
      throw new AppError(400, 'GOOGLE_NOT_CONFIGURED', 'Google Client ID não configurado no servidor');
    }

    const redirectUri = customRedirectUri ?? `${env.API_URL}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserProfile> {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as GoogleTokenInfoResponse;
      throw new AppError(401, 'INVALID_GOOGLE_TOKEN', errBody.error_description ?? 'Token Google inválido');
    }

    const payload = (await response.json()) as GoogleTokenInfoResponse;

    if (!payload.email) {
      throw new AppError(400, 'GOOGLE_EMAIL_MISSING', 'E-mail não fornecido pelo Google');
    }

    const isVerified = payload.email_verified === 'true' || payload.email_verified === true;

    return {
      id: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0] ?? 'Usuário',
      picture: payload.picture,
      emailVerified: isVerified,
    };
  }

  async exchangeCodeForTokens(code: string, customRedirectUri?: string): Promise<GoogleTokenResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new AppError(400, 'GOOGLE_NOT_CONFIGURED', 'Google OAuth não configurado no servidor');
    }

    const redirectUri = customRedirectUri ?? `${env.API_URL}/api/auth/google/callback`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('❌ [Google OAuth] Token exchange failed:', errBody);
      throw new AppError(400, 'GOOGLE_EXCHANGE_FAILED', 'Falha ao autenticar com Google');
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  async fetchUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new AppError(401, 'GOOGLE_USERINFO_FAILED', 'Falha ao obter perfil de usuário do Google');
    }

    const info = (await response.json()) as GoogleV3UserInfo;

    return {
      id: info.sub,
      email: info.email.toLowerCase(),
      name: info.name ?? info.email.split('@')[0] ?? 'Usuário',
      picture: info.picture,
      emailVerified: Boolean(info.email_verified),
    };
  }
}
