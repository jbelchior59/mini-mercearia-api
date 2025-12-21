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

// Carregar variáveis de ambiente (.env) a partir da raiz do projeto
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Debug útil (podes apagar depois de confirmares)
console.log('ENV PATH:', envPath);
console.log('ENV EXISTS:', fs.existsSync(envPath));

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static (client)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Static (uploads) — imagens enviadas pelo admin (extra)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/coupons', couponRoutes);
app.use('/favorites', favoritesRoutes);

// Error handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`🚀 API em http://localhost:${PORT}`));
});
