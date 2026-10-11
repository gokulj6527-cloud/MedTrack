import React from 'react';

const styles: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  IN_STOCK: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  AVAILABLE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  IN_TRANSIT: 'bg-amber-50 text-amber-800 border-amber-200',
  PROCESSING: 'bg-amber-50 text-amber-800 border-amber-200',
  'Low Stock': 'bg-amber-50 text-amber-800 border-amber-200',
  LOW_STOCK: 'bg-amber-50 text-amber-800 border-amber-200',
  'Near Expiry': 'bg-orange-50 text-orange-800 border-orange-200',
  NEAR_EXPIRY: 'bg-orange-50 text-orange-800 border-orange-200',
  WARNING: 'bg-orange-50 text-orange-800 border-orange-200',
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  Expired: 'bg-red-50 text-red-700 border-red-200',
  RECALLED: 'bg-red-50 text-red-700 border-red-200',
  Recalled: 'bg-red-50 text-red-700 border-red-200',
  BANNED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  QUARANTINED: 'bg-red-50 text-red-700 border-red-200',
  DEFECTIVE: 'bg-red-50 text-red-700 border-red-200',
  VIOLATION: 'bg-red-50 text-red-700 border-red-200',
  TEMPERATURE_ALERT: 'bg-red-50 text-red-700 border-red-200',
  DISCONTINUED: 'bg-slate-100 text-slate-600 border-slate-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200'
};

export const StatusBadge: React.FC<{ value?: string | null }> = ({ value }) => {
  if (!value) return <span className="text-slate-400">—</span>;
  const cls = styles[value] || 'bg-slate-50 text-slate-700 border-slate-200';
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}>{value}</span>;
};
