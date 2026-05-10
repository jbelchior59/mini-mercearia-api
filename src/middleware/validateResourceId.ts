import { NextFunction, Request, Response } from 'express';

const localIdPattern = /^[A-Za-z0-9_-]{8,64}$/;

export const validateResourceId = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!value || !localIdPattern.test(value)) {
      return res.status(400).json({ error: 'Identificador invalido' });
    }
    next();
  };
};
