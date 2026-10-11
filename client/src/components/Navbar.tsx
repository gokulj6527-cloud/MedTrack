import React, { useState } from 'react';
import { Activity, KeyRound, LogOut, UserCheck, ChevronDown } from 'lucide-react';
import { type UserToken, clearAuthToken } from '../services/api';

interface NavbarProps {
  onOpenLogin: () => void;
  user: UserToken | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, user, onLogout }) => {
  const [platformOpen, setPlatformOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  const handleLogout = () => {
    clearAuthToken();
    onLogout();
  };

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-medium tracking-tight text-slate-900">
                Med<span className="font-light">Track</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Play Store style) */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            
            <div 
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button className="flex items-center space-x-1 hover:text-emerald-700 py-2">
                <span>Platform</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {platformOpen && (
                <div className="absolute top-full left-0 w-64 bg-white border border-slate-200 shadow-lg rounded-xl py-2 px-1">
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Pharmaceutical Supply Chain</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Medicine & Batch Management</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Inventory Management</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Prescription & Dispensing</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Safety & Recall Management</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Cold-Chain Monitoring</a>
                </div>
              )}
            </div>

            <div 
              className="relative"
              onMouseEnter={() => setInsightsOpen(true)}
              onMouseLeave={() => setInsightsOpen(false)}
            >
              <button className="flex items-center space-x-1 hover:text-emerald-700 py-2">
                <span>Insights</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {insightsOpen && (
                <div className="absolute top-full left-0 w-64 bg-white border border-slate-200 shadow-lg rounded-xl py-2 px-1">
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Inventory Analytics</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Expiry & Recall Insights</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Sales & Demand Trends</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Drug Interaction Alerts</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Temperature Monitoring</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Reports & Audit Analytics</a>
                </div>
              )}
            </div>

            <div 
              className="relative"
              onMouseEnter={() => setGetStartedOpen(true)}
              onMouseLeave={() => setGetStartedOpen(false)}
            >
              <button className="flex items-center space-x-1 hover:text-emerald-700 py-2">
                <span>Get Started</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {getStartedOpen && (
                <div className="absolute top-full left-0 w-56 bg-white border border-slate-200 shadow-lg rounded-xl py-2 px-1">
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Feedback & Reviews</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Choose Your Role</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">System Overview</a>
                  <a href="#" className="block px-4 py-2 hover:bg-slate-50 hover:text-emerald-700 rounded-lg">Contact / Support</a>
                </div>
              )}
            </div>

          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-700">{user.username} ({user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition-colors flex items-center space-x-2"
                >
                  <span>Log Out</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-6 py-2.5 rounded-full bg-emerald-700 text-white font-medium text-sm tracking-wide shadow-sm hover:bg-emerald-800 transition-colors flex items-center space-x-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
