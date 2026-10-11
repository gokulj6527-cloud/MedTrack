import React from 'react';
import { AlertTriangle, AlertCircle, ShieldCheck, ThermometerSnowflake, Activity } from 'lucide-react';

export const ResearchSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Text */}
        <div className="space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-3.5 py-1.5 rounded-full shadow-sm">
            Safety & Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight leading-tight">
            Real-Time Monitoring and <br />
            <span className="font-semibold text-gradient-primary">Proactive Alerts</span>
          </h2>
          <p className="text-slate-600 font-light leading-relaxed max-w-lg">
            Stay ahead of supply chain risks with automated intelligence. Our system constantly monitors expiry dates, inventory thresholds, cold-chain temperatures, and complex drug interactions.
          </p>
          
          <ul className="space-y-4 pt-4 text-sm text-slate-700 font-medium">
            <li className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Drug-Drug Interaction Analysis</span>
            </li>
            <li className="flex items-center space-x-3">
              <ThermometerSnowflake className="w-5 h-5 text-blue-500" />
              <span>IoT Cold-Chain Temperature Tracking</span>
            </li>
            <li className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Low-Stock and Near-Expiry Warnings</span>
            </li>
            <li className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Instant Class I-III Recall Notifications</span>
            </li>
          </ul>
        </div>

        {/* Right: Dashboard Alert Visual */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-50/50 rounded-full blur-3xl scale-110" />
          
          <div className="relative w-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 font-medium">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>System Intelligence Hub</span>
              </div>
              <div className="text-xs text-slate-500">Live Updating...</div>
            </div>

            {/* Alert List */}
            <div className="p-6 space-y-4">
              
              {/* Critical Alert */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Class I Recall Initiated</h4>
                  <p className="text-xs text-red-700 mt-1">Batch OMZ-2024-RECALL flagged. Quarantine immediately. Dispensing blocked.</p>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <ThermometerSnowflake className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Cold-Chain Temperature Warning</h4>
                  <p className="text-xs text-amber-700 mt-1">Shipment TRK-COLD-9901 exceeded 8.0°C (Current: 10.4°C).</p>
                </div>
              </div>

              {/* Interaction Warning */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-900">Drug Interaction Flagged</h4>
                  <p className="text-xs text-orange-700 mt-1">Omeprazole + Amlodipine interaction detected during prescription RX-2026-9001.</p>
                </div>
              </div>

              {/* Safe Status */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Batch Verified</h4>
                  <p className="text-xs text-emerald-700 mt-1">Batch BAT_001 successfully verified. Ready for dispensation.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
