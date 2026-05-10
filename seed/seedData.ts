import { prisma } from '../src/utils/prisma';

export async function seedCatalog() {
  await prisma.product.createMany({
    data: [
      { name: 'Banana', category: 'fruta', price: 1.49, available: true, stock: 999, imageUrl: '/img/fruta/banana.png' },
      { name: 'Maca Fuji', category: 'fruta', price: 2.29, available: true, stock: 999, imageUrl: '/img/fruta/maca-fuji.png' },
      { name: 'Pera Rocha 75/80', category: 'fruta', price: 1.99, available: true, stock: 999, imageUrl: '/img/fruta/pera-rocha.png' },
      { name: 'Kiwi', category: 'fruta', price: 2.79, available: true, stock: 999, imageUrl: '/img/fruta/kiwi.png' },
      { name: 'Laranja', category: 'fruta', price: 1.59, available: true, stock: 999, imageUrl: '/img/fruta/laranja.png' },
      { name: 'Melao', category: 'fruta', price: 2.49, available: true, stock: 999, imageUrl: '/img/fruta/melao.png' },
      { name: 'Pera Abacate', category: 'fruta', price: 2.19, available: true, stock: 999, imageUrl: '/img/fruta/pera-abacate.png' },
      { name: 'Alface', category: 'fruta', price: 1.19, available: true, stock: 999, imageUrl: '/img/fruta/alface.png' },
      { name: 'Cebola', category: 'fruta', price: 1.09, available: true, stock: 999, imageUrl: '/img/fruta/cebola.png' },
      { name: 'Batata Olho Perdiz', category: 'fruta', price: 1.79, available: true, stock: 999, imageUrl: '/img/fruta/batata_olho_perdiz.png' },
      { name: 'Cenoura', category: 'fruta', price: 0.99, available: true, stock: 999, imageUrl: '/img/fruta/cenoura.png' },
      { name: 'Couve Flor', category: 'fruta', price: 2.09, available: true, stock: 999, imageUrl: '/img/fruta/couve_flor.png' },
      { name: 'Pimento Verde', category: 'fruta', price: 1.69, available: true, stock: 999, imageUrl: '/img/fruta/pimento_verde.png' },
      { name: 'Pimento Vermelho', category: 'fruta', price: 1.89, available: true, stock: 999, imageUrl: '/img/fruta/pimento_vermelho.png' },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      { code: 'FRUTA10', type: 'percent', amount: 10, minTotal: 10, active: true, usedCount: 0 },
      { code: 'WELCOME5', type: 'fixed', amount: 5, minTotal: 15, active: true, usedCount: 0 },
    ],
  });
}
