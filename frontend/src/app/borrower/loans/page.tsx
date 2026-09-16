'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api, getFileUrl } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { FileCheck, Plus, FileText, Calendar, RefreshCw, AlertCircle } from 'lucide-react';

export default function BorrowerLoansPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'BORROWER') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchMyLoans = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await api.get('/loans/my-loans');
      setLoans(res.data.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch your loan records');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'BORROWER') {
      fetchMyLoans();
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading My Loans...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>my loan applications</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Track submitted applications, approval statuses, repayment math & outstanding balances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMyLoans}
            disabled={fetching}
            className="p-2.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            title="Refresh Loans"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => router.push('/borrower/apply?fresh=true')}
            className="bg-black text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-gray-800 transition shadow flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-[#00e676]" />
            <span>Apply for Another Loan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="bg-gray-50 p-12 text-center rounded-3xl border border-gray-200">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-gray-900 font-display mb-1">No Submitted Applications</h3>
          <p className="text-xs text-gray-500 font-medium mb-6">You have not submitted any loan applications yet.</p>
          <button
            onClick={() => router.push('/borrower/apply')}
            className="bg-black text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-gray-800 transition"
          >
            Start New 3-Step Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <div key={loan._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative hover:border-gray-300 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block">Application ID: {loan._id}</span>
                  <h3 className="text-2xl font-black text-gray-900 font-display">₹{loan.amount.toLocaleString('en-IN')}</h3>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3.5 rounded-2xl bg-gray-50 border border-gray-200 mb-4 font-semibold">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider">TENURE</span>
                  <span className="text-gray-900">{loan.tenureDays} Days</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider">INTEREST RATE</span>
                  <span className="text-gray-900">12.0% p.a. Fixed</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider">TOTAL REPAYMENT</span>
                  <span className="text-gray-900 font-bold">₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider">REMAINING BALANCE</span>
                  <span className="text-gray-900 font-bold">₹{loan.remainingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Submitted: {new Date(loan.createdAt).toLocaleDateString()}</span>
                  </span>
                  {loan.salarySlipOriginalName && (
                    <a
                      href={typeof getFileUrl === 'function' ? getFileUrl(loan.salarySlipUrl) : `http://localhost:5001${loan.salarySlipUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-900 font-bold underline flex items-center space-x-1 hover:text-black"
                    >
                      <FileText className="w-3.5 h-3.5 text-black" />
                      <span>{loan.salarySlipOriginalName}</span>
                    </a>
                  )}
                </div>

                {loan.status === 'REJECTED' && loan.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                    <strong>Rejection Reason:</strong> {loan.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
