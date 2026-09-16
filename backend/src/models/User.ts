import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'BORROWER' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'ADMIN';
export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  isBreEligible?: boolean;
  breRejectionReason?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['BORROWER', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION', 'ADMIN'],
      default: 'BORROWER',
      required: true,
    },
    pan: { type: String, uppercase: true, trim: true },
    dob: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'],
    },
    isBreEligible: { type: Boolean, default: false },
    breRejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

export default mongoose.model<IUser>('User', UserSchema);
