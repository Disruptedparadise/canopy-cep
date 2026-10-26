import React, { useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  BarChart3,
  MapPin,
  Leaf,
  Sprout,
  BookOpen,
  Settings,
  FileText,
  Target,
  LogIn,
  X,
  Trees,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isGuest } = useAuth();

  useEffect(() => {
    if (!mobileOpen || !onCloseMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navItems = [
    { to: '/', label: t('nav.links.home.label', 'Overview'), icon: Home },
    { to: '/tree-tracker', label: t('nav.links.treeTracker.label', 'Field Map & Registry'), icon: MapPin },
    { to: '/dashboard', label: t('nav.links.dashboard.label', 'Survival Dashboard'), icon: BarChart3 },
    { to: '/campaigns', label: t('nav.links.campaigns.label', 'Active Campaigns'), icon: Target },
    { to: '/identify', label: t('nav.links.identify.label', 'Species & Soil Match'), icon: Leaf },
    { to: '/soil-tips', label: t('nav.links.soilTips.label', 'Soil Health & Swales'), icon: Sprout },
    { to: '/reports', label: t('nav.links.reports.label', 'Field Reports & Audit'), icon: FileText },
    { to: '/about', label: t('nav.links.about.label', 'About RootGuard'), icon: BookOpen },
    { to: '/settings', label: t('nav.links.settings.label', 'System Settings'), icon: Settings },
  ];

  if (!mobileOpen) return null;

  return (
    <div className="xl:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-[#0A120C] border-r border-white/[0.08] h-full flex flex-col justify-between p-6 z-10 animate-slideUp shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <Link
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trees className="w-4 h-4" />
              </div>
              <span className="font-semibold text-lg text-white">RootGuard</span>
            </Link>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User state badge */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center justify-center">
                {user?.name ? user.name[0].toUpperCase() : 'G'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {user?.name || (isGuest ? 'Guest Mode' : 'Visitor')}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {user?.email || 'Local Session'}
                </div>
              </div>
            </div>
            {!user && (
              <Link
                to="/login"
                onClick={onCloseMobile}
                className="text-[11px] font-medium text-emerald-400 hover:underline flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Action Button at Bottom */}
        <div className="pt-4 border-t border-white/[0.08]">
          <Link
            to="/tree-tracker?action=new"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-semibold text-xs shadow-md"
          >
            <Trees className="w-4 h-4" />
            <span>Log Field Tree</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
