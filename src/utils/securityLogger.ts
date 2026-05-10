import { Request } from 'express';

type SecurityEvent = {
  event: string;
  req?: Request;
  userId?: string;
  role?: string;
  resourceId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export function securityLog({ event, req, userId, role, resourceId, reason, metadata }: SecurityEvent) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ip: req?.ip,
    method: req?.method,
    path: req?.originalUrl,
    userId,
    role,
    resourceId,
    reason,
    metadata,
  };

  console.log(JSON.stringify(entry));
}
