import { Router } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';

const r = Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não definido (Render Environment / .env).');
  return secret;
}

/**
 * POST /auth/bootstrap-admin
 * Cria o primeiro admin APENAS se ainda não existir nenhum admin.
 * Body: { name?, email, password }
 */
r.post('/bootstrap-admin', async (req, res) => {
  try {
    const { name = 'Admin', email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email e password obrigatórios' });
    }

    // Só deixa bootstrap se não existir nenhum admin
    const adminExists = await User.findOne({ role: 'admin' }).select('_id').lean();
    if (adminExists) {
      return res.status(403).json({ error: 'Bootstrap bloqueado: já existe um admin.' });
    }

    const exists = await User.findOne({ email }).select('_id').lean();
    if (exists) return res.status(409).json({ error: 'Já existe' });

    const user = new User({ name, email, role: 'admin' });
    await (user as any).setPassword(password);
    await user.save();

    return res.json({ message: 'Admin criado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

r.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email e password obrigatórios' });
    }

    const exists = await User.findOne({ email }).select('_id').lean();
    if (exists) return res.status(409).json({ error: 'Email já registado' });

    const user = new User({ name, email, role: 'customer' });
    await (user as any).setPassword(password);
    await user.save();

    return res.status(201).json({ message: 'Conta criada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await (user as any).comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    return res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * GET /auth/me
 */
r.get('/me', requireAuth(), async (req: any, res) => {
  try {
    const u = await User.findById(req.user.id).select('name email role');
    if (!u) return res.status(404).json({ error: 'Utilizador não encontrado' });

    return res.json({ data: { id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default r;
