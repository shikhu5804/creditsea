import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { evaluateBRE } from '../services/breService';

const generateToken = (id: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET || 'creditsea_super_secret_jwt_key_2026';
  return jwt.sign({ id, email, role }, secret, { expiresIn: '7d' });
};

export async function signup(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Default role is BORROWER unless specified
    const userRole = role && ['BORROWER', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION', 'ADMIN'].includes(role)
      ? role
      : 'BORROWER';

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBreEligible: user.isBreEligible,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error during signup' });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pan: user.pan,
        dob: user.dob,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
        isBreEligible: user.isBreEligible,
        breRejectionReason: user.breRejectionReason,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error during login' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

export async function submitEligibility(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { pan, dob, monthlySalary, employmentMode } = req.body;
    if (!pan || !dob || !monthlySalary || !employmentMode) {
      return res.status(400).json({ error: 'PAN, Date of Birth, Monthly Salary, and Employment Mode are required.' });
    }

    const breResult = evaluateBRE({
      pan,
      dob,
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.pan = pan.trim().toUpperCase();
    user.dob = new Date(dob);
    user.monthlySalary = Number(monthlySalary);
    user.employmentMode = employmentMode;
    user.isBreEligible = breResult.isEligible;
    user.breRejectionReason = breResult.reasons.join(' | ');

    await user.save();

    return res.json({
      message: breResult.isEligible
        ? 'Congratulations! You meet all BRE eligibility criteria.'
        : 'Application blocked by Business Rule Engine (BRE).',
      isEligible: breResult.isEligible,
      reasons: breResult.reasons,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        pan: user.pan,
        dob: user.dob,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
        isBreEligible: user.isBreEligible,
        breRejectionReason: user.breRejectionReason,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error processing BRE check' });
  }
}
