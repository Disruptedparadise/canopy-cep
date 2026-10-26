import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  Trees,
  Plus,
  Settings,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  MapPin,
  BarChart3,
  Leaf,
  Sprout,
  Target,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TopNavProps {
  onToggleMobileNav?: () => void;
  mobileNavOpen?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileNav,
  mobileNavOpen = false,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isGuest, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Primary links - Reports removed, Species & Soil front and center!
  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/identify', label: 'Species Matcher' },
    { to: '/soil-tips', label: 'Soil Health' },
    { to: '/tree-tracker', label: 'Field Map' },
    { to: '/campaigns', label: 'Campaigns' },
    { to: '/about', label: 'About' },
  ];

  const isLinkActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <header
      id="top-utility-strip"
      className={`fixed top-0 left-0 right-0 h-16 z-50 backdrop-blur-md border-b transition-colors ${
        isDark
          ? 'bg-[#0E1210]/90 border-white/[0.08]'
          : 'bg-[#FAF8F4]/90 border-black/[0.07]'
      } px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
        {/* Left: Botanical Brand Mark */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileNav && (
            <button
              type="button"
              id="mobile-sidebar-toggle-btn"
              onClick={onToggleMobileNav}
              className={`xl:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-black/[0.04]'
              }`}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="w-5 h-5 text-emerald-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link
            to="/"
            id="top-logo-link"
            className="flex items-center gap-2.5 group rounded-lg focus:outline-none"
            title="Canopy Home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif italic font-normal text-xl tracking-tight text-stone-900 dark:text-stone-100">
                Canopy
              </span>
              <span className="hidden sm:inline text-[10px] font-mono tracking-[0.16em] uppercase text-stone-500">
                Flora & Soil
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean Segmented Control Tabs */}
        <nav className={`hidden xl:flex items-center gap-0.5 p-1 rounded-lg border ${
          isDark
            ? 'bg-white/[0.03] border-white/[0.07]'
            : 'bg-black/[0.03] border-black/[0.06]'
        }`}>
          {navLinks.map((item) => {
            const active = isLinkActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors select-none ${
                  active
                    ? isDark ? 'text-white' : 'text-gray-900'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                    className={`absolute inset-0 rounded-full border shadow-xs ${
                      isDark
                        ? 'bg-white/[0.08] border-white/[0.1]'
                        : 'bg-white border-black/[0.08] shadow-sm'
                    }`}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Actions (Theme Toggle, + Plant, Language, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Animated Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isDark
                ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-amber-400'
                : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-gray-700'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
          >
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </button>

          {/* + Plant Tree Button */}
          <Link
            to="/tree-tracker?action=new"
            id="top-log-tree-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            title="Log a Planted Tree"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Plant Tree</span>
            <span className="sm:hidden">Plant</span>
          </Link>

          {/* Compact Language Switcher */}
          <LanguageSwitcher variant="dropdown" />

          {/* Account Profile Menu */}
          <div ref={profileDropdownRef} className="relative inline-block text-left shrink-0">
            <button
              type="button"
              id="top-profile-avatar-btn"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold transition-all cursor-pointer relative shrink-0 ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-gray-200'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-gray-800'
              }`}
              aria-label="Account Menu"
              aria-expanded={profileDropdownOpen}
            >
              {user?.name ? (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              ) : isGuest ? (
                <span className="text-amber-500 font-bold">G</span>
              ) : (
                <User className="w-3.5 h-3.5" />
              )}

              {/* Status dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  isDark ? 'border-[#090C0A]' : 'border-white'
                } ${
                  user ? 'bg-emerald-500' : isGuest ? 'bg-amber-400' : 'bg-gray-400'
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div
                id="top-profile-dropdown-menu"
                className={`absolute right-0 mt-2 w-56 rounded-2xl border p-2 z-50 space-y-1 animate-slideUp shadow-2xl ${
                  isDark
                    ? 'bg-[#0F1310] border-white/[0.1]'
                    : 'bg-white border-black/[0.08]'
                }`}
                role="menu"
              >
                <div className={`px-3 py-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || (isGuest ? 'Guest Session' : 'Visitor Mode')}
                  </div>
                  <div className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email || (isGuest ? 'Local browser memory' : 'Sign in to sync online')}
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                      : 'text-gray-700 hover:bg-black/[0.04] hover:text-gray-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
