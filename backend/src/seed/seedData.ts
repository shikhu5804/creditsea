import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';
import Loan from '../models/Loan';
import Payment from '../models/Payment';
import { calculateLoanMath } from '../services/breService';
import { createPersonalizedPdf } from '../utils/initUploads';

dotenv.config();

export async function runSeed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/creditsea';

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    } catch (err) {
      console.log('⚠️ Connecting to MongoMemoryServer for seed...');
      const mongod = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'creditsea' } });
      await mongoose.connect(mongod.getUri());
    }
  }

  console.log('🌱 Starting Database Seeding Process...');

  // Clean existing collections
  await User.deleteMany({});
  await Loan.deleteMany({});
  await Payment.deleteMany({});

  // Exact credentials required by assignment
  const usersToCreate = [
    {
      name: 'System Administrator',
      email: 'admin@lms.com',
      password: 'Admin@123',
      role: 'ADMIN',
    },
    {
      name: 'Sales Executive',
      email: 'sales@lms.com',
      password: 'Sales@123',
      role: 'SALES',
    },
    {
      name: 'Sanction Officer',
      email: 'sanction@lms.com',
      password: 'Sanction@123',
      role: 'SANCTION',
    },
    {
      name: 'Disbursement Manager',
      email: 'disbursement@lms.com',
      password: 'Disburse@123',
      role: 'DISBURSEMENT',
    },
    {
      name: 'Collection Agent',
      email: 'collection@lms.com',
      password: 'Collect@123',
      role: 'COLLECTION',
    },
    {
      name: 'Demo Borrower Account',
      email: 'borrower@lms.com',
      password: 'Borrow@123',
      role: 'BORROWER',
      pan: 'ABCDE1234F',
      dob: new Date('1995-05-15'),
      monthlySalary: 75000,
      employmentMode: 'SALARIED',
      isBreEligible: true,
    },
    {
      name: 'Priya Sharma (Applied)',
      email: 'priya@example.com',
      password: 'Borrow@123',
      role: 'BORROWER',
      pan: 'FGHIJ5678K',
      dob: new Date('1998-08-20'),
      monthlySalary: 60000,
      employmentMode: 'SALARIED',
      isBreEligible: true,
    },
    {
      name: 'Rahul Verma (Sanctioned)',
      email: 'rahul@example.com',
      password: 'Borrow@123',
      role: 'BORROWER',
      pan: 'LMNOP9012Q',
      dob: new Date('1992-02-10'),
      monthlySalary: 90000,
      employmentMode: 'SELF_EMPLOYED',
      isBreEligible: true,
    },
    {
      name: 'Amit Patel (Active Loan)',
      email: 'amit@example.com',
      password: 'Borrow@123',
      role: 'BORROWER',
      pan: 'RSTUV3456W',
      dob: new Date('1989-11-05'),
      monthlySalary: 120000,
      employmentMode: 'SALARIED',
      isBreEligible: true,
    },
    {
      name: 'Neha Gupta (Lead)',
      email: 'neha@example.com',
      password: 'Borrow@123',
      role: 'BORROWER',
      monthlySalary: 45000,
      isBreEligible: false,
    },
  ];

  const createdUsers: any = {};
  for (const uData of usersToCreate) {
    const user = new User(uData);
    await user.save();
    createdUsers[uData.email] = user;
  }

  console.log('✅ Created Accounts for Admin, Sales, Sanction, Disbursement, Collection, and Borrower.');

  // Create Sample Loans with Personalized Salary Slip PDFs
  const priyaPdfUrl = createPersonalizedPdf('Priya Sharma', 60000, 'Priya_Salary_Slip_July.pdf');
  const math1 = calculateLoanMath(150000, 180, 12);
  const loan1 = new Loan({
    borrowerId: createdUsers['priya@example.com']._id,
    amount: 150000,
    tenureDays: 180,
    interestRate: 12,
    interestAmount: math1.interestAmount,
    totalRepaymentAmount: math1.totalRepaymentAmount,
    paidAmount: 0,
    remainingAmount: math1.totalRepaymentAmount,
    status: 'APPLIED',
    salarySlipUrl: priyaPdfUrl,
    salarySlipOriginalName: 'Priya_Salary_Slip_July.pdf',
  });
  await loan1.save();

  const rahulPdfUrl = createPersonalizedPdf('Rahul Verma', 90000, 'Rahul_Salary_Slip.pdf');
  const math2 = calculateLoanMath(250000, 365, 12);
  const loan2 = new Loan({
    borrowerId: createdUsers['rahul@example.com']._id,
    amount: 250000,
    tenureDays: 365,
    interestRate: 12,
    interestAmount: math2.interestAmount,
    totalRepaymentAmount: math2.totalRepaymentAmount,
    paidAmount: 0,
    remainingAmount: math2.totalRepaymentAmount,
    status: 'SANCTIONED',
    salarySlipUrl: rahulPdfUrl,
    salarySlipOriginalName: 'Rahul_Salary_Slip.pdf',
    sanctionedBy: createdUsers['sanction@lms.com']._id,
    sanctionedAt: new Date(Date.now() - 86400000 * 2),
  });
  await loan2.save();

  const amitPdfUrl = createPersonalizedPdf('Amit Patel', 120000, 'Amit_Salary_Slip.pdf');
  const math3 = calculateLoanMath(100000, 90, 12);
  const loan3 = new Loan({
    borrowerId: createdUsers['amit@example.com']._id,
    amount: 100000,
    tenureDays: 90,
    interestRate: 12,
    interestAmount: math3.interestAmount,
    totalRepaymentAmount: math3.totalRepaymentAmount,
    paidAmount: 25000,
    remainingAmount: math3.totalRepaymentAmount - 25000,
    status: 'DISBURSED',
    salarySlipUrl: amitPdfUrl,
    salarySlipOriginalName: 'Amit_Salary_Slip.pdf',
    sanctionedBy: createdUsers['sanction@lms.com']._id,
    sanctionedAt: new Date(Date.now() - 86400000 * 10),
    disbursedBy: createdUsers['disbursement@lms.com']._id,
    disbursedAt: new Date(Date.now() - 86400000 * 8),
  });
  await loan3.save();

  const samplePayment = new Payment({
    loanId: loan3._id,
    borrowerId: loan3.borrowerId,
    utrNumber: 'UTR9876543210',
    amount: 25000,
    paymentDate: new Date(Date.now() - 86400000 * 3),
    recordedBy: createdUsers['collection@lms.com']._id,
  });
  await samplePayment.save();

  console.log('✅ Created Sample Loans and Payment Ledger Entries.');
  console.log('🚀 Seeding Completed Successfully!');

  return {
    users: usersToCreate,
    loansCount: 3,
  };
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding Failed:', err);
      process.exit(1);
    });
}
