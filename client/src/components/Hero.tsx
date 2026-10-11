import React from 'react';
import { ArrowRight, Play, Factory, Truck, Store, User, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center justify-center bg-gradient-hero overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Text & CTAs */}
        <div className="space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium tracking-wide shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Healthcare Grade</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 leading-[1.15]">
            Smarter Pharmaceutical Supply.<br/>
            <span className="font-semibold text-gradient-primary">
              Safer Medicines.
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
            Manage the complete journey of medicines — from manufacturer to distributor, pharmacy and patient — with intelligent inventory, batch tracking, safety monitoring and compliance.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-700 text-white font-medium text-sm tracking-wide shadow-md hover:bg-emerald-800 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium text-sm tracking-wide hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span>View System</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clean SaaS Visual */}
        <div className="relative flex items-center justify-center">
          
          {/* Soft ambient background */}
          <div className="absolute inset-0 bg-emerald-50/50 rounded-full blur-3xl scale-150" />

          <div className="relative w-full max-w-lg glass-panel p-8 shadow-xl">
            
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800">Supply Chain Traceability</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider">LIVE DATA</span>
            </div>

            {/* Vertical Flow Diagram */}
            <div className="space-y-6 relative">
              {/* Connecting line */}
              <div className="absolute top-8 left-6 bottom-8 w-px bg-slate-200" />

              {/* Manufacturer */}
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10 relative">
                  <Factory className="w-5 h-5 text-slate-700" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="text-sm font-medium text-slate-800">Apollo Manufacturer</div>
                  <div className="text-xs text-slate-500">Batch: B-9942 • Produced</div>
                </div>
              </div>

              {/* Distributor */}
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10">
                  <Truck className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="text-sm font-medium text-slate-800">MedSupply Network</div>
                  <div className="text-xs text-slate-500">In Transit • Temp: 4.2°C</div>
                </div>
              </div>

              {/* Pharmacy */}
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10">
                  <Store className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="text-sm font-medium text-slate-800">City Care Pharmacy</div>
                  <div className="text-xs text-slate-500">Received • Verified</div>
                </div>
              </div>

              {/* Patient */}
              <div className="relative flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm flex items-center justify-center z-10">
                  <User className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <div className="text-sm font-medium text-emerald-800">Dispensed safely</div>
                  <div className="text-xs text-emerald-600">No drug interactions found</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
