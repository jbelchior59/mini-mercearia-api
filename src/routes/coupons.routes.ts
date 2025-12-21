import { Router } from 'express';
import Coupon from '../models/Coupon';
import { requireAuth } from '../middleware/auth';

const r = Router();

// GET /coupons (admin/staff)
// Lista cupões para gestão (inclui métricas como usedCount)
r.get('/', requireAuth(['admin', 'staff']), async (_req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  res.json({ data: coupons });
});

// POST /coupons (admin)
// Cria um cupão (code, type, amount, regras opcionais)
r.post('/', requireAuth(['admin']), async (req, res) => {
  const {
    code,
    type,
    amount,
    minTotal,
    startsAt,
    endsAt,
    maxUses,
    active,
  } = req.body as any;

  if (!code || !type || typeof amount !== 'number') {
    return res.status(400).json({ error: 'code, type e amount são obrigatórios' });
  }

  const doc = await Coupon.create({
    code: String(code).toUpperCase().trim(),
    type,
    amount,
    minTotal,
    startsAt: startsAt ? new Date(startsAt) : undefined,
    endsAt: endsAt ? new Date(endsAt) : undefined,
    maxUses,
    active,
  });

  res.status(201).json({ data: doc });
});

// PATCH /coupons/:id (admin)
// Atualiza um cupão (ex.: ativar/desativar, mudar datas, etc.)
r.patch('/:id', requireAuth(['admin']), async (req, res) => {
  const updates = { ...req.body } as any;

  // Normalizações
  if (updates.code) updates.code = String(updates.code).toUpperCase().trim();
  if (updates.startsAt) updates.startsAt = new Date(updates.startsAt);
  if (updates.endsAt) updates.endsAt = new Date(updates.endsAt);

  const doc = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!doc) return res.status(404).json({ error: 'Cupão não encontrado' });

  res.json({ data: doc });
});

// DELETE /coupons/:id (admin)
r.delete('/:id', requireAuth(['admin']), async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default r;
