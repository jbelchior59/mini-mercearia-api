import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/orders.routes';
import couponRoutes from './routes/coupons.routes';
import favoritesRoutes from './routes/favorites.routes';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

if (process.env.NODE_ENV !== 'production') {
  console.log('ENV PATH:', envPath);
  console.log('ENV EXISTS:', fs.existsSync(envPath));
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

const app = express();

const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGIN || 'http://localhost:4000,http://127.0.0.1:4000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error('CORS origin not allowed'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/coupons', couponRoutes);
app.use('/favorites', favoritesRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
});
