'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { CreditCard, IndianRupee, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CollectionWorkspacePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [loans, setLoans] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [payLoanId, setPayLoanId] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payHistory, setPayHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'BORROWER') {
        router.push('/borrower');
      } else if (user.role !== 'COLLECTION' && user.role !== 'ADMIN') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchCollectionLoans = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await api.get('/ops/collection/loans');
      setLoans(res.data.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access Denied to Collection Module.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'COLLECTION' || user.role === 'ADMIN')) {
      fetchCollectionLoans();
    }
  }, [user]);

  const handleSelectLoan = async (loan: any) => {
    setPayLoanId(loan._id);
    setPayAmount(loan.remainingAmount);
    try {
      const res = await api.get(`/ops/collection/loans/${loan._id}/payments`);
      setPayHistory(res.data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(payAmount);
    if (!payLoanId || !utrNumber || isNaN(numericAmount) || numericAmount <= 0) {
      setMessage({ type: 'error', text: 'Please select loan, enter unique UTR, and valid payment amount.' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/ops/collection/payments', {
        loanId: payLoanId,
        utrNumber,
        amount: numericAmount,
        paymentDate: payDate,
      });

      setMessage({ type: 'success', text: res.data.message });
      setUtrNumber('');
      setPayAmount(0);
      await fetchCollectionLoans();

      const payRes = await api.get(`/ops/collection/loans/${payLoanId}/payments`);
      setPayHistory(payRes.data.payments || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Payment recording failed' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Collection Workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>collection agent workspace</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Track active DISBURSED loans, record repayments & enforce unique UTR numbers ({user.role} Access).
          </p>
        </div>

        <button
          onClick={fetchCollectionLoans}
          disabled={fetching}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          <span>refresh loans</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-black text-gray-900 font-display">Active & Closed Loans</h2>

          {loans.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-3xl border border-gray-200 text-gray-400 text-xs font-medium">
              No loans found in Collection module.
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan._id}
                  onClick={() => handleSelectLoan(loan)}
                  className={`bg-white p-5 rounded-3xl cursor-pointer border transition ${
                    payLoanId === loan._id ? 'border-black ring-2 ring-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900 text-base">{loan.borrowerId?.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Loan ID: {loan._id}</div>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 font-semibold">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Total Repayment</span>
                      <span className="text-gray-900">₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Amount Paid</span>
                      <span className="text-emerald-700 font-bold">₹{loan.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Remaining</span>
                      <span className="text-red-700 font-bold">₹{loan.remainingAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Entry Form */}
        <div className="lg:col-span-5 bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-6">
          <h3 className="text-lg font-black text-gray-900 font-display flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-gray-900" />
            <span>Record Payment Entry</span>
          </h3>

          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">SELECT ACTIVE LOAN</label>
              <select
                value={payLoanId}
                onChange={(e) => {
                  const l = loans.find((x) => x._id === e.target.value);
                  if (l) handleSelectLoan(l);
                }}
                className="w-full px-3 py-3 rounded-xl clean-input text-xs bg-white font-medium"
              >
                <option value="">-- Select Active Loan --</option>
                {loans
                  .filter((l) => l.status === 'DISBURSED')
                  .map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.borrowerId?.name} - Rem: ₹{l.remainingAmount} (ID: {l._id})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">UTR NUMBER (MUST BE UNIQUE)</label>
              <input
                type="text"
                required
                placeholder="UTR123456789"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-3 clean-input text-xs uppercase tracking-wider font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">AMOUNT (₹)</label>
                <input
                  type="number"
                  required
                  step="any"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-3 clean-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">PAYMENT DATE</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-3 clean-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-xs hover:bg-gray-800 transition shadow"
            >
              <span>record payment & update ledger</span>
            </button>
          </form>

          {payHistory.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-extrabold text-gray-900 text-xs mb-2 uppercase tracking-wider">Payment Ledger History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {payHistory.map((p) => (
                  <div key={p._id} className="p-2.5 rounded-xl bg-white border border-gray-200 text-[11px] flex justify-between font-semibold">
                    <div>
                      <span className="font-mono text-gray-900 font-bold block">{p.utrNumber}</span>
                      <span className="text-gray-400">{new Date(p.paymentDate).toLocaleDateString()}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-xs">₹{p.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
