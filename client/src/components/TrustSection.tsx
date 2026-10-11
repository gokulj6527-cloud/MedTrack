import React from 'react';
import { Target, Search, AlertCircle, ShieldCheck } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const securityFeatures = [
    {
      title: '99.9% Inventory Accuracy',
      desc: 'Automated warehouse tracking, barcode reconciliation, and ACID-compliant atomic transactions.',
      icon: Target
    },
    {
      title: '100% Batch Traceability',
      desc: 'Immutable lineage from manufacturer creation to distributor warehousing and patient dispensation.',
      icon: Search
    },
    {
      title: 'Real-Time Safety Alerts',
      desc: 'Immediate notifications for temperature cold-chain violations, drug interactions, and expiring batches.',
      icon: AlertCircle
    },
    {
      title: 'Role-Based Secure Access',
      desc: 'Enterprise-grade authentication segregating Admin, Manufacturer, Distributor, and Pharmacist workflows.',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full shadow-sm">
            Enterprise Reliability
          </span>
          <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight">
            Trust at Every Node
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-light">
            Engineered to pharmaceutical standards, guaranteeing data integrity, operational transparency, and maximum patient safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-3">
                  {feat.title}
                </h3>
                <p className="text-sm font-light text-slate-500 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
