import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import Loan from '../models/Loan';
import User from '../models/User';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { calculateLoanMath } from '../services/breService';
import { ensureUploadsDirectory } from '../utils/initUploads';

export async function uploadSalarySlipHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a salary slip file to upload (PDF, JPG, PNG under 5MB).' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      message: 'Salary slip uploaded successfully',
      salarySlipUrl: fileUrl,
      originalName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to upload salary slip' });
  }
}

export async function applyLoanHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // BRE Verification Check
    if (!user.isBreEligible) {
      return res.status(400).json({
        error: 'You cannot apply for a loan because your profile failed Business Rule Engine (BRE) checks.',
        details: user.breRejectionReason,
      });
    }

    const { amount, tenureDays, salarySlipUrl, salarySlipOriginalName } = req.body;

    const loanAmount = Number(amount);
    const tenure = Number(tenureDays);

    if (isNaN(loanAmount) || loanAmount < 50000 || loanAmount > 500000) {
      return res.status(400).json({ error: 'Loan amount must be between ₹50,000 and ₹500,000.' });
    }

    if (isNaN(tenure) || tenure < 30 || tenure > 365) {
      return res.status(400).json({ error: 'Loan tenure must be between 30 days and 365 days.' });
    }

    if (!salarySlipUrl) {
      return res.status(400).json({ error: 'Salary slip document is required before submitting application.' });
    }

    // Check if user already has an active or pending loan
    const existingActiveLoan = await Loan.findOne({
      borrowerId: user._id,
      status: { $in: ['APPLIED', 'SANCTIONED', 'DISBURSED'] },
    });

    if (existingActiveLoan) {
      return res.status(400).json({
        error: `You currently have an active loan (Status: ${existingActiveLoan.status}). Please complete or wait for its resolution before applying for a new loan.`,
      });
    }

    const interestRate = 12.0; // 12% p.a.
    const { interestAmount, totalRepaymentAmount } = calculateLoanMath(loanAmount, tenure, interestRate);

    const newLoan = new Loan({
      borrowerId: user._id,
      amount: loanAmount,
      tenureDays: tenure,
      interestRate,
      interestAmount,
      totalRepaymentAmount,
      paidAmount: 0,
      remainingAmount: totalRepaymentAmount,
      status: 'APPLIED',
      salarySlipUrl,
      salarySlipOriginalName: salarySlipOriginalName || 'Salary_Slip',
    });

    await newLoan.save();

    return res.status(201).json({
      message: 'Loan application submitted successfully!',
      loan: newLoan,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error submitting loan application' });
  }
}

export async function getMyLoansHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const loans = await Loan.find({ borrowerId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ loans });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch loans' });
  }
}

export async function getLoanByIdHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const loan = await Loan.findById(id).populate('borrowerId', 'name email pan dob monthlySalary employmentMode');
    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found' });
    }

    // Access check: Borrower can only view their own loan, admins and execs can view any
    if (req.user.role === 'BORROWER' && loan.borrowerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this loan application.' });
    }

    const payments = await Payment.find({ loanId: loan._id }).sort({ paymentDate: -1 });

    return res.json({ loan, payments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch loan details' });
  }
}

export async function downloadDocumentHandler(req: AuthRequest, res: Response) {
  try {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const targetDir = ensureUploadsDirectory();
    const filePath = path.join(targetDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File '${sanitizedFilename}' not found on server.` });
    }

    return res.sendFile(filePath);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to download document' });
  }
}
