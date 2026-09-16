export interface BreInput {
  dob: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
}

export interface BreResult {
  isEligible: boolean;
  reasons: string[];
}

export function calculateAge(dobInput: Date | string): number {
  const dob = new Date(dobInput);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function evaluateBRE(input: BreInput): BreResult {
  const reasons: string[] = [];
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  // 1. Age check (23 to 50)
  const age = calculateAge(input.dob);
  if (isNaN(age) || age < 23 || age > 50) {
    reasons.push(`Applicant age must be between 23 and 50 years old (current calculated age: ${isNaN(age) ? 'invalid' : age}).`);
  }

  // 2. Salary check (>= 25,000)
  if (!input.monthlySalary || input.monthlySalary < 25000) {
    reasons.push(`Monthly salary must be at least ₹25,000 (current: ₹${input.monthlySalary || 0}).`);
  }

  // 3. PAN Regex check
  const cleanPan = (input.pan || '').trim().toUpperCase();
  if (!cleanPan || !panRegex.test(cleanPan)) {
    reasons.push(`Invalid PAN format. Must match standard Indian PAN (e.g. ABCDE1234F).`);
  }

  // 4. Employment mode check
  if (!input.employmentMode || input.employmentMode === 'UNEMPLOYED') {
    reasons.push(`Applicant cannot be Unemployed. Must be Salaried or Self-Employed.`);
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

export function calculateLoanMath(amount: number, tenureDays: number, interestRate: number = 12.0) {
  // SI = (P * R * T) / (365 * 100)
  const interestAmount = Math.round(((amount * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepaymentAmount = Math.round((amount + interestAmount) * 100) / 100;
  return {
    interestAmount,
    totalRepaymentAmount,
  };
}
