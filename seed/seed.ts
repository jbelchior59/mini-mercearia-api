import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../src/models/Product';
import Coupon from '../src/models/Coupon';

import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI em falta no .env');

  await mongoose.connect(uri);

  // Limpar produtos antigos
  await Product.deleteMany({});
  await Coupon.deleteMany({});

  // Catálogo inicial
  // Nota: para o cliente mostrar *todas* as imagens/artigos existentes,
  // sem ficar preso às 5 frutas iniciais, semeamos também os novos itens.
  // (As imagens estão em /public/img/fruta)
  await Product.insertMany([
    { name: 'Banana', category: 'fruta', price: 1.49, available: true,
      stock: 999, imageUrl: '/img/fruta/banana.png' },
    { name: 'Maçã Fuji', category: 'fruta', price: 2.29, available: true,
      stock: 999, imageUrl: '/img/fruta/maca-fuji.png' },
    { name: 'Pera Rocha 75/80', category: 'fruta', price: 1.99, available: true,
      stock: 999, imageUrl: '/img/fruta/pera-rocha.png' },
    { name: 'Kiwi', category: 'fruta', price: 2.79, available: true,
      stock: 999, imageUrl: '/img/fruta/kiwi.png' },
    { name: 'Laranja', category: 'fruta', price: 1.59, available: true,
      stock: 999, imageUrl: '/img/fruta/laranja.png' },

    // Novas imagens/artigos
    { name: 'Melão', category: 'fruta', price: 2.49, available: true,
      stock: 999, imageUrl: '/img/fruta/melao.png' },
    { name: 'Pera Abacate', category: 'fruta', price: 2.19, available: true,
      stock: 999, imageUrl: '/img/fruta/pera-abacate.png' },
    { name: 'Alface', category: 'fruta', price: 1.19, available: true,
      stock: 999, imageUrl: '/img/fruta/alface.png' },
    { name: 'Cebola', category: 'fruta', price: 1.09, available: true,
      stock: 999, imageUrl: '/img/fruta/cebola.png' },
    { name: 'Batata Olho Perdiz', category: 'fruta', price: 1.79, available: true,
      stock: 999, imageUrl: '/img/fruta/batata_olho_perdiz.png' },
    { name: 'Cenoura', category: 'fruta', price: 0.99, available: true,
      stock: 999, imageUrl: '/img/fruta/cenoura.png' },
    { name: 'Couve Flor', category: 'fruta', price: 2.09, available: true,
      stock: 999, imageUrl: '/img/fruta/couve_flor.png' },
    { name: 'Pimento Verde', category: 'fruta', price: 1.69, available: true,
      stock: 999, imageUrl: '/img/fruta/pimento_verde.png' },
    { name: 'Pimento Vermelho', category: 'fruta', price: 1.89, available: true,
      stock: 999, imageUrl: '/img/fruta/pimento_vermelho.png' },
  ]);

  // Cupões de exemplo (extra)
  await Coupon.insertMany([
    { code: 'FRUTA10', type: 'percent', amount: 10, minTotal: 10, active: true, usedCount: 0 },
    { code: 'WELCOME5', type: 'fixed', amount: 5, minTotal: 15, active: true, usedCount: 0 },
  ]);

  console.log('✅ Seed concluído (fruta + cupões).');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ Seed falhou:', e);
  process.exit(1);
});
