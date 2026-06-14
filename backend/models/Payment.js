import mongoose from 'mongoose';
const PaymentSchema = new mongoose.Schema({
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paidBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paidTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:    { type: Number, required: true, min: 0.01 },
  note:      { type: String, trim: true }
}, { timestamps: true });
export default mongoose.model('Payment', PaymentSchema);
