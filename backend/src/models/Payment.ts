import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    utrNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
