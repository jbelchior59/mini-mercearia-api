import mongoose from 'mongoose';

// Cupão de desconto aplicado no checkout
// - code: identificador (ex: NATAL10)
// - type: percent (10%) ou fixed (5€)
// - amount: valor do desconto (percent => 0-100; fixed => euros)
// - regras: minTotal, janela temporal, maxUses/usedCount, active
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    amount: { type: Number, required: true, min: 0 },

    minTotal: { type: Number, min: 0, default: 0 },

    startsAt: { type: Date },
    endsAt: { type: Date },

    maxUses: { type: Number, min: 0 },
    usedCount: { type: Number, min: 0, default: 0 },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coupon = (mongoose.models.Coupon as any) ?? mongoose.model('Coupon', couponSchema);
export default Coupon;

