import { body, param } from 'express-validator';

const optionalDate = (field: string) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage(`${field} deve ser uma data valida`);

export const objectIdParam = (field = 'id') => [
  param(field).matches(/^[A-Za-z0-9_-]{8,64}$/).withMessage('Identificador invalido'),
];

export const registerBody = [
  body('name').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Nome invalido'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password deve ter pelo menos 8 caracteres'),
];

export const bootstrapAdminBody = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage('Nome invalido'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password deve ter pelo menos 8 caracteres'),
];

export const loginBody = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }).withMessage('Password invalida'),
];

export const productBody = [
  body('name').isString().trim().isLength({ min: 1, max: 120 }).withMessage('Nome invalido'),
  body('price').isFloat({ min: 0, max: 100000 }).withMessage('Preco invalido'),
  body('category').optional().isIn(['fruta']),
  body('available').optional().isBoolean(),
  body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock invalido'),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('description').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1000 }),
];

export const productUpdateBody = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }).withMessage('Nome invalido'),
  body('price').optional().isFloat({ min: 0, max: 100000 }).withMessage('Preco invalido'),
  body('category').optional().isIn(['fruta']),
  body('available').optional().isBoolean(),
  body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock invalido'),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('description').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1000 }),
];

export const orderBody = [
  body('customerName').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Nome invalido'),
  body('customerPhone').isString().trim().isLength({ min: 6, max: 30 }).withMessage('Telefone invalido'),
  body('date').isISO8601().withMessage('Data invalida'),
  body('items').isArray({ min: 1 }).withMessage('Items obrigatorios'),
  body('items.*.product').matches(/^[A-Za-z0-9_-]{8,64}$/).withMessage('Produto invalido'),
  body('items.*.qty').isInt({ min: 1, max: 1000 }).withMessage('Quantidade invalida'),
  body('couponCode').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 1, max: 40 }),
];

export const updateOrderStatusBody = [
  body('status').isIn(['pending', 'confirmed', 'cancelled']).withMessage('Estado invalido'),
];

export const couponBody = [
  body('code')
    .isString()
    .trim()
    .isLength({ min: 2, max: 40 })
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Codigo invalido'),
  body('type').isIn(['percent', 'fixed']).withMessage('Tipo invalido'),
  body('amount')
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Valor invalido')
    .custom((amount, { req }) => req.body.type !== 'percent' || Number(amount) <= 100)
    .withMessage('Percentagem invalida'),
  body('minTotal').optional().isFloat({ min: 0, max: 100000 }).withMessage('Minimo invalido'),
  optionalDate('startsAt'),
  optionalDate('endsAt'),
  body('maxUses').optional({ nullable: true }).isInt({ min: 0, max: 1000000 }).withMessage('MaxUses invalido'),
  body('active').optional().isBoolean(),
];

export const couponUpdateBody = [
  body('code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 40 })
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Codigo invalido'),
  body('type').optional().isIn(['percent', 'fixed']).withMessage('Tipo invalido'),
  body('amount').optional().isFloat({ min: 0.01, max: 100000 }).withMessage('Valor invalido'),
  body('minTotal').optional().isFloat({ min: 0, max: 100000 }).withMessage('Minimo invalido'),
  optionalDate('startsAt'),
  optionalDate('endsAt'),
  body('maxUses').optional({ nullable: true }).isInt({ min: 0, max: 1000000 }).withMessage('MaxUses invalido'),
  body('active').optional().isBoolean(),
];
