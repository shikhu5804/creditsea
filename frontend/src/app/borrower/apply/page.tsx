'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  User,
  CreditCard,
  Calendar,
  DollarSign,
  Briefcase,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function BorrowerApplyContent() {
  const { user, refreshUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Exactly 3 Steps inside the Stepper
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form States
  const [pan, setPan] = useState<string>(user?.pan || '');
  const [dob, setDob] = useState<string>(user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '1996-06-15');
  const [monthlySalary, setMonthlySalary] = useState<number>(user?.monthlySalary || 65000);
  const [employmentMode, setEmploymentMode] = useState<'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'>(
    user?.employmentMode || 'SALARIED'
  );

  const [breLoading, setBreLoading] = useState<boolean>(false);
  const [breResult, setBreResult] = useState<{ isEligible: boolean; reasons: string[] } | null>(
    user?.isBreEligible !== undefined
      ? { isEligible: user.isBreEligible, reasons: user.breRejectionReason ? user.breRejectionReason.split(' | ') : [] }
      : null
  );

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [salarySlipUrl, setSalarySlipUrl] = useState<string>('/uploads/sample_salary_slip.pdf');
  const [salarySlipName, setSalarySlipName] = useState<string>('Salary_Slip_Document.pdf');

  const [amount, setAmount] = useState<number>(100000);
  const [tenureDays, setTenureDays] = useState<number>(180);
  const [applyLoading, setApplyLoading] = useState<boolean>(false);
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'BORROWER') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  // Check if borrower already has an active submitted application (unless explicitly starting fresh)
  useEffect(() => {
    const isFresh = searchParams.get('fresh') === 'true';
    if (user && user.role === 'BORROWER' && !isFresh) {
      api.get('/loans/my-loans').then((res) => {
        const activeLoans = (res.data.loans || []).filter((l: any) =>
          ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(l.status)
        );
        if (activeLoans.length > 0) {
          // Auto-redirect to My Loans page so submitted forms cannot be reopened
          router.replace('/borrower/loans');
        }
      }).catch((err) => console.error(err));
    }
  }, [user, searchParams, router]);

  const interestRate = 12.0;
  const interestAmount = Math.round(((amount * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepaymentAmount = Math.round((amount + interestAmount) * 100) / 100;

  const handleBreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreLoading(true);
    setApplyMessage(null);

    try {
      const res = await api.post('/auth/profile/eligibility', {
        pan,
        dob,
        monthlySalary,
        employmentMode,
      });

      setBreResult({
        isEligible: res.data.isEligible,
        reasons: res.data.reasons || [],
      });

      await refreshUser();

      if (res.data.isEligible) {
        setCurrentStep(2);
      }
    } catch (err: any) {
      setApplyMessage({ type: 'error', text: err.response?.data?.error || 'BRE evaluation failed' });
    } finally {
      setBreLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setCurrentStep(3);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('salarySlip', file);

    try {
      const res = await api.post('/loans/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalarySlipUrl(res.data.salarySlipUrl);
      setSalarySlipName(res.data.originalName || file.name);
      setCurrentStep(3);
    } catch (err: any) {
      setApplyMessage({ type: 'error', text: err.response?.data?.error || 'File upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleApplyLoan = async () => {
    setApplyLoading(true);
    setApplyMessage(null);

    try {
      await api.post('/loans/apply', {
        amount,
        tenureDays,
        salarySlipUrl,
        salarySlipOriginalName: salarySlipName,
      });

      setApplyMessage({ type: 'success', text: 'Application submitted successfully! Redirecting to My Loans...' });

      // Use router.replace so browser back navigation cannot reopen completed application form
      setTimeout(() => {
        router.replace('/borrower/loans');
      }, 1000);
    } catch (err: any) {
      setApplyMessage({ type: 'error', text: err.response?.data?.error || 'Application submission failed' });
    } finally {
      setApplyLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Application Wizard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>loan application wizard</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Complete the 3 steps below to apply for credit.
          </p>
        </div>

        <button
          onClick={() => router.push('/borrower/loans')}
          className="px-4 py-2 rounded-full bg-gray-100 text-gray-900 text-xs font-bold hover:bg-gray-200 transition"
        >
          View My Loans
        </button>
      </div>

      {/* Exactly 3-Step Wizard Stepper Header */}
      <div className="bg-gray-50 p-2 rounded-2xl mb-8 border border-gray-100">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs font-bold">
          <button
            onClick={() => setCurrentStep(1)}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition ${
              currentStep === 1 ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-100'
            }`}
          >
            <span className="hidden sm:inline">Step 1: Personal Details & BRE</span>
            <span className="sm:hidden">1. BRE Check</span>
          </button>

          <button
            onClick={() => user.isBreEligible && setCurrentStep(2)}
            disabled={!user.isBreEligible}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition ${
              !user.isBreEligible ? 'opacity-40 cursor-not-allowed text-gray-400' : currentStep === 2 ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-100'
            }`}
          >
            <span className="hidden sm:inline">Step 2: Upload Salary Slip</span>
            <span className="sm:hidden">2. Salary Slip</span>
          </button>

          <button
            onClick={() => user.isBreEligible && setCurrentStep(3)}
            disabled={!user.isBreEligible}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl transition ${
              !user.isBreEligible ? 'opacity-40 cursor-not-allowed text-gray-400' : currentStep === 3 ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-100'
            }`}
          >
            <span className="hidden sm:inline">Step 3: Loan Config & Apply</span>
            <span className="sm:hidden">3. Apply</span>
          </button>
        </div>
      </div>

      {applyMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
            applyMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {applyMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
          <span>{applyMessage.text}</span>
        </div>
      )}

      {/* STEP 1: Personal Details & BRE Check */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-1 font-display flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-900" />
              <span>Step 1 — Personal Details & BRE Check</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium mb-6">
              Enter your profile details below for automated Business Rule Engine (BRE) qualification.
            </p>

            <form onSubmit={handleBreSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  PAN NUMBER
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 clean-input text-sm font-mono uppercase"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Regex check: [A-Z]{'{5}'}[0-9]{'{4}'}[A-Z]{'{1}'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                    DATE OF BIRTH
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 clean-input text-sm"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Must be between 23 and 50 years old</span>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                    MONTHLY SALARY (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="50000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-4 py-3 clean-input text-sm"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Must be ≥ ₹25,000 / month</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  EMPLOYMENT MODE
                </label>
                <select
                  value={employmentMode}
                  onChange={(e) => setEmploymentMode(e.target.value as any)}
                  className="w-full px-4 py-3 clean-input text-sm bg-white"
                >
                  <option value="SALARIED">Salaried Employee</option>
                  <option value="SELF_EMPLOYED">Self-Employed Professional</option>
                  <option value="UNEMPLOYED">Unemployed (Auto Reject)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={breLoading}
                className="w-full py-3.5 clean-btn text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 mt-4"
              >
                <span>{breLoading ? 'evaluating rules...' : 'run BRE check'}</span>
                <ArrowRight className="w-4 h-4 text-[#00e676]" />
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-gray-50 p-8 rounded-3xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 font-display flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-black" />
                <span>Business Rule Engine</span>
              </h3>

              <div className="space-y-3 text-xs mb-6">
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-800">1. Age (23 – 50 yrs)</span>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500">Required</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-800">2. Income (≥ ₹25,000/mo)</span>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500">Required</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-800">3. Valid PAN Format</span>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500">Required</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-800">4. Active Employment</span>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500">Required</span>
                </div>
              </div>

              {breResult && (
                <div className={`p-4 rounded-2xl border text-xs font-semibold ${breResult.isEligible ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <div className="font-bold mb-1 flex items-center space-x-1.5 text-sm">
                    {breResult.isEligible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>BRE Status: {breResult.isEligible ? 'APPROVED' : 'REJECTED'}</span>
                  </div>
                  {!breResult.isEligible && (
                    <ul className="list-disc list-inside space-y-1 mt-2 text-red-700">
                      {breResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {breResult?.isEligible && (
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full mt-6 py-3.5 bg-black text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition flex items-center justify-center space-x-2 shadow"
              >
                <span>proceed to step 2 (salary slip)</span>
                <ArrowRight className="w-4 h-4 text-[#00e676]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Upload Salary Slip */}
      {currentStep === 2 && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
            Step 2 — Upload Salary Slip Document
          </h2>
          <p className="text-xs text-gray-500 mb-8 font-medium">
            Upload your latest monthly salary slip (PDF, JPG, or PNG max 5 MB).
          </p>

          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 hover:border-black rounded-2xl p-10 bg-gray-50 transition cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <div className="text-sm font-bold text-gray-900">
                {file ? file.name : 'Click or Drag & Drop Salary Slip Here'}
              </div>
              <p className="text-xs text-gray-400 mt-1 font-medium">Accepts PDF, JPG, PNG up to 5 MB</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
              >
                back to step 1
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-gray-800 transition shadow flex items-center space-x-2"
              >
                <span>{file ? 'upload & continue' : 'use demo salary slip & continue'}</span>
                <ArrowRight className="w-4 h-4 text-[#00e676]" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Loan Config & Submit Application */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-1 font-display flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-gray-900" />
              <span>Step 3 — Configure Loan & Apply</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium mb-8">
              Adjust sliders for required loan amount and tenure in days.
            </p>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                    LOAN AMOUNT
                  </label>
                  <span className="text-2xl font-black text-gray-900 font-display">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                  <span>₹50,000</span>
                  <span>₹2,75,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                    TENURE (DAYS)
                  </label>
                  <span className="text-2xl font-black text-gray-900 font-display">{tenureDays} Days</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={5}
                  value={tenureDays}
                  onChange={(e) => setTenureDays(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                  <span>30 Days (1 mo)</span>
                  <span>180 Days (6 mo)</span>
                  <span>365 Days (1 yr)</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Attached Salary Slip:</span>
                <span className="text-gray-900 font-bold">{salarySlipName}</span>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  back
                </button>
                <button
                  onClick={handleApplyLoan}
                  disabled={applyLoading}
                  className="px-8 py-3.5 rounded-xl bg-black text-white font-extrabold text-xs hover:bg-gray-800 transition shadow-lg flex items-center space-x-2"
                >
                  <span>{applyLoading ? 'submitting...' : 'submit loan application'}</span>
                  <ArrowRight className="w-4 h-4 text-[#00e676]" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gray-50 p-8 rounded-3xl border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 font-display">
                Live Repayment Math
              </h3>

              <div className="space-y-4 mb-6 text-xs font-semibold">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Principal (P):</span>
                  <span className="font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Fixed Rate (R):</span>
                  <span className="font-bold text-gray-900">12.0% p.a.</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Tenure (T):</span>
                  <span className="font-bold text-gray-900">{tenureDays} Days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Simple Interest (SI):</span>
                  <span className="font-bold text-gray-900">₹{interestAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="p-4 rounded-2xl bg-black text-white shadow-md mt-4">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                    TOTAL AMOUNT PAYABLE
                  </div>
                  <div className="text-3xl font-black font-display text-white">
                    ₹{totalRepaymentAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BorrowerApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Application...</div>}>
      <BorrowerApplyContent />
    </Suspense>
  );
}
