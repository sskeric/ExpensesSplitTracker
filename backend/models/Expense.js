import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  amount:   { type: Number, required: true, min: 0.01 }
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
  group:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0.01 },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payments:    [PaymentSchema],
  totalPaid:   { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Expense', ExpenseSchema);
