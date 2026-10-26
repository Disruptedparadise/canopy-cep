import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trees, ShieldCheck, ArrowUpRight, Send, CheckCircle2, Sprout } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const fieldPrograms = [
    { label: 'Species & Soil Matcher', to: '/identify' },
    { label: 'Soil Health & Swales', to: '/soil-tips' },
    { label: 'Interactive Tree Tracker', to: '/tree-tracker' },
    { label: 'Reforestation Campaigns', to: '/campaigns' },
  ];

  const platformTools = [
    { label: 'Reforestation Campaigns', to: '/campaigns' },
    { label: 'About the Science', to: '/about' },
    { label: 'System Settings', to: '/settings' },
  ];

  return (
    <footer
      id="app-footer"
      className="no-print mt-24 border-t border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#070A08]/90 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 transition-colors"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand & Mission Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Trees className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tight">Canopy</span>
            </Link>
            <p className="text-sm font-light text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              Longitudinal native tree survival & hillside soil stabilization. Moving beyond one-day photo-op plantings to permanent living forest canopies.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Field Telemetry & Canopy Dispatch
              </span>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/25">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Subscribed! You will receive seasonal field updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter steward email…"
                    required
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-sm"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Column 1: Field Programs */}
          <div className="md:col-span-4 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Core Modules
            </span>
            <ul className="space-y-2.5 text-xs">
              {fieldPrograms.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Column 2: Platform & Records */}
          <div className="md:col-span-3 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Platform & Science
            </span>
            <ul className="space-y-2.5 text-xs">
              {platformTools.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom divider with copyright & field accreditation */}
        <div className="mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>© {currentYear} Canopy Project • Native Ecological Stewardship</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span>Soil Hydrology Validated</span>
            <span>•</span>
            <span>Open Field Protocol</span>
            <span>•</span>
            <span>Longitudinal Reforestation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
