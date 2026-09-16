'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import { ArrowRight, FileCheck, Calculator, Users, Lock, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'BORROWER') return '/borrower';
    return `/ops/${user.role.toLowerCase()}`;
  };

  return (
    <div className="w-full bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-extrabold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#00e676]" />
          <span>Automated BRE & Role-Based Lending Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6 font-display max-w-4xl mx-auto">
          intelligent loan management built for <span className="pill-highlight">speed</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base text-gray-500 font-medium mb-10 leading-relaxed">
          From instant automated Business Rule Engine (BRE) qualification to multi-module role-based internal operations (Sales, Sanction, Disbursement, & Collection).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={getDashboardRoute()}
            className="bg-black text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-800 transition shadow-lg flex items-center space-x-2"
          >
            <span>{user ? 'go to my workspace' : 'apply for a loan now'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {!user && (
            <Link
              href="/login"
              className="bg-gray-100 text-gray-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-200 transition"
            >
              sign in to operational portal
            </Link>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5 text-[#00e676]" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2 font-display">Automated BRE Check</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Evaluates applicant age (23–50), minimum monthly salary (≥ ₹25,000), PAN format regex, and employment mode in real-time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mb-4">
              <Calculator className="w-5 h-5 text-[#00e676]" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2 font-display">Dynamic SI Slider</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Interactive sliders for loan amount (₹50k – ₹5L) and tenure (30 – 365 days) with live Simple Interest breakdown at fixed 12% p.a.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#00e676]" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2 font-display">4 Ops Dashboard Modules</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Dedicated workspaces for Sales leads, Sanction approval/rejection, Disbursement release, and Collection tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-[#00e676]" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2 font-display">Strict RBAC Guards</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Backend JWT middleware & frontend route guards ensure executives only access authorized operational endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* Borrower Workflow Process */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-black text-center text-gray-900 mb-12 font-display">
          borrower application flow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-9 h-9 rounded-full bg-black text-[#00e676] font-black text-sm flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">Personal Details & BRE</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Submit PAN, DOB, Salary & Employment for instant automated BRE qualification.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-9 h-9 rounded-full bg-black text-[#00e676] font-black text-sm flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">Upload Salary Slip</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Attach PDF, JPG, or PNG salary document (max 5MB).</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-9 h-9 rounded-full bg-black text-[#00e676] font-black text-sm flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">Config & Apply</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Configure loan amount & tenure with live 12% p.a. interest math and submit.</p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-9 h-9 rounded-full bg-black text-[#00e676] font-black text-sm flex items-center justify-center mx-auto mb-3">
              ✓
            </div>
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">My Loans (Separate Page)</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Redirects to dedicated dashboard displaying loan status, repayment, and balance.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
