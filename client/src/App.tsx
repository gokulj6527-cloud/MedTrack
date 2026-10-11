import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';

import { Stats } from './components/Stats';
import { ResearchSection } from './components/ResearchSection';
import { DashboardPreview } from './components/DashboardPreview';
import { TrustSection } from './components/TrustSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';

import { AdminPortal } from './components/portals/AdminPortal';
import { ManufacturerPortal } from './components/portals/ManufacturerPortal';
import { DistributorPortal } from './components/portals/DistributorPortal';
import { PharmacistPortal } from './components/portals/PharmacistPortal';
import { UserPortal } from './components/portals/UserPortal';
import { getCurrentUser, type UserToken } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserToken | null>(null);
  const [activeTab, setActiveTab] = useState<'landing' | 'app'>('landing');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: UserToken) => {
    setCurrentUser(user);
    setActiveTab('app');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Sticky Navigation Bar */}
      <Navbar
        user={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setActiveTab('landing');
        }}
      />

      {/* VIEW 1: LANDING PAGE */}
      {activeTab === 'landing' && (
        <main className="animate-fade-in">
          <Hero
            onExplore={() => {
              if (currentUser) setActiveTab('app');
              else setIsLoginOpen(true);
            }}
          />

          <Solutions onSelectSolution={() => setIsLoginOpen(true)} />



          <Stats />

          <ResearchSection />

          <DashboardPreview onOpenApp={() => setActiveTab('app')} />

          <TrustSection />

          <FinalCTA
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        </main>
      )}

      {/* VIEW 2: FULL-STACK ROLE PORTAL APP */}
      {activeTab === 'app' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 min-h-[85vh] animate-fade-in">
          {currentUser ? (
            <>
              {currentUser.role === 'ADMIN' && <AdminPortal currentUser={currentUser} />}
              {currentUser.role === 'MANUFACTURER' && <ManufacturerPortal currentUser={currentUser} />}
              {currentUser.role === 'DISTRIBUTOR' && <DistributorPortal currentUser={currentUser} />}
              {currentUser.role === 'PHARMACIST' && <PharmacistPortal currentUser={currentUser} />}
              {currentUser.role === 'USER' && <UserPortal currentUser={currentUser} />}
            </>
          ) : (
            <div className="text-center py-20 space-y-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
              <h2 className="text-3xl font-light text-slate-900">Authentication Required</h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Please log in with an Admin, Manufacturer, Distributor, or Pharmacist account to access the role portal.
              </p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-8 py-3.5 rounded-full bg-emerald-700 text-white font-medium text-sm shadow-sm hover:scale-105 transition-transform inline-flex"
              >
                Log In / Quick Demo Accounts
              </button>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

  

    </div>
  );
}

export default App;
