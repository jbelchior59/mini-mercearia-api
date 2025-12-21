import { body } from 'express-validator';

// Produto (fruta)
export const productBody = [
  body('name').isString().trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('category').optional().isIn(['fruta']),
  body('available').optional().isBoolean(),
  body('stock').optional().isInt({ min: 0 }),
  body('imageUrl').optional().isString(),
  body('description').optional().isString(),
];

// Encomenda (fruta) — versão simples (sem slots de take-away)
export const orderBody = [
  body('customerName').isString().trim().notEmpty(),
  body('customerPhone').isString().trim().notEmpty(),
  body('date').isString().trim().notEmpty(), // 'YYYY-MM-DD'
  body('items').isArray({ min: 1 }),
  body('items.*.product').isString().notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
  // Cupão opcional (ex.: NATAL10)
  body('couponCode').optional().isString().trim().notEmpty(),
];
