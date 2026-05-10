import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { securityLog } from '../utils/securityLogger';

type Role = 'admin' | 'staff' | 'customer';

export const requireAuth = (roles: Role[] = []) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        securityLog({ event: 'auth.missing_token', req, reason: 'missing_token' });
        return res.status(401).json({ error: 'Autenticacao obrigatoria' });
      }

      const payload = verifyAccessToken(token);
      req.user = payload;

      if (roles.length && !roles.includes(req.user.role)) {
        securityLog({
          event: 'auth.forbidden',
          req,
          userId: req.user.id,
          role: req.user.role,
          reason: 'insufficient_role',
        });
        return res.status(403).json({ error: 'Sem permissoes' });
      }

      next();
    } catch {
      securityLog({ event: 'auth.invalid_token', req, reason: 'invalid_token' });
      return res.status(401).json({ error: 'Autenticacao invalida' });
    }
  };
};
