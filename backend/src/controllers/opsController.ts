import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Loan from '../models/Loan';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';

// 1. Sales Module Controller: Leads
export async function getSalesLeads(req: AuthRequest, res: Response) {
  try {
    // Find all users with role BORROWER
    const borrowers = await User.find({ role: 'BORROWER' }).select('-password').sort({ createdAt: -1 });

    // Fetch existing loan applicant IDs
    const loans = await Loan.find({}).select('borrowerId status createdAt amount');
    const loanMap = new Map<string, any>();
    loans.forEach((loan) => {
      loanMap.set(loan.borrowerId.toString(), loan);
    });

    const leads = borrowers.map((b) => {
      const existingLoan = loanMap.get(b._id.toString());
      return {
        id: b._id,
        name: b.name,
        email: b.email,
        createdAt: b.createdAt,
        pan: b.pan || 'N/A',
        monthlySalary: b.monthlySalary || 0,
        employmentMode: b.employmentMode || 'Not Provided',
        isBreEligible: b.isBreEligible || false,
        breRejectionReason: b.breRejectionReason || '',
        applicationStatus: existingLoan ? existingLoan.status : 'PRE_APPLICATION_LEAD',
        loanDetails: existingLoan || null,
      };
    });

    return res.json({ leads, count: leads.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch sales leads' });
  }
}

// 2. Sanction Module Controllers
export async function getSanctionLoans(req: AuthRequest, res: Response) {
  try {
    const loans = await Loan.find({ status: 'APPLIED' })
      .populate('borrowerId', 'name email pan dob monthlySalary employmentMode isBreEligible breRejectionReason')
      .sort({ createdAt: -1 });

    return res.json({ loans, count: loans.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch sanction queue' });
  }
}

export async function processSanctionDecision(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'APPROVE' | 'REJECT'

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    if (loan.status !== 'APPLIED') {
      return res.status(400).json({ error: `Cannot process sanction decision for loan with status '${loan.status}'` });
    }

    if (action === 'APPROVE') {
      loan.status = 'SANCTIONED';
      loan.sanctionedBy = new mongoose.Types.ObjectId(req.user.id);
      loan.sanctionedAt = new Date();
      await loan.save();

      return res.json({ message: 'Loan successfully Sanctioned / Approved!', loan });
    } else if (action === 'REJECT') {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return res.status(400).json({ error: 'A valid rejection reason is required when rejecting a loan.' });
      }
      loan.status = 'REJECTED';
      loan.rejectionReason = rejectionReason.trim();
      loan.sanctionedBy = new mongoose.Types.ObjectId(req.user.id);
      loan.sanctionedAt = new Date();
      await loan.save();

      return res.json({ message: 'Loan application Rejected.', loan });
    } else {
      return res.status(400).json({ error: "Invalid action. Allowed actions: 'APPROVE' or 'REJECT'" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process sanction decision' });
  }
}

// 3. Disbursement Module Controllers
export async function getDisbursementLoans(req: AuthRequest, res: Response) {
  try {
    const loans = await Loan.find({ status: 'SANCTIONED' })
      .populate('borrowerId', 'name email pan dob monthlySalary employmentMode')
      .populate('sanctionedBy', 'name email')
      .sort({ updatedAt: -1 });

    return res.json({ loans, count: loans.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch disbursement queue' });
  }
}

export async function disburseLoan(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found' });
    }

    if (loan.status !== 'SANCTIONED') {
      return res.status(400).json({ error: `Cannot disburse loan with status '${loan.status}'. Must be 'SANCTIONED'.` });
    }

    loan.status = 'DISBURSED';
    loan.disbursedBy = new mongoose.Types.ObjectId(req.user.id);
    loan.disbursedAt = new Date();
    await loan.save();

    return res.json({ message: 'Loan successfully marked as DISBURSED! Funds released.', loan });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to disburse loan' });
  }
}

// 4. Collection Module Controllers
export async function getCollectionLoans(req: AuthRequest, res: Response) {
  try {
    const loans = await Loan.find({ status: { $in: ['DISBURSED', 'CLOSED'] } })
      .populate('borrowerId', 'name email pan')
      .sort({ updatedAt: -1 });

    return res.json({ loans, count: loans.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch collection active loans' });
  }
}

export async function recordPayment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { loanId, utrNumber, amount, paymentDate } = req.body;

    if (!loanId || !utrNumber || !amount) {
      return res.status(400).json({ error: 'Loan ID, UTR Number, and Payment Amount are required.' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than ₹0.' });
    }

    const cleanUtr = utrNumber.trim().toUpperCase();

    // Check UTR Uniqueness
    const existingUtr = await Payment.findOne({ utrNumber: cleanUtr });
    if (existingUtr) {
      return res.status(400).json({
        error: `Duplicate UTR Number! UTR '${cleanUtr}' has already been recorded for another payment.`,
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found' });
    }

    if (loan.status !== 'DISBURSED') {
      return res.status(400).json({ error: `Cannot record payment for loan with status '${loan.status}'.` });
    }

    // Payment validation: Pay amount should not exceed remaining balance significantly
    if (payAmount > loan.remainingAmount + 10) {
      return res.status(400).json({
        error: `Payment amount ₹${payAmount} exceeds outstanding remaining balance of ₹${loan.remainingAmount}.`,
      });
    }

    // Create payment record
    const payment = new Payment({
      loanId: loan._id,
      borrowerId: loan.borrowerId,
      utrNumber: cleanUtr,
      amount: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: new mongoose.Types.ObjectId(req.user.id),
    });

    await payment.save();

    // Update loan balance
    loan.paidAmount = Math.round((loan.paidAmount + payAmount) * 100) / 100;
    loan.remainingAmount = Math.max(0, Math.round((loan.totalRepaymentAmount - loan.paidAmount) * 100) / 100);

    let wasClosed = false;
    if (loan.remainingAmount <= 0) {
      loan.status = 'CLOSED';
      loan.closedAt = new Date();
      wasClosed = true;
    }

    await loan.save();

    return res.json({
      message: wasClosed
        ? 'Payment recorded successfully! Loan has been fully repaid and AUTO-CLOSED.'
        : `Payment of ₹${payAmount} recorded successfully. Remaining balance: ₹${loan.remainingAmount}.`,
      payment,
      loan,
      isClosed: wasClosed,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate UTR Number! Payment with this UTR already exists in system.' });
    }
    return res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
}

export async function getLoanPayments(req: AuthRequest, res: Response) {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loanId })
      .populate('recordedBy', 'name email role')
      .sort({ paymentDate: -1 });

    return res.json({ payments, count: payments.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch payment ledger' });
  }
}
