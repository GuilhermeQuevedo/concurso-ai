export interface AuditContext {
  adminId: string;
  ip: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      auditContext?: AuditContext;
    }
  }
}

export {};
