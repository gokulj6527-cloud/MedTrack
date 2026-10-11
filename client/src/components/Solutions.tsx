import React from 'react';
import { ShieldAlert, Factory, Truck, Pill, ArrowUpRight } from 'lucide-react';

interface SolutionsProps {
  onSelectSolution: (solution: string) => void;
}

export const Solutions: React.FC<SolutionsProps> = ({ onSelectSolution }) => {
  const roles = [
    {
      id: 'admin',
      title: 'System Administrator',
      description: 'Complete system control, approvals, reports, recalls and monitoring.',
      icon: ShieldAlert
    },
    {
      id: 'manufacturer',
      title: 'Manufacturer',
      description: 'Medicine creation, batch management, composition and shipment management.',
      icon: Factory
    },
    {
      id: 'distributor',
      title: 'Distributor',
      description: 'Warehouse inventory, shipments, cold-chain monitoring and pharmacy orders.',
      icon: Truck
    },
    {
      id: 'pharmacist',
      title: 'Pharmacist',
      description: 'Pharmacy inventory, prescriptions, drug interaction checks and dispensing.',
      icon: Pill
    }
  ];

  return (
    <section id="solutions" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full shadow-sm">
            Platform Overview
          </span>
          <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight">
            Unified Role-Based Workflows
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-light">
            Dedicated portals tailored for every node in the pharmaceutical supply chain, ensuring strict access control and streamlined operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => onSelectSolution(role.id)}
                className="group relative p-8 rounded-2xl bg-white cursor-pointer border border-slate-200 hover:border-emerald-300 hover:shadow-lg flex flex-col justify-between transition-all"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-colors">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>

                  <h3 className="text-xl font-medium text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                    <span>{role.title}</span>
                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>

                  <p className="text-sm font-light text-slate-500 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
