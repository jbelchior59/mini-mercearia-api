
import { Router } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
const r = Router();
r.post('/bootstrap-admin', async (req, res) => {
  const { name='Admin', email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e password obrigatórios' });
  let user = await User.findOne({ email });
  if (user) return res.status(409).json({ error: 'Já existe' });
  user = new User({ name, email, role: 'admin' });
  await (user as any).setPassword(password);
  await user.save();
  res.json({ message: 'Admin criado' });
});

r.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email e password obrigatórios' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email já registado' });
  const user = new User({ name, email, role: 'customer' });
  await (user as any).setPassword(password);
  await user.save();
  res.status(201).json({ message: 'Conta criada' });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await (user as any).comparePassword(password))) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, name: user.name });
});

/**
 * GET /auth/me
 * Devolve dados básicos do utilizador autenticado (para UI: checkout, etc.)
 */
r.get('/me', requireAuth(), async (req: any, res) => {
  const u = await User.findById(req.user.id).select('name email role');
  if (!u) return res.status(404).json({ error: 'Utilizador não encontrado' });
  return res.json({ data: { id: u._id, name: u.name, email: u.email, role: u.role } });
});

export default r;

