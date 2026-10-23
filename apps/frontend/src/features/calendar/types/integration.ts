export interface CalendarIntegration {
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
  lastSyncedAt: string | null;
}

export interface UpdateCalendarIntegrationPayload {
  syncTasks?: boolean;
  syncExams?: boolean;
  defaultTime?: string;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
  isConfigured: boolean;
}

export interface SyncGoogleResponse {
  syncedEventsCount: number;
}
