import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';
import { ICalGenerator } from '../utils/ical-generator.js';
import { createHash } from 'node:crypto';
import { CalendarEventsService, type StudyCalendarEvent } from './calendar-events.service.js';
import { GoogleCalendarClient } from '../providers/google-calendar.client.js';
import { encryptData, decryptData, isEncrypted } from '../utils/crypto.js';
import type { UpdateCalendarIntegrationDTO } from '../validators/calendar-integration.validators.js';

export interface CalendarIntegrationResponse {
  id: string;
  feedToken: string;
  feedUrl: string;
  webcalUrl: string;
  googleCalendarWebUrl: string;
  isGoogleConnected: boolean;
  isGoogleConfigured: boolean;
  syncTasks: boolean;
  syncExams: boolean;
  syncSchedule: boolean;
  syncReminders: boolean;
  defaultTime: string;
  lastSyncedAt: Date | null;
}

// O Google exige id de evento só com 0-9 e a-v: o hash em hexadecimal serve e mantém o evento o mesmo a cada sincronização.
function googleEventId(uid: string): string {
  return `engrama${createHash('sha1').update(uid).digest('hex')}`;
}

function toIcalEvent(event: StudyCalendarEvent) {
  const base = { uid: event.uid, summary: event.summary, description: event.description, status: event.completed ? ('CONFIRMED' as const) : ('TENTATIVE' as const) };
  if (event.allDayDate) return { ...base, startDate: new Date(`${event.allDayDate}T12:00:00Z`), isAllDay: true };
  return { ...base, startDate: event.start as Date, endDate: event.end };
}

function toGoogleEvent(event: StudyCalendarEvent) {
  const base = { id: googleEventId(event.uid), summary: event.summary, description: event.description };
  if (event.allDayDate) return { ...base, start: { date: event.allDayDate }, end: { date: nextDay(event.allDayDate) } };
  return {
    ...base,
    start: { dateTime: (event.start as Date).toISOString(), timeZone: 'America/Sao_Paulo' },
    end: { dateTime: (event.end as Date).toISOString(), timeZone: 'America/Sao_Paulo' },
  };
}

