'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api, getFileUrl } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { ShieldCheck, RefreshCw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function SanctionWorkspacePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'BORROWER') {
        router.push('/borrower');
      } else if (user.role !== 'SANCTION' && user.role !== 'ADMIN') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchSanctionLoans = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await api.get('/ops/sanction/loans');
      setLoans(res.data.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access Denied to Sanction Module.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'SANCTION' || user.role === 'ADMIN')) {
      fetchSanctionLoans();
    }
  }, [user]);

  const handleDecision = async (loanId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid rejection reason before rejecting.' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/ops/sanction/loans/${loanId}/decision`, {
        action,
        rejectionReason,
      });

      setMessage({ type: 'success', text: res.data.message });
      setSelectedLoan(null);
      setRejectionReason('');
      await fetchSanctionLoans();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to process sanction decision' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Sanction Workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>sanction officer workspace</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Review incoming APPLIED loan applications & render credit sanction decisions ({user.role} Access).
          </p>
        </div>

        <button
          onClick={fetchSanctionLoans}
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
          No pending loan applications in Sanction Queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <div key={loan._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block">ID: {loan._id}</span>
                  <h3 className="text-2xl font-black text-gray-900 font-display">₹{loan.amount.toLocaleString('en-IN')}</h3>
                  <span className="text-xs text-gray-500 font-medium">Applicant: {loan.borrowerId?.name} ({loan.borrowerId?.email})</span>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4 font-semibold">
                <div>
                  <span className="text-gray-400 block text-[10px]">Tenure</span>
                  <span className="text-gray-900">{loan.tenureDays} Days</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Monthly Salary</span>
                  <span className="text-gray-900">₹{loan.borrowerId?.monthlySalary?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Total Repayment</span>
                  <span className="text-gray-900 font-bold">₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Salary Slip</span>
                  <a href={typeof getFileUrl === 'function' ? getFileUrl(loan.salarySlipUrl) : `http://localhost:5001${loan.salarySlipUrl}`} target="_blank" rel="noreferrer" className="text-black underline font-bold flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Document</span>
                  </a>
                </div>
              </div>

              {selectedLoan?._id === loan._id ? (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <label className="block text-xs font-bold text-gray-700">Rejection Reason (Required if rejecting):</label>
                  <input
                    type="text"
                    placeholder="e.g. Salary documentation mismatch"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 clean-input text-xs"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(loan._id, 'APPROVE')} disabled={actionLoading} className="flex-1 py-2 rounded-xl bg-black text-white font-bold text-xs">Approve</button>
                    <button onClick={() => handleDecision(loan._id, 'REJECT')} disabled={actionLoading} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs">Confirm Reject</button>
                    <button onClick={() => setSelectedLoan(null)} className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => handleDecision(loan._id, 'APPROVE')} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-gray-800 transition">Approve (Sanction)</button>
                  <button onClick={() => setSelectedLoan(loan)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 font-bold text-xs hover:bg-gray-200 transition">Reject Loan...</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
