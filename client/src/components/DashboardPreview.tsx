import React, { useState } from 'react';
import { 
  Package, Truck, ShieldAlert, BarChart3, LayoutDashboard, 
  Database, ClipboardList, Activity, TrendingUp, 
  Factory, Pill, Settings, FlaskConical, ArrowDownToLine, 
  ThermometerSnowflake, RotateCcw, Users, ChevronDown 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardPreviewProps {
  onOpenApp: () => void;
}

type RoleType = 'admin' | 'manufacturer' | 'distributor' | 'pharmacist';

const DATA_BY_ROLE: Record<RoleType, any> = {
  admin: {
    title: 'MedTrack Admin',
    subtitle: 'Live metrics across the pharmaceutical network.',
    icon: Activity,
    metrics: [
      { label: 'Total Medicines', value: '142', sub: '+12 this month', alert: false },
      { label: 'Active Batches', value: '8,405', sub: '+450 tracked', alert: false },
      { label: 'Pending Orders', value: '34', sub: 'Awaiting fulfillment', alert: false },
      { label: 'Critical Alerts', value: '3', sub: 'Requires immediate action', alert: true },
    ],
    nav: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Medicines', icon: Database },
      { label: 'Batches & Inventory', icon: Package },
      { label: 'Orders & Shipments', icon: Truck },
      { label: 'Prescriptions', icon: ClipboardList },
      { label: 'Recalls & Alerts', icon: ShieldAlert },
      { label: 'Reports', icon: BarChart3 },
    ],
    chartTitle: 'Inventory Movement (30 Days)',
    chartPrimary: 'Inbound',
    chartSecondary: 'Outbound',
  },
  manufacturer: {
    title: 'MedTrack Manufacturer',
    subtitle: 'Production output and batch quality monitoring.',
    icon: Factory,
    metrics: [
      { label: 'Active Production Lines', value: '18', sub: '+2 online this month', alert: false },
      { label: 'Total Units Produced', value: '1,250,000', sub: '+12% vs last month', alert: false },
      { label: 'Pending Wholesale Orders', value: '184', sub: 'Awaiting dispatch', alert: false },
      { label: 'QC/Failure Alerts', value: '2', sub: 'Requires immediate action', alert: true },
    ],
    nav: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Production Lines & Formulas', icon: Settings },
      { label: 'Batch Generation & Serialization', icon: Package },
      { label: 'Wholesale Orders & Dispatch', icon: Truck },
      { label: 'Quality Control & Testing', icon: FlaskConical },
      { label: 'Recalls & Regulatory', icon: ShieldAlert },
      { label: 'Yield Reports', icon: BarChart3 },
    ],
    chartTitle: 'Production Output (30 Days)',
    chartPrimary: 'Finished Goods',
    chartSecondary: 'Raw Materials',
  },
  distributor: {
    title: 'MedTrack Distributor',
    subtitle: 'Warehouse storage and retail logistics hub.',
    icon: Truck,
    metrics: [
      { label: 'Warehouse Stock Units', value: '342,100', sub: '+5% stock level', alert: false },
      { label: 'Inbound Shipments', value: '24', sub: 'From manufacturers', alert: false },
      { label: 'Pharmacy Orders', value: '96', sub: 'Pending fulfillment', alert: false },
      { label: 'Cold Chain Alerts', value: '1', sub: 'Requires immediate action', alert: true },
    ],
    nav: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Manufacturer Supplies', icon: ArrowDownToLine },
      { label: 'Warehouse Stock & Cold Chain', icon: ThermometerSnowflake },
      { label: 'Retail Orders & Delivery', icon: Truck },
      { label: 'Purchase Requests', icon: ClipboardList },
      { label: 'Returns & Quarantined', icon: RotateCcw },
      { label: 'Logistics Reports', icon: BarChart3 },
    ],
    chartTitle: 'Logistics Volume (30 Days)',
    chartPrimary: 'Inbound Receipts',
    chartSecondary: 'Outbound Shipments',
  },
  pharmacist: {
    title: 'MedTrack Retail / Pharmacy',
    subtitle: 'Shelf inventory and local prescription management.',
    icon: Pill,
    metrics: [
      { label: 'Medicines in Stock', value: '1,240', sub: '+45 reordered', alert: false },
      { label: 'Prescriptions Filled Today', value: '86', sub: '+14 vs yesterday', alert: false },
      { label: 'Wholesaler Orders', value: '8', sub: 'In transit', alert: false },
      { label: 'Expired / Near-Expiry Alerts', value: '5', sub: 'Requires immediate action', alert: true },
    ],
    nav: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Shelf Inventory & Expiry', icon: Package },
      { label: 'Prescriptions & Dispensing', icon: Pill },
      { label: 'Wholesaler Orders', icon: Truck },
      { label: 'Customer Records', icon: Users },
      { label: 'Recalls & Expiry Returns', icon: RotateCcw },
      { label: 'Daily Sales Reports', icon: BarChart3 },
    ],
    chartTitle: 'Dispensing Activity (30 Days)',
    chartPrimary: 'Prescriptions Filled',
    chartSecondary: 'OTC Sales',
  },
};

