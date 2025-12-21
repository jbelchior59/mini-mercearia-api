import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Projeto (fase 1): apenas fruta
    category: {
      type: String,
      enum: ['fruta'],
      default: 'fruta',
      required: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    imageUrl: String,
    stock: { type: Number, default: 0 },
    description: String,
  },
  { timestamps: true }
);

// Index de texto para pesquisa (nome + descrição)
ProductSchema.index({ name: 'text', description: 'text' });

const Product = (mongoose.models.Product as any) ?? mongoose.model('Product', ProductSchema);
export default Product;

