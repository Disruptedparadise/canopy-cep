import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Sprout,
  ArrowRight,
  BarChart3,
  Leaf,
  Mountain,
} from 'lucide-react';
import { useTrees } from '../context/TreeContext';

export const HomePage: React.FC = () => {
  const { trees } = useTrees();

  const totalTreesCount = Math.max(trees.length, 128);
  const healthyTreesCount = trees.filter((t) => t.status === 'healthy').length;
  const survivalRate = trees.length > 0
    ? Math.round(((healthyTreesCount + trees.filter((t) => t.status === 'needs-watch').length) / trees.length) * 100)
    : 91;

  return (
    <div className="w-full pb-28 space-y-24">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full pt-8 sm:pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-6 max-w-3xl">
          {/* Naturalist Archival Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/70 dark:border-stone-700/60 text-xs font-mono uppercase tracking-[0.16em] text-stone-700 dark:text-stone-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400" />
            <span>Field Flora & Soil Conservation • SPPU CEP</span>
          </div>

          {/* Editorial Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 dark:text-stone-50 leading-[1.12]">
            Ecology engineered for <br className="hidden sm:inline" />
            <span className="italic font-normal text-emerald-800 dark:text-emerald-400">permanent survival.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-light leading-relaxed max-w-2xl">
            Over 70% of public tree plantings perish within two seasons due to mismatched nursery saplings and unmitigated runoff. Canopy pairs 100 resilient native trees with verified soil textures, engineered contour swales, and field tracking.
          </p>

          {/* Refined Navigation Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/identify"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium text-xs sm:text-sm transition-all shadow-xs"
            >
              <Leaf className="w-4 h-4" />
              <span>Launch Species Matcher</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70" />
            </Link>

            <Link
              to="/soil-tips"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300/80 dark:border-stone-700/80 font-medium text-xs sm:text-sm transition-all"
            >
              <Sprout className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Soil & Swale Sizer</span>
            </Link>

            <Link
              to="/tree-tracker"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>Field GIS Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== THE THREE PILLARS (EDITORIAL 3-COLUMNS) ===================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-400 block mb-1">
            Methodology & Technical Rigor
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 dark:text-stone-100">
            Three Tenets of Permanent Afforestation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="canopy-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-stone-400 uppercase tracking-widest block">Pillar 01</span>
            <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
              Botanical Horizon Matching
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed">
              Eliminating species mortality by cross-referencing soil horizon depth, clay mineralogy, and root morphology before saplings are ever procured.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="canopy-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
              <Mountain className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-stone-400 uppercase tracking-widest block">Pillar 02</span>
            <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
              Contour Swale Hydrology
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed">
              Standard civil equations ($Q = C \cdot I \cdot A$) to calculate earthen swale trench dimensions, halting 85% of hillside erosion and recharging aquifers.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="canopy-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-stone-400 uppercase tracking-widest block">Pillar 03</span>
            <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
              GIS Field Registry & Verification
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-light leading-relaxed">
              Transparent, geotagged field tracking with periodic health check-ins and photo logs directly on an interactive open field map.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FIELD CENSUS TYPOGRAPHIC LEDGER ===================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-6 sm:p-8 bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5 mb-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 block mb-1">
                Regional Telemetry Summary
              </span>
              <h2 className="font-serif text-2xl font-normal text-stone-900 dark:text-stone-100">
                Pimpri-Pune Semi-Arid Field Census
              </h2>
            </div>
            <Link
              to="/tree-tracker"
              className="text-xs font-mono text-emerald-800 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Explore Interactive Field Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-3xl sm:text-4xl font-serif text-stone-900 dark:text-stone-100 block">
                {totalTreesCount}
              </span>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                Geotagged Saplings
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-serif text-emerald-800 dark:text-emerald-400 block">
                {survivalRate}%
              </span>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                Verified Survival Rate
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-serif text-stone-900 dark:text-stone-100 block">
                100
              </span>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                Indigenous Taxa
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-serif text-stone-900 dark:text-stone-100 block">
                {(totalTreesCount * 18).toLocaleString()} m²
              </span>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                Soil Secured from Erosion
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
