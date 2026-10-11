import React from 'react';

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200">
    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
    <div className="text-2xl font-bold text-slate-900 mt-1">{value ?? 0}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
  </div>
);
