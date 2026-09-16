import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'APPLIED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
          APPLIED
        </span>
      );
    case 'SANCTIONED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          SANCTIONED
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
          REJECTED
        </span>
      );
    case 'DISBURSED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] mr-1.5"></span>
          DISBURSED (ACTIVE)
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-900 border border-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-1.5"></span>
          CLOSED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-50 text-gray-700 border border-gray-200">
          {status}
        </span>
      );
  }
};
