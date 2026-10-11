import React from 'react';
import { Database, Server, Monitor, ShieldCheck, ArrowRight } from 'lucide-react';

export const Stats: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full shadow-sm">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight">
            Built on a Robust 3NF Foundation
          </h2>
          <p className="text-slate-600 font-light">
            A fully normalized relational database ensuring data integrity, strict ACID transactions, and comprehensive auditability across the entire supply chain.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-4">
            
            {/* Frontend */}
            <div className="flex flex-col items-center space-y-3 w-full lg:w-1/4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Monitor className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-800">React + TypeScript</h4>
                <p className="text-xs text-slate-500 mt-1">Role-Based Client Portals</p>
              </div>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-slate-300" />
            <div className="block lg:hidden w-px h-8 bg-slate-200" />

            {/* Backend */}
            <div className="flex flex-col items-center space-y-3 w-full lg:w-1/4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Server className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-800">Node.js + Express</h4>
                <p className="text-xs text-slate-500 mt-1">REST API & Auth Services</p>
              </div>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-slate-300" />
            <div className="block lg:hidden w-px h-8 bg-slate-200" />

            {/* Database Engine */}
            <div className="flex flex-col items-center space-y-3 w-full lg:w-1/4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                <Database className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-800">MySQL 8.0+</h4>
                <p className="text-xs text-slate-500 mt-1">ACID Transaction Engine</p>
              </div>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-slate-300" />
            <div className="block lg:hidden w-px h-8 bg-slate-200" />

            {/* Schema */}
            <div className="flex flex-col items-center space-y-3 w-full lg:w-1/4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-800">Normalized 3NF</h4>
                <p className="text-xs text-slate-500 mt-1">22 Relational Entities</p>
              </div>
            </div>

          </div>

          {/* Database Entities Pill List */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex flex-wrap justify-center gap-2">
              {['Users', 'Medicines', 'Batches', 'Inventory', 'Orders', 'Shipments', 'Prescriptions', 'Dispensing', 'Recalls', 'Alerts', 'Audit Logs'].map((entity, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
