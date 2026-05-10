import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { validateResourceId } from '../middleware/validateResourceId';
import { asyncHandler } from '../middleware/asyncHandler';
import { prisma } from '../utils/prisma';
import { withLegacyIds } from '../utils/apiShape';

const router = Router();

router.get(
  '/',
  requireAuth(),
  asyncHandler(async (req: any, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { favorites: true },
    });

    if (!user) return res.status(404).json({ error: 'Utilizador nao encontrado' });
    return res.json({ data: withLegacyIds(user.favorites || []) });
  })
);

router.post(
  '/:productId',
  requireAuth(),
  validateResourceId('productId'),
  asyncHandler(async (req: any, res) => {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { favorites: { connect: { id: product.id } } },
    });
    return res.status(201).json({ ok: true });
  })
);

router.delete(
  '/:productId',
  requireAuth(),
  validateResourceId('productId'),
  asyncHandler(async (req: any, res) => {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { favorites: { disconnect: { id: req.params.productId } } },
    });
    return res.json({ ok: true });
  })
);

export default router;
