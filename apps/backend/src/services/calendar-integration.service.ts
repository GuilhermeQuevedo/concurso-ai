import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';
import { ICalGenerator } from '../utils/ical-generator.js';
import { GoogleCalendarClient } from '../providers/google-calendar.client.js';
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
  defaultTime: string;
  lastSyncedAt: Date | null;
}

export class CalendarIntegrationService {
  private readonly googleClient: GoogleCalendarClient;

  constructor(googleClient = new GoogleCalendarClient()) {
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

    if (integration.syncTasks) {
      await this.appendTasksToIcal(generator, integration.userId, integration.defaultTime);
    }

    if (integration.syncExams) {
      await this.appendExamsToIcal(generator, integration.userId);
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

    const integration = await prisma.userCalendarIntegration.update({
      where: { userId },
      data: {
        googleAccessToken: tokens.access_token,
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
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

    const tasks = integration.syncTasks
      ? await prisma.studyTask.findMany({ where: { userId, completed: false } })
      : [];

    const contests = integration.syncExams
      ? await prisma.contest.findMany({ where: { userId, examDate: { not: null } } })
      : [];

    let count = 0;
    for (const task of tasks) {
      const { startIso, endIso } = this.calculateTaskTimes(task.date, integration.defaultTime, task.duration);
      await this.googleClient.insertEvent(accessToken, calendarId, {
        summary: `[Engrama] ${task.title}`,
        description: `Matéria: ${task.discipline ?? 'Geral'}\nDuração: ${task.duration} min\nStatus: Pendente`,
        start: { dateTime: startIso, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endIso, timeZone: 'America/Sao_Paulo' },
      });
      count++;
    }

    for (const contest of contests) {
      if (!contest.examDate) continue;
      const dateString = contest.examDate.toISOString().slice(0, 10);
      await this.googleClient.insertEvent(accessToken, calendarId, {
        summary: `🎯 Prova: ${contest.name}`,
        description: `Data oficial da prova para o concurso ${contest.name}`,
        start: { date: dateString },
        end: { date: dateString },
      });
      count++;
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
      defaultTime: integration.defaultTime,
      lastSyncedAt: integration.lastSyncedAt,
    };
  }

  private async appendTasksToIcal(generator: ICalGenerator, userId: string, defaultTime: string): Promise<void> {
    const tasks = await prisma.studyTask.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    for (const task of tasks) {
      const { startDate, endDate } = this.calculateTaskDates(task.date, defaultTime, task.duration);
      generator.addEvent({
        uid: `task-${task.id}@engrama.app`,
        summary: `[Estudo] ${task.title}`,
        description: `Disciplina: ${task.discipline ?? 'Geral'}\nDuração: ${task.duration} min\nStatus: ${task.completed ? 'Concluída' : 'Pendente'}`,
        startDate,
        endDate,
        status: task.completed ? 'CONFIRMED' : 'TENTATIVE',
      });
    }
  }

  private async appendExamsToIcal(generator: ICalGenerator, userId: string): Promise<void> {
    const contests = await prisma.contest.findMany({
      where: { userId, examDate: { not: null } },
      orderBy: { examDate: 'asc' },
    });

    for (const contest of contests) {
      if (!contest.examDate) continue;
      generator.addEvent({
        uid: `contest-exam-${contest.id}@engrama.app`,
        summary: `🎯 Dia da Prova: ${contest.name}`,
        description: `Concurso: ${contest.name}\nCargo: ${contest.role ?? 'Não especificado'}`,
        startDate: contest.examDate,
        isAllDay: true,
        status: 'CONFIRMED',
      });
    }
  }

  private calculateTaskDates(date: Date, defaultTime: string, durationMinutes: number) {
    const [hoursStr, minutesStr] = defaultTime.split(':');
    const startDate = new Date(date);
    startDate.setHours(Number(hoursStr), Number(minutesStr), 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return { startDate, endDate };
  }

  private calculateTaskTimes(date: Date, defaultTime: string, durationMinutes: number) {
    const { startDate, endDate } = this.calculateTaskDates(date, defaultTime, durationMinutes);
    return {
      startIso: startDate.toISOString(),
      endIso: endDate.toISOString(),
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
      return integration.googleAccessToken;
    }

    if (!integration.googleRefreshToken) {
      throw new AppError(401, 'GOOGLE_REAUTH_REQUIRED', 'Sessão com Google expirada. Reconecte sua conta.');
    }

    const refreshed = await this.googleClient.refreshAccessToken(integration.googleRefreshToken);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await prisma.userCalendarIntegration.update({
      where: { userId: integration.userId },
      data: {
        googleAccessToken: refreshed.access_token,
        googleTokenExpiry: newExpiresAt,
      },
    });

    return refreshed.access_token;
  }
}
