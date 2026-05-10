import { prisma } from '../utils/prisma';

export const connectDB = async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  await prisma.$connect();
  console.log('SQLite ligado via Prisma');
};
