import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

export const errorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Imagem demasiado grande' : 'Upload invalido';
    return res.status(400).json({ error: message });
  }

  if (err?.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message || 'Pedido invalido' });
  }

  console.error(err);
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    error: 'Erro interno',
    ...(isProduction ? {} : { detail: err?.message }),
  });
};
