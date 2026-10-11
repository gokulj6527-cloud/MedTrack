import React from 'react';
import { Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-16 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium text-slate-900">Med<span className="font-light">Track</span></span>
          </div>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-sm">
            Smarter Pharmaceutical Supply. Safer Medicines. Complete journey management from manufacturer to patient.
          </p>
          <div className="text-[11px] text-slate-400 font-medium pt-2">
            React + TS • Node.js • MySQL 8.0+
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 font-semibold text-xs uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Supply Chain</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Batch Management</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Safety Alerts</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Prescriptions</li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 font-semibold text-xs uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">About Us</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Careers</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Contact Support</li>
            <li className="hover:text-emerald-700 cursor-pointer transition-colors">Partners</li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
        <div>© 2026 MedTrack Healthcare Inc. All rights reserved.</div>
        <div className="flex space-x-6 mt-4 sm:mt-0 font-medium">
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};
