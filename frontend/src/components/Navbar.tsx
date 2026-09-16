'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '../lib/authContext';
import { LogOut, Shield, FileText, Users, ShieldCheck, Send, CreditCard, Waves } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getDashboardLink = (role: UserRole) => {
    switch (role) {
      case 'BORROWER':
        return { href: '/borrower/loans', label: 'My Loans', icon: FileText };
      case 'SALES':
        return { href: '/ops/sales', label: 'Sales Workspace', icon: Users };
      case 'SANCTION':
        return { href: '/ops/sanction', label: 'Sanction Workspace', icon: ShieldCheck };
      case 'DISBURSEMENT':
        return { href: '/ops/disbursement', label: 'Disbursement Workspace', icon: Send };
      case 'COLLECTION':
        return { href: '/ops/collection', label: 'Collection Workspace', icon: CreditCard };
      case 'ADMIN':
        return { href: '/ops/admin', label: 'Admin Dashboard', icon: Shield };
      default:
        return { href: '/borrower', label: 'Portal', icon: FileText };
    }
  };

  const dashboardInfo = user ? getDashboardLink(user.role) : null;
  const DashboardIcon = dashboardInfo?.icon || FileText;

  return (
    <header className="w-full bg-white border-b border-gray-100 py-3.5 px-4 sm:px-12 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo - Navigates to Home / Route */}
        <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black text-[#00e676] flex items-center justify-center shadow-sm group-hover:bg-gray-800 transition">
            <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00e676]" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-display">
            creditsea
          </span>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center space-x-2 sm:space-x-6 text-xs sm:text-sm font-semibold">
          {user ? (
            <>
              <Link
                href={dashboardInfo!.href}
                className="text-gray-700 hover:text-black flex items-center space-x-1 sm:space-x-1.5 transition"
              >
                <DashboardIcon className="w-4 h-4 text-gray-900 flex-shrink-0" />
                <span className="font-bold hidden md:inline">{dashboardInfo!.label}</span>
              </Link>

              <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 sm:px-3.5 py-1">
                <span className="w-2 h-2 rounded-full bg-[#00e676]"></span>
                <span className="text-[10px] sm:text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  {user.role}
                </span>
                <span className="text-xs text-gray-400 font-normal hidden lg:inline">({user.name.split(' ')[0]})</span>
              </div>

              <button
                onClick={logout}
                className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs hover:bg-gray-800 transition flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-gray-500 font-medium text-[10px] sm:text-xs tracking-wider uppercase hidden sm:inline">fast & secure</span>
              <Link
                href="/login"
                className="bg-black text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs hover:bg-gray-800 transition shadow"
              >
                get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
