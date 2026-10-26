import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sprout,
  Compass,
  Trees,
  Layers,
  Info,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { TreeRecord } from '../types';
import {
  ErosionRiskAssessment,
  EROSION_RISK_COLORS,
} from '../utils/erosionRisk';

interface ErosionRiskCalloutProps {
  focusedTree: TreeRecord | null;
  assessment: ErosionRiskAssessment;
  highRiskTrees?: Array<{ tree: TreeRecord; assessment: ErosionRiskAssessment }>;
  allAssessments?: Array<{ tree: TreeRecord; assessment: ErosionRiskAssessment }>;
  onSelectTree?: (tree: TreeRecord) => void;
  overlayActive?: boolean;
  onToggleOverlay?: () => void;
  onClearFocus?: () => void;
}

export const ErosionRiskCallout: React.FC<ErosionRiskCalloutProps> = ({
  focusedTree,
  assessment,
  highRiskTrees = [],
  allAssessments = [],
  onSelectTree,
  overlayActive = true,
  onToggleOverlay,
  onClearFocus,
}) => {
  const { t } = useTranslation();
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState<boolean>(false);
  const colorToken = EROSION_RISK_COLORS[assessment.level];
  const isElevated = assessment.level === 'high' || assessment.level === 'medium';

  // Identify the worst-case site across all ledger records or elevated sites
  const worstCaseItem = useMemo(() => {
    const pool = allAssessments.length > 0 ? allAssessments : highRiskTrees;
    if (pool.length === 0) return null;
    return [...pool].sort((a, b) => b.assessment.score - a.assessment.score)[0];
  }, [allAssessments, highRiskTrees]);

  // Compute honest distribution across all logged specimens
  const distribution = useMemo(() => {
    const list = allAssessments.length > 0 ? allAssessments : highRiskTrees;
    const high = list.filter((i) => i.assessment.level === 'high').length;
    const medium = list.filter((i) => i.assessment.level === 'medium').length;
    const low = list.filter((i) => i.assessment.level === 'low').length;
    return { high, medium, low, total: list.length };
  }, [allAssessments, highRiskTrees]);

  return (
    <div
      id="erosion-risk-callout"
      className="onearth-card rounded-2xl p-5 sm:p-6 shadow-xs transition-all relative overflow-hidden"
    >
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-[#E2DDD2] dark:border-[#223826] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {focusedTree ? (
                assessment.level === 'high' ? (
                  <ShieldAlert className="w-5 h-5 text-[#A6432D] shrink-0" />
                ) : assessment.level === 'medium' ? (
                  <AlertTriangle className="w-5 h-5 text-[#D48B38] shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A] shrink-0" />
                )
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A] shrink-0" />
              )}

              <span className="font-['Fraunces'] font-bold text-lg text-[#162716] dark:text-[#EDF3EC]">
                {focusedTree
                  ? `Erosion Risk: ${focusedTree.species} (ID: ${focusedTree.id})`
                  : 'Terrain Erosion Risk & Soil Conservation'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#8FA58C] leading-relaxed font-light">
              {focusedTree
                ? `Site factors: ${focusedTree.slope} slope • ${focusedTree.soil_type} soil • ${assessment.nearbyTreeCount} trees within 500m radius.`
                : 'Vulnerability identified across terrain slope, soil type, and canopy proximity.'}
            </p>
          </div>

          {/* Metric Display */}
          <div className="flex flex-wrap items-center gap-2.5">
            {focusedTree ? (
              <span
                id="erosion-risk-level-badge"
                className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full font-mono border ${colorToken.bg} ${colorToken.badgeBorder}`}
                style={{ color: colorToken.text }}
              >
                Focused Site: {focusedTree.species} ({focusedTree.id}) — {assessment.level} Risk ({assessment.score}/{assessment.maxScore} pts)
              </span>
            ) : (
              <div
                id="erosion-risk-distribution-badge"
                className="px-3.5 py-1.5 text-xs font-mono rounded-full border border-[#E2DDD2] dark:border-[#223826] bg-black/5 dark:bg-white/5 text-[#162716] dark:text-[#EDF3EC] flex items-center gap-2.5 shadow-2xs"
                title="Spread of calculated erosion risk across all active planting sites"
              >
                <span className="text-[10px] uppercase font-semibold text-[#5E725B] dark:text-[#8FA58C] tracking-wider font-sans">
                  Ledger Spread:
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#A6432D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A6432D]" />
                  {distribution.high} High
                </span>
                <span className="text-[#E2DDD2] dark:text-[#223826]">•</span>
                <span className="flex items-center gap-1 font-semibold text-[#D48B38]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D48B38]" />
                  {distribution.medium} Med
                </span>
                <span className="text-[#E2DDD2] dark:text-[#223826]">•</span>
                <span className="flex items-center gap-1 font-semibold text-[#2D5A34] dark:text-[#7EBC8A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A34] dark:bg-[#7EBC8A]" />
                  {distribution.low} Low
                </span>
              </div>
            )}

            {focusedTree && onClearFocus && (
              <button
                type="button"
                onClick={onClearFocus}
                className="text-xs font-mono px-3 py-1 bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C] border border-[#E2DDD2] dark:border-[#223826] hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer transition-colors"
                title="Clear tree focus and return to aggregate overview"
              >
                Clear Focus
              </button>
            )}

            {onToggleOverlay && (
              <button
                type="button"
                onClick={onToggleOverlay}
                id="callout-toggle-overlay-btn"
                className={`text-xs font-mono px-3 py-1 border transition-colors cursor-pointer rounded-full ${
                  overlayActive
                    ? 'bg-[#2D5A34] text-white border-[#2D5A34]'
                    : 'bg-black/5 dark:bg-white/5 text-[#162716] dark:text-[#EDF3EC] border-[#E2DDD2] dark:border-[#223826] hover:bg-black/10'
                }`}
              >
                {overlayActive ? 'Overlay Active' : 'Show on Map'}
              </button>
            )}
          </div>
        </div>

        {/* Quick selector of elevated risk trees if more exist */}
        {highRiskTrees.length > 0 && onSelectTree && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#4B5842] dark:text-[#A7BF9E] uppercase tracking-wider block font-mono">
              Quick Inspect Vulnerable Tree Sites:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {highRiskTrees.map(({ tree, assessment: a }) => {
                const isSelected = focusedTree?.id === tree.id;
                const token = EROSION_RISK_COLORS[a.level];
                return (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={() => onSelectTree(tree)}
                    className={`px-2 py-1 text-xs font-mono rounded-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#23301E] dark:bg-[#2E4E28] text-white border-[#23301E] dark:border-[#3F6B37] shadow-xs'
                        : 'bg-[#FBF8EF] dark:bg-[#121B11] text-[#23301E] dark:text-[#EDE8DD] border-[#C9C2A9] dark:border-[#2D452B] hover:border-[#3F6B37] dark:hover:border-[#E5BA5A]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: token.fill }}
                    />
                    <span>
                      {tree.species} ({tree.id})
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1 rounded-2xs ${
                        a.level === 'high'
                          ? 'bg-[#A6432D]/15 text-[#A6432D] dark:text-[#E5BA5A]'
                          : a.level === 'medium'
                          ? 'bg-[#C79A3F]/15 text-[#8A5233] dark:text-[#E2B766]'
                          : 'bg-[#3F6B37]/15 text-[#2C4B27] dark:text-[#A7BF9E]'
                      }`}
                    >
                      {a.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Transparent Scoring Formula Accordion Bar with Clear Context */}
        <div className="border border-[#C9C2A9]/70 dark:border-[#2D452B] rounded-xs bg-[#FBF8EF]/80 dark:bg-[#121B11] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-[#23301E] dark:text-[#EDE8DD] hover:bg-[#F2EEE1] dark:hover:bg-[#1A2617] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <Info className="w-3.5 h-3.5 text-[#AD6B44] dark:text-[#E5BA5A]" />
              <span className="font-semibold">
                Transparent Scoring Formula (Sensor-Free Model)
              </span>
              <span className="text-[11px] text-[#4B5842] dark:text-[#A7BF9E] font-mono">
                • {focusedTree
                  ? `Evaluated for: ${focusedTree.species} (${focusedTree.id})`
                  : worstCaseItem
                  ? `Worst-Case Reference: ${worstCaseItem.tree.species} (${worstCaseItem.tree.id})`
                  : 'Terrain Reference Model'}
                {' '}({assessment.score} / {assessment.maxScore} points)
              </span>
            </div>
            {showFormulaBreakdown ? (
              <ChevronUp className="w-4 h-4 text-[#4B5842] dark:text-[#A7BF9E]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#4B5842] dark:text-[#A7BF9E]" />
            )}
          </button>

          {showFormulaBreakdown && (
            <div className="p-3.5 border-t border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-2.5 text-xs text-[#4B5842] dark:text-[#A7BF9E] animate-fadeIn bg-white/40 dark:bg-[#0E170D]/90">
              <p className="leading-relaxed text-[11px]">
                Rather than relying on hardware probes or sediment sensors, this risk score is mathematically calculated from 3 field parameters logged in your registry:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Slope Factor */}
                <div className="bg-[#FBF8EF] dark:bg-[#152114] p-2.5 border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#23301E] dark:text-[#EDE8DD]">
                    <span className="font-bold flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#AD6B44] dark:text-[#E5BA5A]" />
                      Slope Factor
                    </span>
                    <span className="font-bold text-[#AD6B44] dark:text-[#E5BA5A]">
                      +{assessment.factors.slope.points}/3 pts
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#2C4B27] dark:text-[#A7BF9E]">
                    {assessment.factors.slope.value}
                  </div>
                  <p className="text-[10px] leading-tight text-[#4B5842] dark:text-[#A7BF9E]">
                    {assessment.factors.slope.explanation}
                  </p>
                </div>

                {/* Soil Factor */}
                <div className="bg-[#FBF8EF] dark:bg-[#152114] p-2.5 border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#23301E] dark:text-[#EDE8DD]">
                    <span className="font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#8A5233] dark:text-[#E5BA5A]" />
                      Soil Texture
                    </span>
                    <span className="font-bold text-[#8A5233] dark:text-[#E5BA5A]">
                      +{assessment.factors.soil.points}/3 pts
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#2C4B27] dark:text-[#A7BF9E]">
                    {assessment.factors.soil.value}
                  </div>
                  <p className="text-[10px] leading-tight text-[#4B5842] dark:text-[#A7BF9E]">
                    {assessment.factors.soil.explanation}
                  </p>
                </div>

                {/* Density Factor */}
                <div className="bg-[#FBF8EF] dark:bg-[#152114] p-2.5 border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#23301E] dark:text-[#EDE8DD]">
                    <span className="font-bold flex items-center gap-1">
                      <Trees className="w-3 h-3 text-[#3F6B37] dark:text-[#52A046]" />
                      Canopy Density
                    </span>
                    <span className="font-bold text-[#3F6B37] dark:text-[#52A046]">
                      +{assessment.factors.density.points}/3 pts
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#2C4B27] dark:text-[#A7BF9E]">
                    {assessment.factors.density.value}
                  </div>
                  <p className="text-[10px] leading-tight text-[#4B5842] dark:text-[#A7BF9E]">
                    {assessment.factors.density.explanation}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-[#8A5233] dark:text-[#D6A84E] border-t border-[#C9C2A9]/40 dark:border-[#2D452B]">
                <span>Total Score: {assessment.score} / 9</span>
                <span>Thresholds: Low (0–3) • Medium (4–6) • High (7–9)</span>
              </div>
            </div>
          )}
        </div>

        {/* Surfaced Soil Health Tips Callout — Fully Dark Mode Compatible with Warm Near-Black Card, Off-White Text & Gold Accents */}
        {isElevated && assessment.recommendedTips.length > 0 && (
          <div
            id="surfaced-soil-health-tips"
            className="space-y-2.5 pt-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C4B27] dark:text-[#A7BF9E] uppercase tracking-wider font-mono">
                <Sprout className="w-3.5 h-3.5 text-[#3F6B37] dark:text-[#52A046]" />
                <span>{t('erosionCallout.recommendedActions', 'Recommended Conservation Actions from Soil Health Guide:')}</span>
              </div>
              <Link
                to="/soil-tips"
                className="text-[11px] font-mono text-[#8A5233] dark:text-[#E5BA5A] hover:text-[#2C4B27] dark:hover:text-[#FBF8EF] flex items-center gap-0.5 underline transition-colors"
              >
                <span>{t('erosionCallout.viewAllTips', 'View all 6 tips')}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessment.recommendedTips.map((tip) => (
                <div
                  key={tip.id}
                  id={`callout-tip-${tip.id}`}
                  className="bg-[#FBF8EF] dark:bg-[#152114] border border-[#C9C2A9] dark:border-[#2D452B] rounded-xs p-3.5 space-y-2 shadow-2xs hover:border-[#3F6B37] dark:hover:border-[#E5BA5A]/50 transition-all relative group"
                >
                  <div className="flex items-baseline justify-between border-b border-[#C9C2A9]/50 dark:border-[#2D452B] pb-1.5">
                    <span className="font-['Fraunces'] font-bold text-xs text-[#AD6B44] dark:text-[#E5BA5A]">
                      Tip {tip.index} • {tip.title}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-[#4B5842] dark:text-[#A7BF9E]">
                      {tip.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed line-clamp-2">
                    {tip.paragraph}
                  </p>

                  <ul className="space-y-1 text-[11px] text-[#23301E] dark:text-[#EDE8DD]">
                    {tip.actions.slice(0, 2).map((act, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#3F6B37] dark:text-[#52A046] shrink-0 mt-0.5" />
                        <span className="leading-snug">{act}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-1 border-t border-[#C9C2A9]/40 dark:border-[#2D452B] flex justify-end">
                    <Link
                      to={`/soil-tips#soil-tip-${tip.id}`}
                      className="text-[11px] font-semibold text-[#3F6B37] dark:text-[#E5BA5A] group-hover:text-[#2C4B27] dark:group-hover:text-[#FBF8EF] inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{t('erosionCallout.readProtocol', 'Read protocol in Soil Health Tips')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If low risk */}
        {!isElevated && (
          <div className="p-3 bg-[#3F6B37]/10 dark:bg-[#121B11] border border-[#3F6B37]/30 dark:border-[#2D452B] rounded-xs flex items-center justify-between text-xs text-[#2C4B27] dark:text-[#A7BF9E]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3F6B37] dark:text-[#52A046] shrink-0" />
              <span>
                Low Erosion Susceptibility across sampled terrain. Topographic slope and root cohesiveness provide natural runoff protection.
              </span>
            </div>
            <Link
              to="/soil-tips"
              className="text-[11px] font-mono underline hover:text-[#23301E] dark:hover:text-[#EDE8DD] shrink-0 ml-2"
            >
              Browse Soil Protocols →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
