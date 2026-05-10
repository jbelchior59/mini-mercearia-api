import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateResourceId } from '../middleware/validateResourceId';
import { validateRequest } from '../middleware/validateRequest';
import { productBody, productUpdateBody } from '../utils/validators';
import { verifyAccessToken } from '../utils/jwt';
import { securityLog } from '../utils/securityLogger';
import { prisma } from '../utils/prisma';
import { withLegacyId, withLegacyIds } from '../utils/apiShape';

const r = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname || '').toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      securityLog({ event: 'upload.rejected', req, reason: 'invalid_type' });
      const err: any = new Error('Tipo de imagem invalido');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function pickProductFields(body: any) {
  const allowed = ['name', 'price', 'category', 'available', 'imageUrl', 'description', 'stock'];
  return Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
}

r.get(
  '/',
  asyncHandler(async (req, res) => {
    let requestAll = false;
    if (String(req.query.all) === 'true') {
      try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (token) {
          const payload: any = verifyAccessToken(token);
          if (payload && (payload.role === 'admin' || payload.role === 'staff')) requestAll = true;
        }
      } catch {
        requestAll = false;
      }
    }

    const q = (req.query.q as string | undefined)?.trim().slice(0, 120);
    const available = req.query.available as string | undefined;
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const inStock = req.query.inStock as string | undefined;
    const sort = (req.query.sort as string | undefined) || 'name_asc';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 12)));

    const where: any = { category: 'fruta' };
    if (!requestAll) where.available = { not: false };
    if (available === 'true') where.available = true;
    if (available === 'false') where.available = false;
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      where.price = {};
      if (Number.isFinite(minPrice) && minPrice >= 0) where.price.gte = minPrice;
      if (Number.isFinite(maxPrice) && maxPrice >= 0) where.price.lte = maxPrice;
    }
    if (inStock === 'true') where.stock = { gt: 0 };
    if (q) where.OR = [{ name: { contains: q } }, { description: { contains: q } }];

    const orderBy: any =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : sort === 'newest'
            ? { createdAt: 'desc' }
            : { name: 'asc' };

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    ]);

    res.json({
      data: withLegacyIds(data),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), requestAll },
    });
  })
);

r.post(
  '/',
  requireAuth(['admin', 'staff']),
  productBody,
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const payload: any = pickProductFields(req.body);
    payload.category = 'fruta';
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);

    const p = await prisma.product.create({ data: payload });
    securityLog({ event: 'product.created', req, userId: req.user.id, role: req.user.role, resourceId: p.id });
    res.status(201).json({ data: withLegacyId(p) });
  })
);

r.patch(
  '/:id',
  requireAuth(['admin', 'staff']),
  validateResourceId('id'),
  productUpdateBody,
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const updates: any = pickProductFields(req.body);
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    const exists = await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Produto nao encontrado' });

    const p = await prisma.product.update({ where: { id: req.params.id }, data: updates });
    securityLog({ event: 'product.updated', req, userId: req.user.id, role: req.user.role, resourceId: p.id });
    res.json({ data: withLegacyId(p) });
  })
);

r.post(
  '/:id/image',
  requireAuth(['admin', 'staff']),
  validateResourceId('id'),
  upload.single('image'),
  asyncHandler(async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'Ficheiro em falta' });

    const exists = await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Produto nao encontrado' });

    const p = await prisma.product.update({
      where: { id: req.params.id },
      data: { imageUrl: `/uploads/${req.file.filename}` },
    });

    res.json({ data: withLegacyId(p) });
  })
);

r.delete(
  '/:id',
  requireAuth(['admin']),
  validateResourceId('id'),
  asyncHandler(async (req: any, res) => {
    const exists = await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (exists) await prisma.product.delete({ where: { id: req.params.id } });
    securityLog({ event: 'product.deleted', req, userId: req.user.id, role: req.user.role, resourceId: req.params.id });
    res.status(204).end();
  })
);

export default r;
