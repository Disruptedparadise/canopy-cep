import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LogIn,
  User,
  Mail,
  Lock,
  UserX,
  Trees,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Sparkles,
  Database,
  KeyRound,
  Loader2,
} from 'lucide-react';

type AuthMode = 'signin' | 'quick' | 'signup' | 'magiclink';

export const LoginPage: React.FC = () => {
  const {
    user,
    isGuest,
    isConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    login,
    logout,
    continueAsGuest,
  } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [magicLinkSent, setMagicLinkSent] = useState<boolean>(false);
  const [confirmationSent, setConfirmationSent] = useState<boolean>(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      error('Credentials Required', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithPassword(email.trim(), password);
      if (res.error) {
        error('Authentication Failed', res.error);
      } else {
        success('Planter Authenticated', `Welcome back to RootGuard. Your trees are now synced.`);
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error('Details Required', 'Please provide both your name and email address.');
      return;
    }
    login(name.trim(), email.trim());
    success('Planter Profile Loaded', `Welcome to RootGuard, ${name.trim()}!`);
    navigate('/');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      error('Details Required', 'Please provide your full name, email, and password.');
      return;
    }
    if (password.length < 6) {
      error('Password Too Short', 'Password should be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUpWithPassword(email.trim(), password, name.trim());
      if (res.error) {
        error('Registration Failed', res.error);
      } else if (res.requiresConfirmation) {
        setConfirmationSent(true);
        info('Verification Email Sent', 'Check your inbox to confirm your Supabase account before signing in.');
      } else {
        success('Account Created', `Welcome to the forestry ledger, ${name.trim() || 'Field Steward'}!`);
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      error('Email Required', 'Please enter your email address to receive a login link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithMagicLink(email.trim());
      if (res.error) {
        error('Magic Link Error', res.error);
      } else {
        setMagicLinkSent(true);
        success('Magic Link Sent', `Check your email (${email}) for a one-click passwordless sign-in link.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    info('Guest Session Active', 'Browsing in guest mode. Plantings will be saved locally in this session.');
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    setPassword('');
    info('Signed Out', 'You have been logged out of the field ledger.');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Trees className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Steward Sign In
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto leading-relaxed font-light">
          Sign in to link plantings, check-ins, and photographic records to your verified cloud ID.
        </p>
      </div>

      {/* Database Connection Status */}
      <div className="flex items-center justify-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
            isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isConfigured ? 'Connected to Cloud Database' : 'Running in Local Storage Mode'}</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0C150E]/80 backdrop-blur-xl border border-white/[0.1] shadow-2xl space-y-6">
        {user ? (
          /* Logged-in State */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Signed In Steward
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-black font-semibold">
                    {user.isSupabaseUser ? 'Verified' : 'Field Profile'}
                  </span>
                </div>
                <div className="text-xs text-gray-300 truncate">
                  Name: <strong className="text-white">{user.name}</strong>
                </div>
                <div className="text-xs text-gray-400 font-mono truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                onClick={() => navigate('/')}
              >
                <Trees className="w-4 h-4" />
                <span>Return to Overview</span>
              </button>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] flex items-center justify-center gap-2 cursor-pointer transition-all"
                onClick={() => navigate('/tree-tracker?filter=my-trees')}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Planted Trees</span>
              </button>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : isGuest ? (
          /* Active Guest State */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <UserX className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full">
                <span className="text-sm font-semibold text-white">
                  Guest Session Active
                </span>
                <p className="text-xs text-gray-400">
                  Exploring in guest mode. Plantings and audit records will be stored locally in this browser.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                onClick={() => navigate('/')}
              >
                <Trees className="w-4 h-4" />
                <span>Continue to Overview</span>
              </button>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white/[0.06] text-white border border-white/[0.1] flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleLogout}
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Switch to Account Login</span>
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated State: Tabbed Auth */
          <div className="space-y-5">
            {/* Auth Mode Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setMagicLinkSent(false);
                  setConfirmationSent(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('quick');
                  setMagicLinkSent(false);
                  setConfirmationSent(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  mode === 'quick'
                    ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setMagicLinkSent(false);
                  setConfirmationSent(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('magiclink');
                  setMagicLinkSent(false);
                  setConfirmationSent(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  mode === 'magiclink'
                    ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Magic Link
              </button>
            </div>

            {confirmationSent && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmation Email Sent</span>
                </div>
                <p>
                  A verification link was dispatched to <strong>{email}</strong>.
                </p>
              </div>
            )}

            {magicLinkSent && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Magic Link Sent</span>
                </div>
                <p>
                  Check your email (<strong>{email}</strong>) for your passwordless sign-in link.
                </p>
              </div>
            )}

            {/* Mode 1: Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signin-email-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="signin-email-input"
                      type="email"
                      required
                      placeholder="steward@rootguard.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signin-password-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="signin-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Signing in…' : 'Sign In to Account'}</span>
                </button>
              </form>
            )}

            {/* Mode 2: Quick Entry */}
            {mode === 'quick' && (
              <form onSubmit={handleQuickLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="quick-name-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Steward Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="quick-name-input"
                      type="text"
                      required
                      placeholder="e.g. Maya Sen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="quick-email-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Steward Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="quick-email-input"
                      type="email"
                      required
                      placeholder="e.g. maya@rootguard.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Instant access without password. Sets up local field profile immediately.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Enter Field Ledger</span>
                </button>
              </form>
            )}

            {/* Mode 3: Sign Up */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-name-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Full Name / Callsign
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      placeholder="e.g. Dr. Maya Sen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-email-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      placeholder="steward@rootguard.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="signup-password-input"
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Registering…' : 'Register Account'}</span>
                </button>
              </form>
            )}

            {/* Mode 4: Magic Link */}
            {mode === 'magiclink' && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="magiclink-email-input"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-300"
                  >
                    Email for Passwordless Link
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="magiclink-email-input"
                      type="email"
                      required
                      placeholder="steward@rootguard.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-b from-emerald-400 to-emerald-600 text-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Sending link…' : 'Send Magic Link'}</span>
                </button>
              </form>
            )}

            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0C150E] px-3 text-[11px] uppercase tracking-wider text-gray-500 shrink-0 font-mono">
                or
              </span>
              <div className="border-t border-white/[0.08] w-full" />
            </div>

            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-gray-200 border border-white/[0.1] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <UserX className="w-4 h-4 text-gray-400" />
              <span>Continue as Guest (No Account Required)</span>
            </button>
          </div>
        )}
      </div>

      {/* Trust Notice */}
      <div className="p-4 rounded-2xl bg-white/[0.02] text-xs text-gray-400 flex items-center gap-3 border border-white/[0.06]">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="leading-relaxed">
          Trees logged while signed in are stamped with your unique steward ID. Guest plantings are stored locally in your browser.
        </p>
      </div>
    </div>
  );
};
