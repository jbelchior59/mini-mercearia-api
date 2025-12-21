import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import Product from '../models/Product';
import { requireAuth } from '../middleware/auth';

const r = Router();

// Upload (extra): imagens de produtos
// Guardamos em /uploads e expomos via /uploads/<ficheiro>
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /products
// - Public: only available fruit products
// - Admin/Staff: can request all products with ?all=true and a valid JWT
// GET /products (extra): pesquisa + filtros + paginação
// Público: por default só devolve fruta disponível.
// Admin/Staff: pode pedir tudo com ?all=true e JWT válido.
r.get('/', async (req, res) => {
  // Auth opcional: só para permitir ?all=true
  let requestAll = false;
  if (String(req.query.all) === 'true') {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (token) {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);
        if (payload && (payload.role === 'admin' || payload.role === 'staff')) requestAll = true;
      }
    } catch {
      requestAll = false;
    }
  }

  const q = (req.query.q as string | undefined)?.trim();
  const available = req.query.available as string | undefined;
  const minPrice = req.query.minPrice as string | undefined;
  const maxPrice = req.query.maxPrice as string | undefined;
  const inStock = req.query.inStock as string | undefined;
  const sort = (req.query.sort as string | undefined) || 'name_asc';
  const page = Math.max(1, Number(req.query.page || 1));
  // Nota: o cliente pede um limite alto para mostrar todos os artigos.
  // Mantemos um teto para evitar abusos, mas maior do que 50 para não "cortar" o catálogo.
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 12)));

  const filter: any = {};

  // Base: fruta
  filter.category = 'fruta';

  // Público vê apenas disponíveis
  if (!requestAll) filter.available = { $ne: false };

  // Filtros
  if (available === 'true') filter.available = true;
  if (available === 'false') filter.available = false;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (inStock === 'true') filter.stock = { $gt: 0 };

  // Pesquisa simples (texto/regex)
  if (q) {
    // Se quiseres usar índice de texto, podes trocar para $text
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }

  // Ordenação
  const sortObj: any = {};
  if (sort === 'price_asc') sortObj.price = 1;
  else if (sort === 'price_desc') sortObj.price = -1;
  else if (sort === 'newest') sortObj.createdAt = -1;
  else sortObj.name = 1;

  const total = await Product.countDocuments(filter);
  const data = await Product.find(filter)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      requestAll,
    },
  });
});

// POST /products - create product (admin or staff)
r.post('/', requireAuth(['admin', 'staff']), async (req, res) => {
  const { name, price, available, imageUrl, description, stock } = req.body;
  const category = 'fruta';
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'name e price obrigatórios' });

  const p = new Product({ name, price, category, available, imageUrl, description, stock });
  await p.save();
  res.status(201).json({ data: p });
});

// PATCH /products/:id - update product (admin or staff)
r.patch('/:id', requireAuth(['admin', 'staff']), async (req, res) => {
  const updates = req.body;
  const p = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json({ data: p });
});

// POST /products/:id/image (admin/staff)
// Upload de imagem e atualiza imageUrl do produto
r.post('/:id/image', requireAuth(['admin', 'staff']), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ficheiro em falta (campo: image)' });

  const imageUrl = `/uploads/${req.file.filename}`;
  const p = await Product.findByIdAndUpdate(req.params.id, { imageUrl }, { new: true });
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });

  res.json({ data: p });
});

// DELETE /products/:id - delete product (admin only)
r.delete('/:id', requireAuth(['admin']), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default r;
