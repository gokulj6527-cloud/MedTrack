import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export function orgIdFor(req: AuthRequest, queryKey: string, bodyKey?: string): string | undefined {
  if (req.user?.role === 'ADMIN') {
    return (req.query[queryKey] as string) || (bodyKey ? req.body?.[bodyKey] : undefined) || req.user.organization_id;
  }
  return req.user?.organization_id;
}

export function denyIfMissingOrg(res: Response, orgId?: string) {
  if (!orgId) {
    res.status(400).json({ success: false, message: 'Organization context is required.' });
    return true;
  }
  return false;
}

export function assertOwnOrg(req: AuthRequest, resourceOrgId: string | undefined): boolean {
  if (!req.user) return false;
  if (req.user.role === 'ADMIN') return true;
  return Boolean(resourceOrgId && req.user.organization_id === resourceOrgId);
}
