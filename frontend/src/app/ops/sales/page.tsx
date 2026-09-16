'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';

export default function SalesWorkspacePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [salesLeads, setSalesLeads] = useState<any[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'BORROWER') {
        router.push('/borrower');
      } else if (user.role !== 'SALES' && user.role !== 'ADMIN') {
        router.push(`/ops/${user.role.toLowerCase()}`);
      }
    }
  }, [user, isLoading, router]);

  const fetchLeads = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await api.get('/ops/sales/leads');
      setSalesLeads(res.data.leads || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load sales leads. Access Denied.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'SALES' || user.role === 'ADMIN')) {
      fetchLeads();
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium">Loading Sales Workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 bg-white text-gray-900 min-h-[calc(100vh-73px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display flex items-center space-x-2">
            <span>sales executive workspace</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Pre-application lead tracking & borrower eligibility monitoring ({user.role} Access).
          </p>
        </div>

        <button
          onClick={fetchLeads}
          disabled={fetching}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          <span>refresh leads</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">REGISTERED BORROWER LEADS</span>
          <span className="text-xs font-bold text-gray-900">{salesLeads.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">Borrower Name & Email</th>
                <th className="p-4">Monthly Salary</th>
                <th className="p-4">Employment</th>
                <th className="p-4">BRE Eligibility</th>
                <th className="p-4">Application Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{lead.name}</div>
                    <div className="text-[11px] text-gray-400">{lead.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-gray-900">
                    {lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}` : 'Not Provided'}
                  </td>
                  <td className="p-4 text-gray-600">{lead.employmentMode}</td>
                  <td className="p-4">
                    {lead.isBreEligible ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ELIGIBLE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                        NOT ELIGIBLE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={lead.applicationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
