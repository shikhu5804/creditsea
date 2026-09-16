import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/authContext';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'CreditSea - Next-Gen Loan Management System',
  description: 'Enterprise lending platform with automated BRE eligibility checks and role-based operations control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900 selection:bg-black selection:text-white">
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-white text-gray-900">
            <Navbar />
            <main className="flex-1 bg-white">{children}</main>
            <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400 font-medium">
              <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div>© 2026 CreditSea LMS. All rights reserved.</div>
                <div className="flex space-x-4 text-[11px]">
                  <span>Fixed Rate: 12% p.a.</span>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
