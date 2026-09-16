'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth, UserRole } from '../../lib/authContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Key, Eye, EyeOff, UserCheck, Sparkles, FileCheck, Calculator, ShieldCheck, Lock } from 'lucide-react';
import api from '../../lib/api';

function LoginContent() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('BORROWER');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDemoDrawer, setShowDemoDrawer] = useState<boolean>(true);

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setIsSignup(true);
    }
  }, [searchParams]);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@lms.com', password: 'Admin@123' },
    { role: 'Sales Exec', email: 'sales@lms.com', password: 'Sales@123' },
    { role: 'Sanction Exec', email: 'sanction@lms.com', password: 'Sanction@123' },
    { role: 'Disbursement Exec', email: 'disbursement@lms.com', password: 'Disburse@123' },
    { role: 'Collection Exec', email: 'collection@lms.com', password: 'Collect@123' },
    { role: 'Borrower', email: 'borrower@lms.com', password: 'Borrow@123' },
  ];

  const handleRoleRedirect = (userRole: string) => {
    switch (userRole) {
      case 'BORROWER':
        router.push('/borrower');
        break;
      case 'SALES':
        router.push('/ops/sales');
        break;
      case 'SANCTION':
        router.push('/ops/sanction');
        break;
      case 'DISBURSEMENT':
        router.push('/ops/disbursement');
        break;
      case 'COLLECTION':
        router.push('/ops/collection');
        break;
      case 'ADMIN':
        router.push('/ops/admin');
        break;
      default:
        router.push('/borrower');
        break;
    }
  };

  useEffect(() => {
    if (user) {
      handleRoleRedirect(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignup) {
        // Register API request
        const res = await api.post('/auth/signup', { name, email, password, role });
        const token = res.data.token;
        localStorage.setItem('creditsea_token', token);
        setSuccessMsg('Account created successfully! Redirecting...');
        // Authenticate session
        const loggedInUser = await login(email, password);
        handleRoleRedirect(loggedInUser.role);
      } else {
        const loggedInUser = await login(email, password);
        handleRoleRedirect(loggedInUser.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = (accEmail: string, accPass: string) => {
    setIsSignup(false);
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-73px)] grid grid-cols-1 lg:grid-cols-2 bg-white text-gray-900">
      {/* Left Column: Sign in / Create Account Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 border-r border-gray-100 relative bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-3 font-display">
            {isSignup ? 'create your account' : 'sign in to your workspace'}
          </h1>

          <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
            {isSignup
              ? 'Register as a borrower to check BRE eligibility and apply for loans with full '
              : 'Enter your credentials to access your real-time loan management portal with full '}
            <span className="pill-highlight">speed.</span>
          </p>

          {/* Mode Switcher Buttons */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition ${
                !isSignup ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition ${
                isSignup ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shikhar Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 clean-input text-sm text-gray-900 font-medium placeholder-gray-400"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 clean-input text-sm text-gray-900 font-medium placeholder-gray-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition flex items-center space-x-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'hide' : 'show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 clean-input text-sm text-gray-900 font-medium placeholder-gray-400"
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                  ACCOUNT TYPE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 clean-input text-sm text-gray-900 font-medium bg-white"
                >
                  <option value="BORROWER">Borrower (Loan Applicant)</option>
                  <option value="SALES">Sales Executive</option>
                  <option value="SANCTION">Sanction Officer</option>
                  <option value="DISBURSEMENT">Disbursement Manager</option>
                  <option value="COLLECTION">Collection Agent</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 clean-btn text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'processing...' : isSignup ? 'create account' : 'sign in'}</span>
            </button>
          </form>

          {/* Bottom link toggle */}
          <div className="mt-8 text-xs text-gray-500 font-medium">
            {isSignup ? (
              <>
                already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setError(null);
                  }}
                  className="font-bold text-gray-900 underline hover:text-black"
                >
                  sign in
                </button>
              </>
            ) : (
              <>
                don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setError(null);
                  }}
                  className="font-bold text-gray-900 underline hover:text-black"
                >
                  create account
                </button>
              </>
            )}
          </div>

          {/* Quick Demo Credentials Autofill Helper Bar */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Demo Accounts Quick Fill</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                className="text-xs text-gray-400 hover:text-gray-900 font-bold"
              >
                {showDemoDrawer ? 'hide' : 'show'}
              </button>
            </div>

            {showDemoDrawer && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleAutoFill(acc.email, acc.password)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-all group"
                  >
                    <div className="font-extrabold text-[11px] text-gray-900 group-hover:text-black">
                      {acc.role}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate font-mono">{acc.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: High-Impact Typography Banner */}
      <div className="hidden lg:flex flex-col justify-between p-16 sm:p-24 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="pt-12">
          <h2 className="text-5xl xl:text-6xl font-black text-gray-900 tracking-tight leading-none font-display">
            smart lending built <br /> for speed
          </h2>
        </div>

        <div className="max-w-md ml-auto text-right pb-8">
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            CreditSea makes it easy to connect borrowers with capital safely and instantly, helping internal operations communicate with maximum{' '}
            <span className="pill-highlight">clarity.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-gray-400 font-medium">Loading Workspace...</div>}>
      <LoginContent />
    </Suspense>
  );
}
