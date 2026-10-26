import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { CanopyBackground } from './CanopyBackground';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { isLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090C0A] text-emerald-400 font-mono text-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">Initializing Canopy…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-500/25 relative overflow-x-hidden">
      {/* 1. Animated Sunlight Forest Canvas Background */}
      <CanopyBackground />

      {/* 2. Glass Top Navigation Bar with Dark/Light Toggle */}
      <TopNav
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
      />

      {/* 3. Mobile Navigation Drawer */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* 4. Main Content Area */}
      <main
        id="main-content"
        className="flex-1 w-full pt-16 min-h-screen overflow-x-hidden relative z-10 flex flex-col justify-between"
      >
        <div className="w-full flex-1 flex flex-col">
          <Outlet />
        </div>

        {/* Global Footer */}
        <Footer />
      </main>
    </div>
  );
};
