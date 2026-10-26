import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Species } from '../types';
import { SPECIES_DATA } from '../data/speciesData';
import {
  Search,
  Droplets,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Mountain,
  Layers,
  Sparkles,
  X,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';

export interface SpeciesGuidePageProps {
  hideHeader?: boolean;
}

export const SpeciesGuidePage: React.FC<SpeciesGuidePageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();

  // Mode: 'matcher' | 'catalog'
  const [activeMode, setActiveMode] = useState<'matcher' | 'catalog'>('matcher');

  // Condition Matcher Dropdown States
  const [matchSoil, setMatchSoil] = useState<string>('all');
  const [matchSlope, setMatchSlope] = useState<string>('all');
  const [matchWater, setMatchWater] = useState<string>('all');
  const [matchGoal, setMatchGoal] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Catalog Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSoil, setSelectedSoil] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [activeSpeciesModal, setActiveSpeciesModal] = useState<Species | null>(null);

  // Matcher Options
  const soilOptions = [
    { value: 'all', label: 'Any Soil Texture' },
    { value: 'loamy', label: 'Loamy (Balanced & Fertile Humus)' },
    { value: 'sandy', label: 'Sandy (Porous, Fast-Draining Silicate)' },
    { value: 'clayey', label: 'Clayey (Dense, Moisture-Retentive)' },
    { value: 'rocky', label: 'Rocky / Stony (Thin Basalt Bedrock)' },
  ];

  const slopeOptions = [
    { value: 'all', label: 'Any Slope / Topography' },
    { value: 'flat', label: 'Flat Valley / Plain (0° – 5°)' },
    { value: 'gentle', label: 'Gentle Rolling Slope (5° – 15°)' },
    { value: 'steep', label: 'Steep Hillside (> 15° Erosion Risk)' },
  ];

  const waterOptions = [
    { value: 'all', label: 'Any Moisture Level' },
    { value: 'low', label: 'Arid / Low Rainfall (< 600mm / Year)' },
    { value: 'medium', label: 'Moderate Seasonal Rains (600–1200mm)' },
    { value: 'high', label: 'High Moisture / Riparian (> 1200mm)' },
  ];

  const goalOptions = [
    { value: 'all', label: 'Any Ecological Goal' },
    { value: 'erosion-control', label: 'Soil Defense & Slope Stabilization' },
    { value: 'fast-growth', label: 'Rapid Canopy Reforestation' },
    { value: 'drought', label: 'Maximum Drought & Heat Hardiness' },
    { value: 'fruit', label: 'Fruit, Forage & Pollinators' },
    { value: 'timber', label: 'Hardwood Timber & Agroforestry' },
    { value: 'shade', label: 'Microclimate Cooling & Broad Shade' },
    { value: 'medicinal', label: 'Medicinal & Traditional Healing' },
    { value: 'ornamental', label: 'Ornamental & Flowering Aesthetic' },
  ];

  // Matcher Dynamic Scoring Engine
  const scoredRecommendations = useMemo(() => {
    const hasAnyFilter = matchSoil !== 'all' || matchSlope !== 'all' || matchWater !== 'all' || matchGoal !== 'all';

    return SPECIES_DATA.map((sp) => {
      let score = 50;
      const reasons: string[] = [];

      // 1. Soil Texture Evaluation (Weight: ±30)
      if (matchSoil !== 'all') {
        if (sp.soil_types.includes(matchSoil as any)) {
          score += 30;
          if (matchSoil === 'rocky') reasons.push('Taproots naturally penetrate fractured rocky basalt terraces');
          else if (matchSoil === 'clayey') reasons.push('Sturdy root system thrives through dense, shrink-swell clay horizons');
          else if (matchSoil === 'sandy') reasons.push('Fibrous root mats actively bind loose, fast-draining sandy soil');
          else if (matchSoil === 'loamy') reasons.push('Maximizes nutrient cycling in fertile loamy humus');
        } else {
          score -= 35; // Incompatible soil significantly penalized
        }
      }

      // 2. Slope / Elevation Evaluation (Weight: ±25)
      if (matchSlope !== 'all') {
        if (matchSlope === 'steep') {
          if (sp.purpose.includes('erosion-control') || sp.soil_types.includes('rocky')) {
            score += 25;
            reasons.push('High-tensile root network prevents steep slope failure and runoff gullies');
          } else {
            score -= 15;
          }
        } else if (matchSlope === 'flat') {
          if (sp.water_need === 'high' || sp.soil_types.includes('clayey')) {
            score += 15;
            reasons.push('Resilient against water-pooling on flat alluvial basin soils');
          } else {
            score += 10;
          }
        } else if (matchSlope === 'gentle') {
          score += 10;
          reasons.push('Ideal growth habit for gentle rolling terrain');
        }
      }

      // 3. Moisture / Water Evaluation (Weight: ±25)
      if (matchWater !== 'all') {
        const targetWater = (matchWater === 'moderate' ? 'medium' : matchWater) as 'low' | 'medium' | 'high';
        if (sp.water_need === targetWater) {
          score += 25;
          if (targetWater === 'low') reasons.push('Drought-hardy physiology with minimal seasonal water requirement');
          else if (targetWater === 'high') reasons.push('High transpiration capacity well suited to riparian stream banks');
          else reasons.push('Balanced seasonal water consumption matching moderate regional rainfall');
        } else if (targetWater === 'low') {
          if (sp.water_need === 'high') score -= 35; // High water tree in arid site will desiccate
          else score -= 10;
        } else if (targetWater === 'high') {
          if (sp.water_need === 'medium') score += 10;
          else if (sp.water_need === 'low') score -= 15; // Xerophytic tree risks root rot in saturated soil
        } else if (targetWater === 'medium') {
          if (sp.water_need === 'low') score += 10;
          else if (sp.water_need === 'high') score -= 15;
        }
      }

      // 4. Primary Objective / Goal Evaluation (Weight: +25)
      if (matchGoal !== 'all') {
        if (matchGoal === 'erosion-control' && sp.purpose.includes('erosion-control')) {
          score += 25;
          reasons.push('Certified high-grade root binding for slope soil defense');
        } else if (matchGoal === 'fast-growth' && sp.growth_rate === 'fast') {
          score += 25;
          reasons.push('Fast growth velocity delivers rapid ground cover and leaf canopy');
        } else if (matchGoal === 'drought' && sp.water_need === 'low') {
          score += 25;
          reasons.push('Exceptional drought dormancy survives extended dry spells');
        } else if (matchGoal === 'fruit' && sp.purpose.includes('fruit')) {
          score += 25;
          reasons.push('Abundant fruit & forage production supporting wildlife and community');
        } else if (matchGoal === 'timber' && sp.purpose.includes('timber')) {
          score += 25;
          reasons.push('Dense hardwood grain suitable for sustainable agroforestry');
        } else if (matchGoal === 'shade' && sp.purpose.includes('shade')) {
          score += 25;
          reasons.push('Broad umbrella crown creating cool forest microclimate');
        } else if (matchGoal === 'medicinal' && sp.purpose.includes('medicinal')) {
          score += 25;
          reasons.push('High therapeutic value in indigenous pharmacology and wellness');
        } else if (matchGoal === 'ornamental' && sp.purpose.includes('ornamental')) {
          score += 25;
          reasons.push('Striking floral bloom and aesthetic landscape value');
        }
      }

      // Fallback baseline reason
      if (reasons.length === 0) {
        if (sp.purpose.includes('erosion-control')) {
          reasons.push('Natural soil-binder recommended for diversified native canopy');
        } else {
          reasons.push(`Resilient native species adapted to ${sp.soil_types.join(', ')} terrain`);
        }
      }

      // Clamp score between 30% and 98%
      const finalScore = hasAnyFilter
        ? Math.min(98, Math.max(30, score))
        : 70 + (sp.purpose.length * 5) + (sp.soil_types.length * 3);

      return {
        species: sp,
        matchPct: Math.min(finalScore, 98),
        primaryReason: reasons[0],
        allReasons: reasons,
      };
    }).sort((a, b) => {
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
      return a.species.name.localeCompare(b.species.name);
    });
  }, [matchSoil, matchSlope, matchWater, matchGoal]);

  // Catalog filtered list
  const catalogSpecies = useMemo(() => {
    return SPECIES_DATA.filter((sp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sp.name.toLowerCase().includes(q);
        const matchesSci = sp.scientific_name.toLowerCase().includes(q);
        const matchesCare = sp.care_instructions.toLowerCase().includes(q);
        if (!matchesName && !matchesSci && !matchesCare) return false;
      }
      if (selectedSoil !== 'all') {
        if (!sp.soil_types.includes(selectedSoil as any)) return false;
      }
      if (selectedPurpose !== 'all') {
        if (selectedPurpose === 'drought') {
          if (sp.water_need !== 'low') return false;
        } else {
          if (!sp.purpose.includes(selectedPurpose as any)) return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedSoil, selectedPurpose]);

  const soilsList = [
    { id: 'all', label: 'All Soils' },
    { id: 'loamy', label: 'Loamy' },
    { id: 'sandy', label: 'Sandy' },
    { id: 'clayey', label: 'Clay' },
    { id: 'rocky', label: 'Rocky / Slopes' },
  ];

  const purposesList = [
    { id: 'all', label: 'All Categories' },
    { id: 'erosion-control', label: 'Erosion Defense' },
    { id: 'drought', label: 'Drought Hardy' },
    { id: 'shade', label: 'Broad Shade' },
    { id: 'fruit', label: 'Fruit & Food' },
    { id: 'timber', label: 'Timber & Agroforestry' },
  ];

  const hasMatcherFilters = matchSoil !== 'all' || matchSlope !== 'all' || matchWater !== 'all' || matchGoal !== 'all';

  const resetMatcher = () => {
    setMatchSoil('all');
    setMatchSlope('all');
    setMatchWater('all');
    setMatchGoal('all');
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Optional Standalone Header */}
      {!hideHeader && (
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>Botanical Field Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Native Species & Soil Matcher
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
            Select your specific site conditions (soil type, slope angle, and water) to receive tailored tree recommendations, or browse our catalog of {SPECIES_DATA.length} resilient native trees.
          </p>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode('matcher')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'matcher'
                ? 'bg-white dark:bg-[#161D18] text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-white/10'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive Condition Matcher</span>
            {hasMatcherFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('catalog')}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'catalog'
                ? 'bg-white dark:bg-[#161D18] text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-white/10'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Full Catalog ({SPECIES_DATA.length} Species)</span>
          </button>
        </div>

        {activeMode === 'matcher' && hasMatcherFilters && (
          <button
            type="button"
            onClick={resetMatcher}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
          >
            Reset Conditions
          </button>
        )}
      </div>

      {/* ===================== VIEW 1: INTERACTIVE CONDITION MATCHER ===================== */}
      {activeMode === 'matcher' && (
        <motion.div
          key="matcher-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-8"
        >
          {/* Dropdown Control Panel */}
          <div className="canopy-card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Site Condition Selector
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-light mt-0.5">
                  Select your ground characteristics below. Canopy's ecological engine will instantly rank the best trees for your terrain.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Live Dynamic Matching
              </span>
            </div>

            {/* 4 Interactive Dropdowns in a Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Soil Type Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Soil Texture</span>
                </label>
                <div className="relative">
                  <select
                    value={matchSoil}
                    onChange={(e) => setMatchSoil(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {soilOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-100 dark:bg-[#121614] text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-light">
                  Affects root penetration & drainage.
                </p>
              </div>

              {/* 2. Slope / Elevation Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Slope & Gradient</span>
                </label>
                <div className="relative">
                  <select
                    value={matchSlope}
                    onChange={(e) => setMatchSlope(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {slopeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-100 dark:bg-[#121614] text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-light">
                  Determines shear force & erosion risk.
                </p>
              </div>

              {/* 3. Water / Moisture Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Moisture Availability</span>
                </label>
                <div className="relative">
                  <select
                    value={matchWater}
                    onChange={(e) => setMatchWater(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {waterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-100 dark:bg-[#121614] text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-light">
                  Watering regime or natural rainfall.
                </p>
              </div>

              {/* 4. Planting Goal Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Primary Objective</span>
                </label>
                <div className="relative">
                  <select
                    value={matchGoal}
                    onChange={(e) => setMatchGoal(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {goalOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-100 dark:bg-[#121614] text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-light">
                  Specific ecological or utilitarian benefit.
                </p>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs px-1 text-zinc-600 dark:text-zinc-400 font-medium">
            <span>
              Ranked recommendations for your site: <strong className="text-zinc-900 dark:text-white">{scoredRecommendations.length} candidates</strong>
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Ordered by ecological suitability score
            </span>
          </div>

          {/* Ranked Tree Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scoredRecommendations.slice(0, visibleCount).map((rec, index) => {
              const sp = rec.species;
              const isTopPick = index < 3;
              const isErosionDefense = sp.purpose.includes('erosion-control');

              return (
                <div
                  key={sp.id}
                  className="canopy-card p-5 flex flex-col justify-between group hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => setActiveSpeciesModal(sp)}
                >
                  <div className="space-y-4">
                    {/* Image & Match Percentage Badge */}
                    <div className="relative h-44 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                      <img
                        src={sp.image_url}
                        alt={sp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Match Score Badge */}
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-md border shadow-sm flex items-center gap-1.5 bg-black/60 text-white border-white/20">
                        <span className={`w-2 h-2 rounded-full ${rec.matchPct >= 85 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{rec.matchPct}% Match</span>
                      </div>

                      {isTopPick && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-zinc-950 shadow-md">
                          Rank #{index + 1} Best Fit
                        </div>
                      )}

                      <span className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white font-medium truncate drop-shadow-sm">
                        {sp.name}
                      </span>
                    </div>

                    {/* Title and botanical name */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {sp.name}
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {sp.mature_height_m}m tall
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                        {sp.scientific_name}
                      </div>
                    </div>

                    {/* Why this tree fits badge */}
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 space-y-1.5">
                      <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Why this fits your site</span>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300 font-light leading-snug">
                        {rec.allReasons.slice(0, 2).map((reason, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-0.5">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soil compatibility badges */}
                    <div className="flex flex-wrap gap-1">
                      {sp.soil_types.map((st) => (
                        <span
                          key={st}
                          className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-md border ${
                            matchSoil === st
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold'
                              : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5'
                          }`}
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSpeciesModal(sp);
                      }}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center gap-1"
                    >
                      <span>Botanical Dossier</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tree-tracker?species=${encodeURIComponent(sp.name)}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>Plant Specie</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more candidates control */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {scoredRecommendations.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 12, scoredRecommendations.length))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>Load More Candidates ({visibleCount} of {scoredRecommendations.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {visibleCount < scoredRecommendations.length && (
              <button
                type="button"
                onClick={() => setVisibleCount(scoredRecommendations.length)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <span>Show All {scoredRecommendations.length}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveMode('catalog')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <span>Browse All {SPECIES_DATA.length} Species in Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ===================== VIEW 2: COMPLETE SPECIES CATALOG ===================== */}
      {activeMode === 'catalog' && (
        <motion.div
          key="catalog-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Search & Category Filter Bar */}
          <div className="canopy-card p-5 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search all ${SPECIES_DATA.length} native trees by common or scientific name…`}
                className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Purpose Pills */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Ecological Purpose
              </div>
              <div className="flex flex-wrap gap-1.5">
                {purposesList.map((p) => {
                  const active = selectedPurpose === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPurpose(p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soil Pills */}
            <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Soil Texture
              </div>
              <div className="flex flex-wrap gap-1.5">
                {soilsList.map((s) => {
                  const active = selectedSoil === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSoil(s.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1">
            <span>
              Showing <strong className="text-zinc-900 dark:text-white">{catalogSpecies.length}</strong> native species
            </span>
            {(selectedSoil !== 'all' || selectedPurpose !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSoil('all');
                  setSelectedPurpose('all');
                  setSearchQuery('');
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {catalogSpecies.map((sp) => {
              const isErosionHero = sp.purpose.includes('erosion-control');
              return (
                <div
                  key={sp.id}
                  onClick={() => setActiveSpeciesModal(sp)}
                  className="canopy-card p-5 flex flex-col justify-between group hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="relative h-44 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                      <img
                        src={sp.image_url}
                        alt={sp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {isErosionHero && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500 text-zinc-950 font-semibold shadow-xs">
                          Soil Defense
                        </span>
                      )}

                      <span className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white font-medium truncate">
                        {sp.name}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {sp.name}
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {sp.mature_height_m}m
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                        {sp.scientific_name}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-1 font-light">
                        {sp.care_instructions}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300">
                        {sp.water_need} water
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300">
                        {sp.growth_rate} growth
                      </span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs group-hover:translate-x-0.5 transition-transform font-medium">
                      Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {catalogSpecies.length === 0 && (
            <div className="canopy-card p-12 text-center space-y-3">
              <Sprout className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No matching species found</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-light">
                Try adjusting your search query or selecting "All Soils" to see more candidates.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ===================== MODAL DETAIL DRAWER ===================== */}
      <AnimatePresence>
        {activeSpeciesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setActiveSpeciesModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111713] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {activeSpeciesModal.name}
                  </h2>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 italic">
                    {activeSpeciesModal.scientific_name}
                  </div>
                </div>
                <button
                  onClick={() => setActiveSpeciesModal(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-56 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                <img
                  src={activeSpeciesModal.image_url}
                  alt={activeSpeciesModal.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Spec grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Mature Height</span>
                  <span className="text-zinc-900 dark:text-white font-medium">{activeSpeciesModal.mature_height_m} meters</span>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Growth Speed</span>
                  <span className="text-zinc-900 dark:text-white font-medium capitalize">{activeSpeciesModal.growth_rate}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Water Needs</span>
                  <span className="text-zinc-900 dark:text-white font-medium capitalize">{activeSpeciesModal.water_need}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Season</span>
                  <span className="text-zinc-900 dark:text-white font-medium capitalize">{activeSpeciesModal.planting_season}</span>
                </div>
              </div>

              {/* Compatible soils */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-zinc-500">Compatible Soil Textures</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSpeciesModal.soil_types.map((st) => (
                    <span
                      key={st}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 capitalize"
                    >
                      {st} soil
                    </span>
                  ))}
                </div>
              </div>

              {/* Care and soil protection instructions */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase text-zinc-500">Field Care & Soil Stabilization</span>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-light">
                  {activeSpeciesModal.care_instructions}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    const name = activeSpeciesModal.name;
                    setActiveSpeciesModal(null);
                    navigate(`/tree-tracker?species=${encodeURIComponent(name)}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Plant This Tree on Field Map
                </button>
                <button
                  onClick={() => setActiveSpeciesModal(null)}
                  className="py-2.5 px-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-black/10 dark:border-white/10 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
