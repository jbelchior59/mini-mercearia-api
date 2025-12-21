import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  // Extra: lista de favoritos do cliente
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  role: { type: String, enum: ['admin','staff','customer'], default: 'customer' }
},{timestamps:true});
userSchema.methods.setPassword = async function(plain){ this.passwordHash = await bcrypt.hash(plain,10); };
userSchema.methods.comparePassword = async function(plain){ return bcrypt.compare(plain,this.passwordHash); };

const User = (mongoose.models.User as any) ?? mongoose.model('User', userSchema);
export default User;

