import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../src/utils/prisma';
import { seedCatalog } from './seedData';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});

  await seedCatalog();

  console.log('Seed concluido (SQLite + Prisma).');
}

main()
  .catch((e) => {
    console.error('Seed falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
