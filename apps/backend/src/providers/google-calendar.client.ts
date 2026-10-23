import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

interface GoogleCalendarItem {
  id: string;
  summary: string;
}

interface GoogleEventPayload {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

export class GoogleCalendarClient {
  private readonly clientId = env.GOOGLE_CLIENT_ID;
  private readonly clientSecret = env.GOOGLE_CLIENT_SECRET;
  private readonly redirectUri = env.GOOGLE_REDIRECT_URI;

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  private getRequiredConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new AppError(400, 'GOOGLE_NOT_CONFIGURED', 'Google OAuth não configurado no servidor');
    }
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    };
  }

  getAuthUrl(state: string): string {
    const { clientId, redirectUri } = this.getRequiredConfig();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const { clientId, clientSecret, redirectUri } = this.getRequiredConfig();

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(400, 'GOOGLE_AUTH_FAILED', `Falha ao autenticar com o Google: ${errorText}`);
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const { clientId, clientSecret } = this.getRequiredConfig();

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(400, 'GOOGLE_REFRESH_FAILED', `Falha ao renovar token do Google: ${errorText}`);
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  async getOrCreateSecondaryCalendar(accessToken: string, calendarName = 'Engrama - Cronograma de Estudos'): Promise<string> {
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (listRes.ok) {
      const data = (await listRes.json()) as { items?: GoogleCalendarItem[] };
      const existing = data.items?.find((cal) => cal.summary === calendarName);
      if (existing) {
        return existing.id;
      }
    }

    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: calendarName,
        timeZone: 'America/Sao_Paulo',
        description: 'Tarefas de estudo e datas de concurso sincronizadas pela plataforma Engrama',
      }),
    });

    if (!createRes.ok) {
      return 'primary';
    }

    const createdData = (await createRes.json()) as { id: string };
    return createdData.id;
  }

  async insertEvent(accessToken: string, calendarId: string, event: GoogleEventPayload): Promise<void> {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok && response.status !== 409) {
      const errorMsg = await response.text();
      console.warn('Erro ao inserir evento no Google Calendar:', errorMsg);
    }
  }
}
