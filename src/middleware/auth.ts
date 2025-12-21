
import jwt from 'jsonwebtoken';
export const requireAuth = (roles = []) => {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Token em falta' });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { id, role }
      if (roles.length && !roles.includes(req.user.role))
        return res.status(403).json({ error: 'Sem permissões' });
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};
