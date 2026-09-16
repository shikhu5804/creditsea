'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { Send, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DisbursementWorkspacePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'BORROWER') {
        router.push('/borrower');
      } else if (user.role !== 'DISBURSEMENT' && user.role !== 'ADMIN') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchDisbursementLoans = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await api.get('/ops/disbursement/loans');
      setLoans(res.data.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access Denied to Disbursement Module.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'DISBURSEMENT' || user.role === 'ADMIN')) {
      fetchDisbursementLoans();
    }
  }, [user]);

  const handleDisburse = async (loanId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/ops/disbursement/loans/${loanId}/disburse`);
      setMessage({ type: 'success', text: res.data.message });
      await fetchDisbursementLoans();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to disburse loan' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Disbursement Workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>disbursement manager workspace</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Review SANCTIONED loans & disburse funds to borrower accounts ({user.role} Access).
          </p>
        </div>

        <button
          onClick={fetchDisbursementLoans}
          disabled={fetching}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          <span>refresh queue</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="bg-gray-50 p-12 text-center rounded-3xl border border-gray-200 text-gray-400 text-xs font-medium">
          No sanctioned loans pending disbursement.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <div key={loan._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block">ID: {loan._id}</span>
                  <h3 className="text-2xl font-black text-gray-900 font-display">₹{loan.amount.toLocaleString('en-IN')}</h3>
                  <span className="text-xs text-gray-500 font-medium">Borrower: {loan.borrowerId?.name} ({loan.borrowerId?.email})</span>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4 font-semibold">
                <div>
                  <span className="text-gray-400 block text-[10px]">Sanctioned Date</span>
                  <span className="text-gray-900">{loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Officer</span>
                  <span className="text-gray-900">{loan.sanctionedBy?.name || 'Sanction Exec'}</span>
                </div>
              </div>

              <button
                onClick={() => handleDisburse(loan._id)}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-black text-white font-extrabold text-xs hover:bg-gray-800 transition shadow flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4 text-[#00e676]" />
                <span>disburse funds (release ₹{loan.amount.toLocaleString('en-IN')})</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
