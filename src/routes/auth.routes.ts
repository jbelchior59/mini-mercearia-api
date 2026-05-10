import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validateRequest';
import { bootstrapAdminBody, loginBody, registerBody } from '../utils/validators';
import { signAccessToken } from '../utils/jwt';
import { securityLog } from '../utils/securityLogger';
import { prisma } from '../utils/prisma';

const r = Router();

r.post(
  '/bootstrap-admin',
  registerRateLimiter,
  bootstrapAdminBody,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name = 'Admin', email, password } = req.body;

    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
    if (adminExists) return res.status(403).json({ error: 'Bootstrap bloqueado' });

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return res.status(409).json({ error: 'Utilizador ja existe' });

    await prisma.user.create({
      data: {
        name,
        email,
        role: 'admin',
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    return res.json({ message: 'Admin criado' });
  })
);

r.post(
  '/register',
  registerRateLimiter,
  registerBody,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return res.status(409).json({ error: 'Email ja registado' });

    await prisma.user.create({
      data: {
        name,
        email,
        role: 'customer',
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    return res.status(201).json({ message: 'Conta criada' });
  })
);

r.post(
  '/login',
  loginRateLimiter,
  loginBody,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      securityLog({ event: 'auth.login_failed', req, reason: 'invalid_credentials' });
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const token = signAccessToken({ id: user.id, role: user.role });
    securityLog({ event: 'auth.login_success', req, userId: user.id, role: user.role });

    return res.json({ token, role: user.role, name: user.name });
  })
);

r.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req: any, res) => {
    const u = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!u) return res.status(404).json({ error: 'Utilizador nao encontrado' });

    return res.json({ data: u });
  })
);

export default r;
