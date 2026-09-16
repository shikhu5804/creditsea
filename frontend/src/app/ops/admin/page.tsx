'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { Shield, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'sales' | 'sanction' | 'disbursement' | 'collection'>('sales');

  const [salesLeads, setSalesLeads] = useState<any[]>([]);
  const [sanctionLoans, setSanctionLoans] = useState<any[]>([]);
  const [disbursementLoans, setDisbursementLoans] = useState<any[]>([]);
  const [collectionLoans, setCollectionLoans] = useState<any[]>([]);

  const [fetching, setFetching] = useState<boolean>(true);
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
      } else if (user.role !== 'ADMIN') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchAllData = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const [salesRes, sanctionRes, disbRes, collRes] = await Promise.all([
        api.get('/ops/sales/leads'),
        api.get('/ops/sanction/loans'),
        api.get('/ops/disbursement/loans'),
        api.get('/ops/collection/loans'),
      ]);
      setSalesLeads(salesRes.data.leads || []);
      setSanctionLoans(sanctionRes.data.loans || []);
      setDisbursementLoans(disbRes.data.loans || []);
      setCollectionLoans(collRes.data.loans || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch admin dashboard data' });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAllData();
    }
  }, [user]);

  const handleSanctionDecision = async (loanId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Enter rejection reason' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/ops/sanction/loans/${loanId}/decision`, { action, rejectionReason });
      setMessage({ type: 'success', text: res.data.message });
      setSelectedLoan(null);
      setRejectionReason('');
      await fetchAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburseLoan = async (loanId: string) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/ops/disbursement/loans/${loanId}/disburse`);
      setMessage({ type: 'success', text: res.data.message });
      await fetchAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Disbursement failed' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Admin Control Center...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>admin control center</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Full system control over Sales, Sanction, Disbursement, and Collection modules ({user.role} Superuser).
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={fetching}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          <span>refresh full data</span>
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Module Counter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div onClick={() => setActiveTab('sales')} className={`p-5 rounded-2xl cursor-pointer transition border ${activeTab === 'sales' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Sales Leads</div>
          <div className="text-3xl font-black font-display mt-1">{salesLeads.length}</div>
        </div>

        <div onClick={() => setActiveTab('sanction')} className={`p-5 rounded-2xl cursor-pointer transition border ${activeTab === 'sanction' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Sanction Queue</div>
          <div className="text-3xl font-black font-display mt-1">{sanctionLoans.length}</div>
        </div>

        <div onClick={() => setActiveTab('disbursement')} className={`p-5 rounded-2xl cursor-pointer transition border ${activeTab === 'disbursement' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Disbursement Queue</div>
          <div className="text-3xl font-black font-display mt-1">{disbursementLoans.length}</div>
        </div>

        <div onClick={() => setActiveTab('collection')} className={`p-5 rounded-2xl cursor-pointer transition border ${activeTab === 'collection' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Active Collections</div>
          <div className="text-3xl font-black font-display mt-1">{collectionLoans.length}</div>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 mb-6">
        <button onClick={() => setActiveTab('sales')} className={`py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'sales' ? 'bg-black text-white shadow' : 'text-gray-600 hover:text-black'}`}>Sales ({salesLeads.length})</button>
        <button onClick={() => setActiveTab('sanction')} className={`py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'sanction' ? 'bg-black text-white shadow' : 'text-gray-600 hover:text-black'}`}>Sanction ({sanctionLoans.length})</button>
        <button onClick={() => setActiveTab('disbursement')} className={`py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'disbursement' ? 'bg-black text-white shadow' : 'text-gray-600 hover:text-black'}`}>Disburse ({disbursementLoans.length})</button>
        <button onClick={() => setActiveTab('collection')} className={`py-2.5 rounded-xl font-bold text-xs transition ${activeTab === 'collection' ? 'bg-black text-white shadow' : 'text-gray-600 hover:text-black'}`}>Collection ({collectionLoans.length})</button>
      </div>

      {/* Views */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">Borrower</th>
                <th className="p-4">Monthly Salary</th>
                <th className="p-4">Employment</th>
                <th className="p-4">BRE Eligibility</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="p-4 font-bold text-gray-900">{lead.name} <span className="block text-[11px] font-normal text-gray-400">{lead.email}</span></td>
                  <td className="p-4 font-semibold text-gray-900">₹{lead.monthlySalary?.toLocaleString('en-IN') || 0}</td>
                  <td className="p-4">{lead.employmentMode}</td>
                  <td className="p-4">{lead.isBreEligible ? <span className="text-emerald-700 font-bold">ELIGIBLE</span> : <span className="text-red-700 font-bold">INELIGIBLE</span>}</td>
                  <td className="p-4"><StatusBadge status={lead.applicationStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sanction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sanctionLoans.map((loan) => (
            <div key={loan._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-black text-gray-900 font-display">₹{loan.amount.toLocaleString('en-IN')}</h3>
                  <span className="text-xs text-gray-500 font-medium">{loan.borrowerId?.name} ({loan.borrowerId?.email})</span>
                </div>
                <StatusBadge status={loan.status} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleSanctionDecision(loan._id, 'APPROVE')} className="flex-1 py-2 rounded-xl bg-black text-white font-bold text-xs">Approve</button>
                <button onClick={() => handleSanctionDecision(loan._id, 'REJECT')} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 text-xs font-bold">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'disbursement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disbursementLoans.map((loan) => (
            <div key={loan._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-black text-gray-900 font-display">₹{loan.amount.toLocaleString('en-IN')}</h3>
                  <span className="text-xs text-gray-500 font-medium">{loan.borrowerId?.name}</span>
                </div>
                <StatusBadge status={loan.status} />
              </div>
              <button onClick={() => handleDisburseLoan(loan._id)} className="w-full mt-4 py-2.5 rounded-xl bg-black text-white font-bold text-xs">Disburse Funds</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">Borrower</th>
                <th className="p-4">Total Repayment</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Remaining</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collectionLoans.map((loan) => (
                <tr key={loan._id}>
                  <td className="p-4 font-bold text-gray-900">{loan.borrowerId?.name}</td>
                  <td className="p-4 font-semibold text-gray-900">₹{loan.totalRepaymentAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-emerald-700 font-bold">₹{loan.paidAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-red-700 font-bold">₹{loan.remainingAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4"><StatusBadge status={loan.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