// Generate some dummy chart data for Recharts stacked bar
const generateChartData = (primaryName: string, secondaryName: string) => {
  const data = [];
  for (let i = 1; i <= 7; i++) {
    data.push({
      name: `Week ${i}`,
      [primaryName]: Math.floor(Math.random() * 5000) + 1000,
      [secondaryName]: Math.floor(Math.random() * 4000) + 500,
    });
  }
  return data;
};

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ onOpenApp }) => {
  const [activeRole, setActiveRole] = useState<RoleType>('admin');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleData = DATA_BY_ROLE[activeRole];
  const chartData = generateChartData(roleData.chartPrimary, roleData.chartSecondary);
  const RoleIcon = roleData.icon;

  const rolesList: { id: RoleType; label: string }[] = [
    { id: 'admin', label: 'Admin View' },
    { id: 'manufacturer', label: 'Manufacturer View' },
    { id: 'distributor', label: 'Distributor View' },
    { id: 'pharmacist', label: 'Pharmacist View' },
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight">
            Comprehensive Operational Visibility
          </h2>
          <p className="text-slate-600 font-light">
            An intuitive, role-based dashboard delivering real-time insights into inventory levels, cold-chain status, and safety compliance across the entire network.
          </p>
        </div>

        {/* Dashboard SaaS Mockup */}
        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
          
          {/* Sidebar */}
          <div className="w-64 bg-[#F8FAFC] border-r border-slate-200 hidden md:flex flex-col p-4">
            
            {/* Role Switcher */}
            <div className="relative mb-8 z-20">
              <button 
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-2 font-semibold text-[#1E293B]">
                  <RoleIcon className="w-5 h-5 text-[#059669]" />
                  <span className="text-sm truncate">{roleData.title}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1">
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRole(r.id);
                        setActiveNav('Dashboard');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${activeRole === r.id ? 'text-[#059669] font-medium bg-[#E6F4EA]' : 'text-slate-700'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <nav className="space-y-1 flex-1 text-sm font-medium text-[#1E293B] overflow-y-auto pr-2 custom-scrollbar">
              {roleData.nav.map((item: any, idx: number) => {
                const NavIcon = item.icon;
                const isActive = activeNav === item.label;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveNav(item.label)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[#E6F4EA] text-[#047857]' 
                        : 'hover:bg-slate-100 text-[#1E293B]'
                    }`}
                  >
                    <NavIcon className="w-4 h-4" /> 
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            
            <button
              onClick={onOpenApp}
              className="mt-4 w-full py-2.5 rounded-lg bg-[#0F172A] text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              Launch Portal
            </button>
          </div>

          {/* Main Dashboard Area */}
          <div className="flex-1 bg-white p-6 overflow-y-auto z-10" onClick={() => setIsRoleDropdownOpen(false)}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{roleData.title}</h3>
                <p className="text-sm text-slate-500">{roleData.subtitle}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#047857] text-xs font-semibold border border-emerald-100">
                Data Synced Just Now
              </span>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {roleData.metrics.map((m: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border shadow-sm space-y-2 ${
                    m.alert 
                      ? 'border-red-200 bg-[#FEF2F2]' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className={`text-xs font-medium ${m.alert ? 'text-[#DC2626]' : 'text-slate-500'}`}>
                    {m.label}
                  </div>
                  <div className={`text-2xl font-semibold ${m.alert ? 'text-[#DC2626]' : 'text-slate-900'}`}>
                    {m.value}
                  </div>
                  <div className={`text-[11px] flex items-center ${m.alert ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                    {!m.alert && <TrendingUp className="w-3 h-3 mr-1"/>}
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm mb-8 h-[280px]">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">{roleData.chartTitle}</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey={roleData.chartPrimary} stackId="a" fill="#34D399" radius={[0, 0, 4, 4]} />
                    <Bar dataKey={roleData.chartSecondary} stackId="a" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
