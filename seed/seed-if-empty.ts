import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../src/utils/prisma';
import { seedCatalog } from './seedData';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const productCount = await prisma.product.count();
  const couponCount = await prisma.coupon.count();

  if (productCount > 0 || couponCount > 0) {
    console.log('Seed ignorado: base de dados ja tem dados.');
    return;
  }

  await seedCatalog();
  console.log('Seed inicial concluido (SQLite + Prisma).');
}

main()
  .catch((e) => {
    console.error('Seed inicial falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
