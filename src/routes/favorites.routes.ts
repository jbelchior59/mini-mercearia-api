import { Router } from 'express';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth';
import User from '../models/User';
import Product from '../models/Product';

/**
 * Extra — Favoritos (wishlist)
 * Guarda/remover produtos favoritos na BD (User.favorites).
 */
const router = Router();

// GET /favorites -> lista favoritos do user autenticado
router.get('/', requireAuth(), async (req: any, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'favorites',
    select: 'name price category available imageUrl createdAt description',
  });

  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
  return res.json({ data: user.favorites || [] });
});

// POST /favorites/:productId -> adiciona (idempotente)
router.post('/:productId', requireAuth(), async (req: any, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId))
    return res.status(400).json({ error: 'productId inválido' });

  const product = await Product.findById(productId).select('_id');
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  await User.updateOne({ _id: req.user.id }, { $addToSet: { favorites: product._id } });
  return res.status(201).json({ ok: true });
});

// DELETE /favorites/:productId -> remove
router.delete('/:productId', requireAuth(), async (req: any, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId))
    return res.status(400).json({ error: 'productId inválido' });

  await User.updateOne({ _id: req.user.id }, { $pull: { favorites: productId } });
  return res.json({ ok: true });
});

export default router;
