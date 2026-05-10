import { Prisma } from '@prisma/client';
import { Router } from 'express';

import { orderBody, updateOrderStatusBody } from '../utils/validators';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateResourceId } from '../middleware/validateResourceId';
import { validateRequest } from '../middleware/validateRequest';
import { securityLog } from '../utils/securityLogger';
import { prisma } from '../utils/prisma';
import { withLegacyId } from '../utils/apiShape';

const r = Router();

function serializeOrder(order: any) {
  return {
    ...withLegacyId(order),
    items: (order.items || []).map((item: any) => withLegacyId(item)),
  };
}

async function rollbackStock(decremented: Array<{ id: string; qty: number }>) {
  await Promise.all(
    decremented.map((item) =>
      prisma.product.update({
        where: { id: item.id },
        data: { stock: { increment: item.qty } },
      })
    )
  );
}

async function reserveCoupon(code: string, total: number) {
  const now = new Date();
  const updated = await prisma.$executeRaw`
    UPDATE Coupon
    SET usedCount = usedCount + 1
    WHERE code = ${code}
      AND active = 1
      AND (startsAt IS NULL OR startsAt <= ${now})
      AND (endsAt IS NULL OR endsAt >= ${now})
      AND (minTotal IS NULL OR minTotal <= ${total})
      AND (maxUses IS NULL OR maxUses <= 0 OR usedCount < maxUses)
  `;

  if (Number(updated) !== 1) return null;
  return prisma.coupon.findUnique({ where: { code } });
}

r.post(
  '/',
  requireAuth(),
  orderBody,
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { customerName, customerPhone, date, items, couponCode } = req.body as {
      customerName: string;
      customerPhone: string;
      date: string;
      items: Array<{ product: string; qty: number }>;
      couponCode?: string;
    };

    const quantities = new Map<string, number>();
    for (const item of items) quantities.set(item.product, (quantities.get(item.product) || 0) + Number(item.qty));

    const ids = Array.from(quantities.keys());
    const dbProducts = await prisma.product.findMany({ where: { id: { in: ids } } });
    const map = new Map(dbProducts.map((p) => [p.id, p]));

    let total = 0;
    const orderItems: Array<{ productId: string; name: string; qty: number; unitPrice: number }> = [];

    for (const [productId, qty] of quantities.entries()) {
      const p = map.get(productId);
      if (!p) return res.status(400).json({ error: 'Produto invalido' });

      total += (p.price || 0) * qty;
      orderItems.push({ productId: p.id, name: p.name, qty, unitPrice: p.price });
    }

    const decremented: Array<{ id: string; qty: number }> = [];
    for (const [productId, qty] of quantities.entries()) {
      const result = await prisma.product.updateMany({
        where: { id: productId, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      if (result.count !== 1) {
        await rollbackStock(decremented);
        securityLog({ event: 'order.stock_failed', req, userId: req.user.id, resourceId: productId, reason: 'insufficient_stock' });
        return res.status(409).json({ error: 'Stock insuficiente' });
      }
      decremented.push({ id: productId, qty });
    }

    let appliedCoupon: any = null;
    let discount = 0;

    if (couponCode) {
      const code = String(couponCode).toUpperCase().trim();
      appliedCoupon = await reserveCoupon(code, total);

      if (!appliedCoupon) {
        await rollbackStock(decremented);
        return res.status(400).json({ error: 'Cupao invalido' });
      }

      discount = appliedCoupon.type === 'percent' ? (total * Number(appliedCoupon.amount || 0)) / 100 : Number(appliedCoupon.amount || 0);
      discount = Math.max(0, Math.min(discount, total));
    }

    try {
      const finalTotal = Math.max(0, total - discount);
      const order = await prisma.order.create({
        data: {
          customerId: req.user.id,
          customerName,
          customerPhone,
          date,
          total,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          discount,
          finalTotal,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      securityLog({ event: 'order.created', req, userId: req.user.id, resourceId: order.id });
      return res.status(201).json({ data: serializeOrder(order) });
    } catch (err) {
      await rollbackStock(decremented);
      if (appliedCoupon) {
        await prisma.coupon.update({ where: { id: appliedCoupon.id }, data: { usedCount: { decrement: 1 } } });
      }
      throw err;
    }
  })
);

r.get(
  '/',
  requireAuth(['admin', 'staff']),
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
    res.json({ data: orders.map(serializeOrder) });
  })
);

r.patch(
  '/:id/status',
  requireAuth(['admin', 'staff']),
  validateResourceId('id'),
  updateOrderStatusBody,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: string };
    const exists = await prisma.order.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Encomenda nao encontrada' });

    const o = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: status as Prisma.EnumOrderStatusFieldUpdateOperationsInput['set'] },
      include: { items: true },
    });

    res.json({ data: serializeOrder(o) });
  })
);

export default r;
