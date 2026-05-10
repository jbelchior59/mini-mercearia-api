import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateResourceId } from '../middleware/validateResourceId';
import { validateRequest } from '../middleware/validateRequest';
import { couponBody, couponUpdateBody } from '../utils/validators';
import { securityLog } from '../utils/securityLogger';
import { prisma } from '../utils/prisma';
import { withLegacyId, withLegacyIds } from '../utils/apiShape';

const r = Router();

function pickCouponFields(body: any) {
  const allowed = ['code', 'type', 'amount', 'minTotal', 'startsAt', 'endsAt', 'maxUses', 'active'];
  const updates: any = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

  if (updates.code) updates.code = String(updates.code).toUpperCase().trim();
  if (updates.amount !== undefined) updates.amount = Number(updates.amount);
  if (updates.minTotal !== undefined) updates.minTotal = Number(updates.minTotal);
  if (updates.maxUses !== undefined && updates.maxUses !== null && updates.maxUses !== '') updates.maxUses = Number(updates.maxUses);
  if (updates.maxUses === null || updates.maxUses === '') updates.maxUses = null;
  if (updates.startsAt) updates.startsAt = new Date(updates.startsAt);
  if (updates.endsAt) updates.endsAt = new Date(updates.endsAt);

  return updates;
}

r.get(
  '/',
  requireAuth(['admin', 'staff']),
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: withLegacyIds(coupons) });
  })
);

r.post(
  '/',
  requireAuth(['admin']),
  couponBody,
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const doc = await prisma.coupon.create({ data: pickCouponFields(req.body) });
    securityLog({ event: 'coupon.created', req, userId: req.user.id, role: req.user.role, resourceId: doc.id });
    res.status(201).json({ data: withLegacyId(doc) });
  })
);

r.patch(
  '/:id',
  requireAuth(['admin']),
  validateResourceId('id'),
  couponUpdateBody,
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const exists = await prisma.coupon.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Cupao nao encontrado' });

    const doc = await prisma.coupon.update({ where: { id: req.params.id }, data: pickCouponFields(req.body) });
    securityLog({ event: 'coupon.updated', req, userId: req.user.id, role: req.user.role, resourceId: doc.id });
    res.json({ data: withLegacyId(doc) });
  })
);

r.delete(
  '/:id',
  requireAuth(['admin']),
  validateResourceId('id'),
  asyncHandler(async (req: any, res) => {
    const exists = await prisma.coupon.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (exists) await prisma.coupon.delete({ where: { id: req.params.id } });
    securityLog({ event: 'coupon.deleted', req, userId: req.user.id, role: req.user.role, resourceId: req.params.id });
    res.status(204).end();
  })
);

export default r;
