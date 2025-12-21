import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    // Data pretendida (simples, sem sistema de slots)
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, min: 0, required: true },

    // Cupões/Descontos (extra)
    couponCode: { type: String },
    discount: { type: Number, min: 0, default: 0 },
    finalTotal: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
