import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeRecord } from '../../types';
import { BadgeTier, UserBadgeProgress, PlanterStewardSummary } from '../../types/gamification';
import { evaluateStewardBadges } from '../../services/gamificationService';
import {
  Award,
  ShieldCheck,
  Trees,
  Sprout,
  Landmark,
  Crown,
  Mountain,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Share2,
  Calendar,
  MapPin,
  Flame,
  User,
  Check,
} from 'lucide-react';

interface StewardBadgesShowcaseProps {
  trees: TreeRecord[];
  currentUserName?: string | null;
  onSelectTree?: (tree: TreeRecord) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const StewardBadgesShowcase: React.FC<StewardBadgesShowcaseProps> = ({
  trees,
  currentUserName,
  onSelectTree,
  className = '',
  defaultExpanded = true,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<UserBadgeProgress | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Extract distinct planters from trees
  const planterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    trees.forEach((t) => {
      const p = (t.planter || '').trim();
      if (p) {
        counts.set(p, (counts.get(p) || 0) + 1);
      }
    });

    const list = Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    // Sort descending by count
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [trees]);

  // Selected steward scope: 'my' | 'all' | specific planter name
  const [stewardScope, setStewardScope] = useState<string>(() => {
    if (currentUserName && currentUserName.trim()) return 'my';
    if (planterOptions.length > 0) return planterOptions[0].name;
    return 'all';
  });

  // Filter trees based on selected steward scope
  const scopedTrees = useMemo(() => {
    if (stewardScope === 'all') return trees;
    if (stewardScope === 'my') {
      if (!currentUserName) return trees;
      const target = currentUserName.trim().toLowerCase();
      return trees.filter((t) => (t.planter || '').trim().toLowerCase() === target);
    }
    const target = stewardScope.trim().toLowerCase();
    return trees.filter((t) => (t.planter || '').trim().toLowerCase() === target);
  }, [trees, stewardScope, currentUserName]);

  // Evaluate badge progress for the scoped trees
  const summary: PlanterStewardSummary = useMemo(() => {
    const storageKey =
      stewardScope === 'my'
        ? `user_${currentUserName || 'guest'}`
        : stewardScope === 'all'
        ? 'community'
        : `planter_${stewardScope}`;
    return evaluateStewardBadges(scopedTrees, storageKey);
  }, [scopedTrees, stewardScope, currentUserName]);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    if (activeFilter === 'unlocked') {
      return summary.badges.filter((b) => b.unlocked);
    }
    if (activeFilter === 'locked') {
      return summary.badges.filter((b) => !b.unlocked);
    }
    return summary.badges;
  }, [summary.badges, activeFilter]);

  // Icon resolver
  const getBadgeIcon = (iconName: string, tier: BadgeTier, unlocked: boolean) => {
    const baseClass = 'w-6 h-6 transition-transform duration-200 group-hover:scale-110';
    switch (iconName) {
      case 'Sprout':
        return <Sprout className={baseClass} />;
      case 'Trees':
        return <Trees className={baseClass} />;
      case 'Landmark':
        return <Landmark className={baseClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={baseClass} />;
      case 'Crown':
        return <Crown className={baseClass} />;
      case 'Mountain':
        return <Mountain className={baseClass} />;
      case 'Sparkles':
        return <Sparkles className={baseClass} />;
      case 'ClipboardCheck':
        return <ClipboardCheck className={baseClass} />;
      default:
        return <Award className={baseClass} />;
    }
  };

  // Tier Colors
  const getTierTheme = (tier: BadgeTier, unlocked: boolean) => {
    if (!unlocked) {
      return {
        badgeBg: 'bg-black/5 dark:bg-white/5',
        border: 'border-black/15 dark:border-white/10',
        text: 'text-black/50 dark:text-white/40',
        iconBg: 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40',
        ring: 'ring-transparent',
        pill: 'bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60',
      };
    }

    switch (tier) {
      case 'bronze':
        return {
          badgeBg: 'bg-gradient-to-br from-[#F6EFEA] to-[#EFE2D8] dark:from-[#2A1D16] dark:to-[#1F150F]',
          border: 'border-[#C47F53]/50 dark:border-[#C47F53]/40',
          text: 'text-[#8A5233] dark:text-[#E8A377]',
          iconBg: 'bg-[#C47F53] text-white shadow-xs',
          ring: 'ring-1 ring-[#C47F53]/30',
          pill: 'bg-[#C47F53]/15 text-[#8A5233] dark:text-[#E8A377]',
        };
      case 'silver':
        return {
          badgeBg: 'bg-gradient-to-br from-[#F3F6F4] to-[#E5EBE6] dark:from-[#1A261D] dark:to-[#131C15]',
          border: 'border-[#8FA58C]/60 dark:border-[#8FA58C]/40',
          text: 'text-[#2D5A34] dark:text-[#A7BF9E]',
          iconBg: 'bg-[#5E725B] text-white shadow-xs',
          ring: 'ring-1 ring-[#8FA58C]/30',
          pill: 'bg-[#8FA58C]/20 text-[#2D5A34] dark:text-[#A7BF9E]',
        };
      case 'gold':
        return {
          badgeBg: 'bg-gradient-to-br from-[#FCF7ED] to-[#F7ECD4] dark:from-[#2C2111] dark:to-[#1F170C]',
          border: 'border-[#D48B38]/60 dark:border-[#D48B38]/40',
          text: 'text-[#9A5F1A] dark:text-[#F3C77E]',
          iconBg: 'bg-[#D48B38] text-white shadow-xs',
          ring: 'ring-1 ring-[#D48B38]/40',
          pill: 'bg-[#D48B38]/20 text-[#9A5F1A] dark:text-[#F3C77E]',
        };
      case 'emerald':
        return {
          badgeBg: 'bg-gradient-to-br from-[#EEF7EF] to-[#DDF0E0] dark:from-[#132A17] dark:to-[#0D1C0F]',
          border: 'border-[#2D5A34]/60 dark:border-[#427B4C]/50',
          text: 'text-[#1F4225] dark:text-[#7EBC8A]',
          iconBg: 'bg-[#2D5A34] text-white shadow-xs',
          ring: 'ring-1 ring-[#2D5A34]/40',
          pill: 'bg-[#2D5A34]/20 text-[#1F4225] dark:text-[#7EBC8A]',
        };
    }
  };

  const handleShareCertificate = (badge: UserBadgeProgress) => {
    const url = `${window.location.origin}/tree-tracker?badge=${badge.badge.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `🏆 Milestone Awarded on RootGuard: ${badge.badge.name} by ${summary.planterName}! Explore at: ${url}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <section
      id="steward-badges-section"
      className={`rounded-2xl border border-[#D8D2C2] dark:border-[#223826] bg-[#FAF8F3] dark:bg-[#121F14] shadow-sm overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 border-b border-[#E5E0D3] dark:border-[#1E3020] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#2D5A34] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6 text-[#A7BF9E]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-[#2D5A34]/15 text-[#2D5A34] dark:bg-[#2D5A34]/30 dark:text-[#7EBC8A]">
                <span>{t('treeTracker.gamification.badge', 'GAMIFICATION & STEWARDSHIP')}</span>
              </span>
              <span className="text-[11px] font-mono text-[#5E725B] dark:text-[#8FA58C]">
                Rank: <strong className="text-[#162716] dark:text-[#EDF3EC]">{summary.stewardRank}</strong>
              </span>
            </div>

            <h2 className="font-['Fraunces'] text-xl sm:text-2xl font-bold text-[#162716] dark:text-[#EDF3EC] leading-tight">
              {t('treeTracker.gamification.heading', 'Steward Milestones & Digital Badges')}
            </h2>

            <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#8FA58C] leading-relaxed max-w-2xl">
              {t('treeTracker.gamification.subheading', 'Recognizing verified field outcomes—from initial planting volume to multi-year seedling survival and erosion control.')}
            </p>
          </div>
        </div>

        {/* Header Right: Steward Scope Selector + Toggle Expand */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {/* Planter Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-[#5E725B] dark:text-[#8FA58C]" />
            <select
              value={stewardScope}
              onChange={(e) => setStewardScope(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#182B1C] border border-black/15 dark:border-white/15 text-xs text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:ring-1 focus:ring-[#2D5A34] cursor-pointer"
              title="Select steward profile to inspect badges"
            >
              {currentUserName && (
                <option value="my">My Trees ({currentUserName})</option>
              )}
              {planterOptions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.count} trees)
                </option>
              ))}
              <option value="all">Full Community Canopy ({trees.length} trees)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse badge showcase' : 'Expand badge showcase'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Progress Summary Strip */}
      <div className="px-5 sm:px-6 py-3.5 bg-black/3 dark:bg-white/3 border-b border-[#E5E0D3] dark:border-[#1E3020] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D48B38]" />
            <span>
              Unlocked:{' '}
              <strong className="text-[#162716] dark:text-[#EDF3EC]">
                {summary.badgesUnlockedCount} / {summary.totalBadgesCount}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
            <span>
              Monitored Saplings:{' '}
              <strong className="text-[#162716] dark:text-[#EDF3EC]">{summary.totalPlanted}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
            <span>
              Longest Survival:{' '}
              <strong className="text-[#2D5A34] dark:text-[#7EBC8A]">
                {summary.longestSurvivalDays} Days
              </strong>
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#162716] dark:bg-white text-white dark:text-[#162716] font-bold'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716]'
            }`}
          >
            All ({summary.totalBadgesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unlocked')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              activeFilter === 'unlocked'
                ? 'bg-[#2D5A34] text-white font-bold'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#2D5A34]'
            }`}
          >
            Unlocked ({summary.badgesUnlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('locked')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              activeFilter === 'locked'
                ? 'bg-[#A6432D] text-white font-bold'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#A6432D]'
            }`}
          >
            Locked ({summary.totalBadgesCount - summary.badgesUnlockedCount})
          </button>
        </div>
      </div>

      {/* Badges Grid (Collapsible) */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map((item) => {
              const theme = getTierTheme(item.badge.tier, item.unlocked);

              return (
                <div
                  key={item.badge.id}
                  onClick={() => setSelectedBadgeModal(item)}
                  className={`group relative p-4 rounded-xl border ${theme.border} ${theme.badgeBg} ${theme.ring} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer space-y-3`}
                  title="Click to view full milestone certificate and qualifying trees"
                >
                  {/* Top Bar: Icon + Tier Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                      {getBadgeIcon(item.badge.iconName, item.badge.tier, item.unlocked)}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${theme.pill}`}>
                        {item.badge.tier}
                      </span>
                      {item.unlocked ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-[#2D5A34] dark:text-[#7EBC8A] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-black/40 dark:text-white/40">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1">
                    <h3 className="font-['Fraunces'] font-bold text-base text-[#162716] dark:text-[#EDF3EC] leading-snug group-hover:text-[#2D5A34] dark:group-hover:text-[#7EBC8A] transition-colors">
                      {item.badge.name}
                    </h3>

                    <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] leading-relaxed line-clamp-2">
                      {item.badge.description}
                    </p>
                  </div>

                  {/* Progress / Status Bar */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#5E725B] dark:text-[#8FA58C]">
                        {item.unlocked ? (
                          <span className="text-[#2D5A34] dark:text-[#7EBC8A] font-semibold">
                            Goal Achieved ({item.currentValue} {item.badge.unit})
                          </span>
                        ) : (
                          <span>
                            Progress: {item.currentValue} / {item.targetValue} {item.badge.unit}
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-[#162716] dark:text-[#EDF3EC]">
                        {item.progressPct}%
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.unlocked
                            ? 'bg-[#2D5A34] dark:bg-[#7EBC8A]'
                            : 'bg-[#D48B38] dark:bg-[#D48B38]'
                        }`}
                        style={{ width: `${item.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prompt banner to encourage ongoing planting and inspections */}
          <div className="p-4 rounded-xl bg-black/4 dark:bg-white/4 border border-black/8 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#D48B38]" />
              <span className="text-[#5E725B] dark:text-[#8FA58C]">
                Planting in steep contours and logging recurring health audits increases your steward verification level.
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#2D5A34] dark:text-[#7EBC8A] font-semibold">
              RootGuard Empirical Gamification
            </span>
          </div>
        </div>
      )}

      {/* Badge Proclamation & Certificate Dialog */}
      {selectedBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#D8D2C2] dark:border-[#2D4530] bg-[#FAF8F3] dark:bg-[#121F14] shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedBadgeModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5E725B] hover:text-[#162716] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Medallion Display */}
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2D5A34] text-white shadow-md mx-auto ring-4 ring-[#2D5A34]/20">
                {getBadgeIcon(selectedBadgeModal.badge.iconName, selectedBadgeModal.badge.tier, selectedBadgeModal.unlocked)}
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#D48B38]/20 text-[#9A5F1A] dark:text-[#F3C77E]">
                  {selectedBadgeModal.badge.tier} Tier Milestone
                </span>
                {selectedBadgeModal.unlocked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2D5A34]/20 text-[#2D5A34] dark:text-[#7EBC8A]">
                    Verified & Awarded
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60">
                    In Progress ({selectedBadgeModal.progressPct}%)
                  </span>
                )}
              </div>

              <h3 className="font-['Fraunces'] text-2xl font-bold text-[#162716] dark:text-[#EDF3EC]">
                {selectedBadgeModal.badge.name}
              </h3>
            </div>

            {/* Narrative & Scientific Context */}
            <div className="p-4 rounded-xl bg-black/4 dark:bg-white/5 border border-black/8 dark:border-white/10 space-y-2 text-xs">
              <div className="font-semibold text-[#162716] dark:text-[#EDF3EC]">
                {selectedBadgeModal.badge.description}
              </div>
              <p className="text-[#5E725B] dark:text-[#8FA58C] leading-relaxed italic">
                "{selectedBadgeModal.badge.ecologicalNarrative}"
              </p>
            </div>

            {/* Progress / Status Readout */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/4 dark:bg-white/5 border border-black/8 dark:border-white/10">
                <span className="text-[10px] uppercase text-[#5E725B] dark:text-[#8FA58C] block">Target Threshold</span>
                <span className="text-base font-bold text-[#162716] dark:text-[#EDF3EC]">
                  {selectedBadgeModal.badge.targetValue} {selectedBadgeModal.badge.unit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/4 dark:bg-white/5 border border-black/8 dark:border-white/10">
                <span className="text-[10px] uppercase text-[#5E725B] dark:text-[#8FA58C] block">Current Progress</span>
                <span className="text-base font-bold text-[#2D5A34] dark:text-[#7EBC8A]">
                  {selectedBadgeModal.currentValue} {selectedBadgeModal.badge.unit}
                </span>
              </div>
            </div>

            {/* Qualifying Trees List */}
            {selectedBadgeModal.qualifyingTrees.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#162716] dark:text-[#EDF3EC] flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A]" />
                    <span>Qualifying Specimens ({selectedBadgeModal.qualifyingTrees.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C]">
                    Click to pinpoint on field map
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedBadgeModal.qualifyingTrees.slice(0, 8).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (onSelectTree) onSelectTree(t);
                        setSelectedBadgeModal(null);
                      }}
                      className="p-2 rounded-lg bg-white dark:bg-[#182B1C] border border-black/10 dark:border-white/10 hover:border-[#2D5A34] flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#162716] dark:text-[#EDF3EC]">{t.species}</span>
                        <span className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
                          Planted {t.date_planted}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#2D5A34] dark:text-[#7EBC8A] flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{t.lat.toFixed(3)}, {t.lng.toFixed(3)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleShareCertificate(selectedBadgeModal)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#2D5A34]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Milestone Link!' : 'Share Milestone Certificate'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBadgeModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#2D5A34] text-white text-xs font-semibold hover:bg-[#1E3F24] transition-colors cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
