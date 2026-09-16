import mongoose, { Schema, Document } from 'mongoose';

export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepaymentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: LoanStatus;
  rejectionReason?: string;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema = new Schema(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenureDays: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12.0 },
    interestAmount: { type: Number, required: true },
    totalRepaymentAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'],
      default: 'APPLIED',
      required: true,
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
