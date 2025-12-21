import { Router } from 'express';
import { validationResult } from 'express-validator';

import Product from '../models/Product';
import Order from '../models/Order';
import Coupon from '../models/Coupon';
import { orderBody } from '../utils/validators';
import { requireAuth } from '../middleware/auth';

const r = Router();

// POST /orders (cliente autenticado)
// Cria uma encomenda de fruta com items, total e data (YYYY-MM-DD)
r.post('/', requireAuth(), orderBody, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { customerName, customerPhone, date, items, couponCode } = req.body as {
    customerName: string;
    customerPhone: string;
    date: string;
    items: Array<{ product: string; qty: number }>;
    couponCode?: string;
  };

  // Buscar produtos e calcular total
  const ids = items.map((i) => i.product);
  const dbProducts = await Product.find({ _id: { $in: ids } });
  const map = new Map(dbProducts.map((p) => [p._id.toString(), p]));

  let total = 0;
  const orderItems: Array<{ product: any; name: string; qty: number; unitPrice: number }> = [];

  for (const i of items) {
    const p = map.get(i.product);
    if (!p) return res.status(400).json({ error: `Produto inválido: ${i.product}` });

    // stock opcional: se existir, validar
    if (typeof p.stock === 'number' && p.stock < i.qty) {
      return res.status(409).json({ error: `Sem stock suficiente de ${p.name}` });
    }

    total += (p.price || 0) * i.qty;
    orderItems.push({ product: p._id, name: p.name, qty: i.qty, unitPrice: p.price });
  }

  // Descontar stock (se usado)
  for (const i of items) {
    const p = map.get(i.product);
    if (!p) continue;
    if (typeof p.stock === 'number') {
      await Product.updateOne({ _id: p._id }, { $inc: { stock: -i.qty } });
    }
  }

  // Aplicar cupão (opcional)
  let appliedCoupon: any = null;
  let discount = 0;
  if (couponCode) {
    const code = String(couponCode).toUpperCase().trim();
    const now = new Date();

    const c = await Coupon.findOne({ code }).lean();
    if (!c || c.active === false) {
      return res.status(400).json({ error: 'Cupão inválido' });
    }

    if (c.startsAt && now < new Date(c.startsAt)) {
      return res.status(400).json({ error: 'Cupão ainda não está ativo' });
    }
    if (c.endsAt && now > new Date(c.endsAt)) {
      return res.status(400).json({ error: 'Cupão expirado' });
    }
    if (typeof c.minTotal === 'number' && total < c.minTotal) {
      return res.status(400).json({ error: `Cupão requer mínimo de ${c.minTotal.toFixed(2)} €` });
    }
    if (typeof c.maxUses === 'number' && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) {
      return res.status(400).json({ error: 'Cupão esgotado' });
    }

    if (c.type === 'percent') {
      discount = (total * (Number(c.amount) || 0)) / 100;
    } else {
      discount = Number(c.amount) || 0;
    }
    discount = Math.max(0, Math.min(discount, total));
    appliedCoupon = c;
  }

  const finalTotal = Math.max(0, total - discount);

  const order = await Order.create({
    customer: (req as any).user.id,
    customerName,
    customerPhone,
    date,
    items: orderItems,
    total,
    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
    discount,
    finalTotal,
  });

  // Incrementar contador de uso do cupão
  if (appliedCoupon) {
    await Coupon.updateOne({ code: appliedCoupon.code }, { $inc: { usedCount: 1 } });
  }

  res.status(201).json({ data: order });
});

// GET /orders (admin/staff)
r.get('/', requireAuth(['admin', 'staff']), async (_req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  res.json({ data: orders });
});

// PATCH /orders/:id/status (admin/staff)
r.patch('/:id/status', requireAuth(['admin', 'staff']), async (req, res) => {
  const { status } = req.body as { status: string };
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Estado inválido' });

  const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!o) return res.status(404).json({ error: 'Encomenda não encontrada' });

  res.json({ data: o });
});

export default r;
