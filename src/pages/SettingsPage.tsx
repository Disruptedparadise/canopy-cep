import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, CardContent } from '../components/ui';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  Settings,
  Moon,
  User,
  Mail,
  Bell,
  Save,
  LogOut,
  LogIn,
  CheckCircle2,
  ShieldAlert,
  Edit3,
  MailCheck,
  X,
  Loader2,
  CalendarDays,
  Lock,
  Languages,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isGuest, updateUser, requestEmailChange, logout } = useAuth();
  const { success, error, info } = useToast();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Email Change Flow State
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSendingEmailChange, setIsSendingEmailChange] = useState(false);
  const [emailChangeRequested, setEmailChangeRequested] = useState<string | null>(null);

  // Check-in Milestone Preferences
  const [emailReminders, setEmailReminders] = useState(user?.emailReminders ?? true);
  const [reminderSchedule, setReminderSchedule] = useState('standard');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error(t('settings.profile.nameLabel', 'Name Required'), 'Planter profile must have a name or field callsign.');
      return;
    }

    setIsSavingProfile(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    updateUser({
      name: name.trim(),
      emailReminders,
    });

    setIsSavingProfile(false);
    success(t('settings.profile.success', 'Planter Profile Saved'), 'Your field attribution name and notification preferences have been saved.');
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim().toLowerCase();

    if (!trimmed || !trimmed.includes('@')) {
      error('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (user?.email && trimmed === user.email.toLowerCase()) {
      error('Identical Address', 'The new email address matches your current login email.');
      return;
    }

    setIsSendingEmailChange(true);
    const result = await requestEmailChange(trimmed);
    setIsSendingEmailChange(false);

    if (result.error) {
      error('Email Update Failed', result.error);
      return;
    }

    setEmailChangeRequested(trimmed);
    setIsChangingEmail(false);
    setNewEmailInput('');
    success(
      'Verification Link Sent',
      `Supabase has dispatched a confirmation email to ${trimmed}. Please click the verification link in your inbox to complete the email change.`
    );
  };

  const handleLogout = async () => {
    await logout();
    setName('');
    info('Signed Out', 'You have been switched to unauthenticated guest mode.');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 pb-20 space-y-8 animate-fadeIn">
      {/* Editorial Page Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5A34]/10 dark:bg-[#2D5A34]/25 text-xs font-mono uppercase tracking-wider text-[#2D5A34] dark:text-[#7EBC8A] font-semibold border border-[#2D5A34]/20">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Field Config</span>
        </div>
        <h1 className="font-['Fraunces'] text-3xl sm:text-4xl md:text-5xl font-bold text-[#162716] dark:text-[#EDF3EC] tracking-tight">
          {t('settings.heading', 'Field Settings & Preferences')}
        </h1>
        <p className="text-sm sm:text-base text-[#485D45] dark:text-[#9DB69B] font-light max-w-2xl leading-relaxed">
          {t('settings.subheading', 'Manage your interface language, visual mode, planter profile, and field check-in reminder schedules.')}
        </p>
      </header>

      {/* 1. Primary Control: Interface Language Card */}
      <div className="onearth-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD2] dark:border-[#223826] pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#2D5A34]/10 dark:bg-[#2D5A34]/25 flex items-center justify-center text-[#2D5A34] dark:text-[#7EBC8A] shrink-0 border border-[#2D5A34]/20 mt-0.5">
              <Languages className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A]" />
            </div>
            <div>
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC]">
                {t('settings.language.title', 'Interface Language')}
              </h2>
              <p className="text-xs sm:text-sm text-[#485D45] dark:text-[#9DB69B] mt-1 font-light">
                {t('settings.language.description', 'Select the primary display language for navigation, guides, and field forms. Changes apply immediately across all pages.')}
              </p>
            </div>
          </div>
        </div>

        <LanguageSwitcher variant="full" />
      </div>

      {/* 2. Display Theme Card */}
      <div className="onearth-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#223826] pb-5">
          <div>
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#EDF3EC]">
              {t('settings.theme.title', 'Display Appearance')}
            </h2>
            <p className="text-xs sm:text-sm text-[#9DB69B] mt-1 font-light">
              {t('settings.theme.description', 'RootGuard operates in Forest Night dark palette for low-glare field stewardship.')}
            </p>
          </div>
          <span className="self-start sm:self-auto onearth-pill bg-[#2D5A34]/25 text-[#7EBC8A] border-[#2D5A34]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EA46C]" />
            <span>Forest Night (Dark Mode Active)</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-[#7EBC8A]/40 bg-[#162716] text-[#EDF3EC] flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#0E170D] flex items-center justify-center text-[#7EBC8A] shrink-0 border border-[#223826]">
            <Moon className="w-5 h-5 text-[#7EBC8A]" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold flex items-center gap-1.5 text-[#EDF3EC]">
              <span>{t('settings.theme.dark', 'Forest Night (Dark)')}</span>
              <CheckCircle2 className="w-4 h-4 text-[#7EBC8A]" />
            </div>
            <div className="text-xs text-[#8FA58C] leading-snug">
              Deep forest canopy canvas with botanical emerald accents, reducing glare and eye strain during field observations and nocturnal reviews.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Planter Profile & Authentication */}
      <div className="onearth-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD2] dark:border-[#223826] pb-5">
          <div>
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC]">
              {t('settings.profile.title', 'Field Steward Profile')}
            </h2>
            <p className="text-xs sm:text-sm text-[#485D45] dark:text-[#9DB69B] mt-1 font-light">
              {t('settings.profile.description', 'Attribution name and organization displayed on tree records you log into the public ledger.')}
            </p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="self-start sm:self-auto onearth-btn-secondary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('settings.account.signOut', 'Sign Out')}</span>
            </button>
          ) : (
            <Link to="/login" className="self-start sm:self-auto">
              <button
                type="button"
                className="onearth-btn-primary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-[#7EBC8A]" />
                <span>{t('common.signIn', 'Sign In')}</span>
              </button>
            </Link>
          )}
        </div>

        {!user && isGuest && (
          <div className="p-4 rounded-2xl bg-[#D48B38]/10 border border-[#D48B38]/30 text-xs text-[#162716] dark:text-[#EDF3EC] flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-[#D48B38] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">{t('common.guestMode', 'Guest Mode (Local Only)')}</span>
              <span className="text-[#5E725B] dark:text-[#8FA58C]">
                {t('common.guestNotice', 'Trees and check-ins are saved in your local browser cache.')}{' '}
                <Link to="/login" className="underline font-semibold text-[#2D5A34] dark:text-[#7EBC8A]">
                  {t('common.signIn', 'Sign In')}
                </Link>{' '}
                to preserve your field telemetry permanently in the cloud database.
              </span>
            </div>
          </div>
        )}

        {/* Pending Email Change Notice */}
        {emailChangeRequested && (
          <div className="p-4 rounded-2xl bg-[#2D5A34]/10 dark:bg-[#2D5A34]/20 border border-[#2D5A34]/30 text-xs text-[#162716] dark:text-[#EDF3EC] space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-[#2D5A34] dark:text-[#7EBC8A]">
              <MailCheck className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
              <span>Email Verification Link Sent</span>
            </div>
            <p className="text-[#5E725B] dark:text-[#8FA58C] leading-relaxed">
              A verification link has been dispatched to <strong className="font-mono">{emailChangeRequested}</strong>.
              Your login email will not update until you click the confirmation link.
            </p>
          </div>
        )}

        {/* Planter Handle & Display Name Form */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Planter Name / Handle */}
            <div className="space-y-1.5">
              <label
                htmlFor="settings-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#162716] dark:text-[#EDF3EC]"
              >
                {t('settings.profile.nameLabel', 'Steward Name / Callsign')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E725B] dark:text-[#8FA58C] pointer-events-none" />
                <input
                  id="settings-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.profile.namePlaceholder', 'e.g. Anand Patil')}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] rounded-full text-sm text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:border-[#2D5A34] transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
                Display handle stamped onto plantation records and check-in audits.
              </p>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="settings-email-display"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#162716] dark:text-[#EDF3EC]"
                >
                  {t('settings.email.title', 'Login Email Address')}
                </label>
                {user?.isSupabaseUser ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2D5A34] dark:text-[#7EBC8A] font-semibold bg-[#2D5A34]/10 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    Verified Login
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#D48B38] font-semibold">
                    {t('common.guestMode', 'Local / Guest')}
                  </span>
                )}
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E725B] dark:text-[#8FA58C] pointer-events-none" />
                <input
                  id="settings-email-display"
                  type="email"
                  readOnly
                  value={user?.email || 'guest@onearth.local'}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] rounded-full text-sm text-[#5E725B] dark:text-[#8FA58C] cursor-not-allowed select-all"
                  title="Account login email. Click 'Change Email' below to begin verification flow."
                />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
                  Login credentials cannot be directly edited.
                </p>
                {user?.isSupabaseUser ? (
                  <button
                    type="button"
                    id="btn-open-email-change"
                    onClick={() => {
                      setIsChangingEmail(!isChangingEmail);
                      setNewEmailInput('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isChangingEmail ? t('common.cancel', 'Cancel') : t('settings.email.changeButton', 'Change Email')}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline"
                  >
                    {t('common.signIn', 'Sign In')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Change Email Sub-Panel */}
          {isChangingEmail && (
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#2D5A34]/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#162716] dark:text-[#EDF3EC]">
                    Update Login Email
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingEmail(false)}
                  className="text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC] p-1 rounded cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] leading-relaxed font-light">
                Enter your new email address below. A confirmation link will be dispatched to this address.
                Your current credentials remain active until confirmed.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E725B] dark:text-[#8FA58C]" />
                  <input
                    type="email"
                    required
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="new.email@organization.org"
                    className="w-full pl-10 pr-4 py-2 bg-[#F8F6F1] dark:bg-[#162716] border border-[#E2DDD2] dark:border-[#223826] rounded-full text-sm text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:border-[#2D5A34]"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSendingEmailChange || !newEmailInput.trim()}
                  onClick={handleRequestEmailChange}
                  className="onearth-btn-primary px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  {isSendingEmailChange ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MailCheck className="w-3.5 h-3.5 text-[#7EBC8A]" />
                  )}
                  <span>{isSendingEmailChange ? t('common.saving', 'Sending...') : t('settings.email.sendLink', 'Send Verification Link')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="onearth-btn-primary px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isSavingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#7EBC8A]" />
              )}
              <span>{isSavingProfile ? t('common.saving', 'Saving...') : t('settings.profile.saveButton', 'Save Profile Preferences')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Check-in Milestone Schedule & Notifications */}
      <div className="onearth-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD2] dark:border-[#223826] pb-5">
          <div>
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC]">
              {t('settings.reminders.title', 'Sapling Check-In Alerts')}
            </h2>
            <p className="text-xs sm:text-sm text-[#485D45] dark:text-[#9DB69B] mt-1 font-light">
              {t('settings.reminders.description', 'Receive automated reminder prompts when your registered saplings cross crucial milestones.')}
            </p>
          </div>
          <span className="self-start sm:self-auto onearth-pill bg-[#2D5A34]/10 dark:bg-[#2D5A34]/25 text-[#2D5A34] dark:text-[#7EBC8A] border-[#2D5A34]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EA46C]" />
            <span>{emailReminders ? 'Reminders Enabled' : 'Reminders Paused'}</span>
          </span>
        </div>

        <div className="space-y-5">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#2D5A34]/10 dark:bg-[#2D5A34]/25 flex items-center justify-center text-[#2D5A34] dark:text-[#7EBC8A] shrink-0 border border-[#2D5A34]/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#162716] dark:text-[#EDF3EC]">
                  {t('settings.reminders.enable', 'Enable email check-in reminders')}
                </div>
                <div className="text-xs text-[#5E725B] dark:text-[#8FA58C] font-light">
                  Dispatches timely prompts to inspect individual trees at their post-planting survival checkpoints.
                </div>
              </div>
            </div>

            {/* Accessible Switch */}
            <button
              type="button"
              role="switch"
              id="toggle-email-reminders"
              aria-checked={emailReminders}
              aria-label="Toggle Check-In Milestone Reminders"
              onClick={() => {
                const newVal = !emailReminders;
                setEmailReminders(newVal);
                if (user) updateUser({ emailReminders: newVal });
                info(
                  newVal ? 'Reminders Enabled' : 'Reminders Paused',
                  newVal
                    ? 'You will receive notifications for scheduled survival audits.'
                    : 'Check-in reminder notifications paused.'
                );
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailReminders ? 'bg-[#2D5A34]' : 'bg-[#D5CFC2] dark:bg-[#334D37]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  emailReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Milestone Schedule Selector */}
          {emailReminders && (
            <div className="space-y-3 p-5 rounded-2xl border border-[#E2DDD2] dark:border-[#223826] bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
                <label
                  htmlFor="reminder-schedule"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#162716] dark:text-[#EDF3EC]"
                >
                  {t('settings.reminders.schedule', 'Check-in Reminder Schedule')}
                </label>
              </div>

              <select
                id="reminder-schedule"
                value={reminderSchedule}
                onChange={(e) => {
                  setReminderSchedule(e.target.value);
                  success('Schedule Updated', 'Check-in milestone cadence has been updated.');
                }}
                className="w-full px-4 py-2.5 bg-[#F8F6F1] dark:bg-[#162716] border border-[#E2DDD2] dark:border-[#223826] rounded-full text-sm text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:border-[#2D5A34] transition-colors"
              >
                <option value="standard">
                  Standard (3, 6, and 12-month milestones per tree) — Recommended
                </option>
                <option value="frequent">
                  Frequent (Also remind monthly after the first year)
                </option>
                <option value="longitudinal">
                  Longitudinal Stewardship (3, 6, 12 months + annual check-ins thereafter)
                </option>
              </select>

              <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] leading-relaxed font-light">
                Unlike a flat calendar schedule, OnEarth calculates milestone audit alerts from each specimen&apos;s
                unique planting date: <strong>Day 90</strong> (transplant root establishment & first dry spell),{' '}
                <strong>Day 180</strong> (mid-season canopy leaf flush), and <strong>Day 365</strong> (1-year wood lignification).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