function nextDay(dayKey: string): string {
  return new Date(new Date(`${dayKey}T12:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
}

export class CalendarIntegrationService {
  private readonly googleClient: GoogleCalendarClient;

  constructor(
    googleClient = new GoogleCalendarClient(),
    private readonly events = new CalendarEventsService(),
  ) {
    this.googleClient = googleClient;
  }

  async getIntegration(userId: string): Promise<CalendarIntegrationResponse> {
    const integration = await this.getOrCreateIntegration(userId);
    return this.formatResponse(integration);
  }

  async updateSettings(userId: string, dto: UpdateCalendarIntegrationDTO): Promise<CalendarIntegrationResponse> {
    const integration = await prisma.userCalendarIntegration.update({
      where: { userId },
      data: {
        ...(dto.syncTasks !== undefined ? { syncTasks: dto.syncTasks } : {}),
        ...(dto.syncExams !== undefined ? { syncExams: dto.syncExams } : {}),
        ...(dto.syncSchedule !== undefined ? { syncSchedule: dto.syncSchedule } : {}),
        ...(dto.syncReminders !== undefined ? { syncReminders: dto.syncReminders } : {}),
        ...(dto.defaultTime ? { defaultTime: dto.defaultTime } : {}),
      },
    });

    return this.formatResponse(integration);
  }

  async regenerateToken(userId: string): Promise<CalendarIntegrationResponse> {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const newToken = `feed_${Date.now()}_${randomSuffix}`;

    const integration = await prisma.userCalendarIntegration.update({
      where: { userId },
      data: { feedToken: newToken },
    });

    return this.formatResponse(integration);
  }

  async generateIcsFeed(feedToken: string): Promise<string> {
    const integration = await prisma.userCalendarIntegration.findUnique({
      where: { feedToken },
      include: { user: true },
    });

    if (!integration) {
      throw new AppError(404, 'FEED_NOT_FOUND', 'Calendário não encontrado ou link expirado.');
    }

    const generator = new ICalGenerator(`Engrama - ${integration.user.name}`);

    for (const event of await this.events.build(integration.userId, integration)) {
      generator.addEvent(toIcalEvent(event));
    }

    return generator.build();
  }

  getGoogleAuthUrl(userId: string): { authUrl: string; isConfigured: boolean } {
    if (!this.googleClient.isConfigured()) {
      return { authUrl: '', isConfigured: false };
    }

    const authUrl = this.googleClient.getAuthUrl(userId);
    return { authUrl, isConfigured: true };
  }

  async handleGoogleCallback(userId: string, code: string): Promise<CalendarIntegrationResponse> {
    const tokens = await this.googleClient.exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const encryptedAccessToken = encryptData(tokens.access_token, userId);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptData(tokens.refresh_token, userId)
      : undefined;

    const integration = await prisma.userCalendarIntegration.update({
      where: { userId },
      data: {
        googleAccessToken: encryptedAccessToken,
        ...(encryptedRefreshToken ? { googleRefreshToken: encryptedRefreshToken } : {}),
        googleTokenExpiry: expiresAt,
      },
    });

    return this.formatResponse(integration);
  }

  async disconnectGoogle(userId: string): Promise<CalendarIntegrationResponse> {
    const integration = await prisma.userCalendarIntegration.update({
      where: { userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
      },
    });

    return this.formatResponse(integration);
  }

  async syncToGoogle(userId: string): Promise<{ syncedEventsCount: number }> {
    const integration = await prisma.userCalendarIntegration.findUnique({ where: { userId } });
    if (!integration || !integration.googleAccessToken) {
      throw new AppError(400, 'GOOGLE_NOT_CONNECTED', 'Conta Google não conectada');
    }

    const accessToken = await this.getValidGoogleAccessToken(integration);
    const calendarId = integration.googleCalendarId ?? (await this.googleClient.getOrCreateSecondaryCalendar(accessToken));

    if (!integration.googleCalendarId) {
      await prisma.userCalendarIntegration.update({
        where: { userId },
        data: { googleCalendarId: calendarId },
      });
    }

    let count = 0;
    for (const event of await this.events.build(userId, integration)) {
      if (await this.googleClient.upsertEvent(accessToken, calendarId, toGoogleEvent(event))) count++;
    }

    await prisma.userCalendarIntegration.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });

    return { syncedEventsCount: count };
  }

  private async getOrCreateIntegration(userId: string) {
    const existing = await prisma.userCalendarIntegration.findUnique({ where: { userId } });
    if (existing) return existing;

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const feedToken = `feed_${Date.now()}_${randomSuffix}`;

    return prisma.userCalendarIntegration.create({
      data: {
        userId,
        feedToken,
      },
    });
  }

  private formatResponse(integration: {
    id: string;
    feedToken: string;
    googleAccessToken: string | null;
    syncTasks: boolean;
    syncExams: boolean;
    syncSchedule: boolean;
    syncReminders: boolean;
    defaultTime: string;
    lastSyncedAt: Date | null;
  }): CalendarIntegrationResponse {
    const baseUrl = env.API_URL.replace(/\/$/, '');
    const feedUrl = `${baseUrl}/api/calendar/feed/${integration.feedToken}.ics`;
    const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');
    const googleCalendarWebUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;

    return {
      id: integration.id,
      feedToken: integration.feedToken,
      feedUrl,
      webcalUrl,
      googleCalendarWebUrl,
      isGoogleConnected: Boolean(integration.googleAccessToken),
      isGoogleConfigured: this.googleClient.isConfigured(),
      syncTasks: integration.syncTasks,
      syncExams: integration.syncExams,
      syncSchedule: integration.syncSchedule,
      syncReminders: integration.syncReminders,
      defaultTime: integration.defaultTime,
      lastSyncedAt: integration.lastSyncedAt,
    };
  }

  private async getValidGoogleAccessToken(integration: {
    userId: string;
    googleAccessToken: string | null;
    googleRefreshToken: string | null;
    googleTokenExpiry: Date | null;
  }): Promise<string> {
    const isExpired = integration.googleTokenExpiry && integration.googleTokenExpiry.getTime() <= Date.now() + 60000;

    if (!isExpired && integration.googleAccessToken) {
      return isEncrypted(integration.googleAccessToken)
        ? decryptData(integration.googleAccessToken, integration.userId)
        : integration.googleAccessToken;
    }

    if (!integration.googleRefreshToken) {
      throw new AppError(401, 'GOOGLE_REAUTH_REQUIRED', 'Sessão com Google expirada. Reconecte sua conta.');
    }

    const plainRefreshToken = isEncrypted(integration.googleRefreshToken)
      ? decryptData(integration.googleRefreshToken, integration.userId)
      : integration.googleRefreshToken;

    const refreshed = await this.googleClient.refreshAccessToken(plainRefreshToken);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    const encryptedRefreshedToken = encryptData(refreshed.access_token, integration.userId);

    await prisma.userCalendarIntegration.update({
      where: { userId: integration.userId },
      data: {
        googleAccessToken: encryptedRefreshedToken,
        googleTokenExpiry: newExpiresAt,
      },
    });

    return refreshed.access_token;
  }
}
