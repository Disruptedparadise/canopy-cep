import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trees,
  Compass,
  Camera,
  Sprout,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const tools = [
    {
      title: 'Longitudinal Survival Dashboard',
      route: '/dashboard',
      icon: BarChart3,
      tag: 'Survival Tracking',
      description:
        'Replaces vanity "trees planted" numbers with real-time cohort survival curves, mortality risk factor analyses, and check-in audit logs.',
    },
    {
      title: 'Right-Species Site Matching',
      route: '/identify?tab=conditions',
      icon: Compass,
      tag: 'Silviculture Science',
      description:
        'Prevents fatal mismatches by filtering botanical candidates against native soil horizons, water availability, slope angle, and local climate zones.',
    },
    {
      title: 'Field Photo Recognition & Diagnostics',
      route: '/identify?tab=photo',
      icon: Camera,
      tag: 'Computer Vision',
      description:
        'Assists arborists and volunteers in verifying specimen taxonomy from leaf venation and trunk bark to detect foliage stress early.',
    },
    {
      title: 'Soil Humus & Erosion Protocols',
      route: '/soil-tips',
      icon: Sprout,
      tag: 'Soil Hydrology',
      description:
        'Hands-on field instructions for contour swales, vetiver root nets, biochar enrichment, and living organic mulch blankets.',
    },
  ];

  return (
    <div className="w-full pb-20 space-y-16">
      {/* Header Banner */}
      <section className="relative w-full pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>The Science of Tree Survival</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Why Millions of Trees Are Planted, But Few Survive
          </h1>

          <p className="text-base sm:text-lg text-gray-400 font-light leading-relaxed">
            Moving beyond token ceremonial planting events to permanent silvicultural survival and longitudinal watershed regeneration.
          </p>
        </div>
      </section>

      {/* Main Page Body Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* The Core Problem & Mission Statement */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>The Plantation Fallacy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug tracking-tight">
              Most tree-planting initiatives fail because they celebrate seedlings in the ground, not mature canopies.
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-gray-400 leading-relaxed font-light">
              <p>
                Around the globe, millions of saplings are planted each monsoon season in high-publicity drives. Yet global forestry research consistently shows that <strong className="text-white">between 60% and 80% of unmonitored saplings perish within their first 18 months</strong> due to incorrect species placement, summer desiccation, livestock grazing, and soil erosion.
              </p>
              <p>
                Planting without follow-up is not restoration — it is a waste of seed, volunteer labor, and ecological capital. RootGuard establishes an immutable field ledger where survival audits are verified year after year.
              </p>
            </div>
          </div>

          {/* Mission Box */}
          <div className="lg:col-span-5 p-7 rounded-3xl bg-gradient-to-b from-[#0F1C12]/90 to-[#070D08]/90 border border-emerald-500/20 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span className="font-semibold">Conservation Mandate</span>
            </div>

            <blockquote className="text-sm sm:text-base text-gray-200 leading-relaxed italic">
              &ldquo;RootGuard transforms reforestation into a disciplined, data-verified craft. We hold every plantation accountable to survival percentages, protect fragile watershed soils, and match every seedling to its precise pedological niche.&rdquo;
            </blockquote>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>Survival Standard</span>
              <span className="text-emerald-400 font-semibold">100% Geotagged</span>
            </div>
          </div>
        </section>

        {/* The 4 Core Modules */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Platform Modules</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 4 Pillars of RootGuard
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="p-6 sm:p-7 rounded-2xl bg-[#0C150E]/80 backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                        {tool.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed font-light">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-white/[0.06]">
                    <Link
                      to={tool.route}
                      className="inline-flex items-center justify-between w-full text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors"
                    >
                      <span>Explore Module</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-emerald-950/40 via-[#0A140E] to-emerald-950/30 border border-emerald-500/20 text-center space-y-4">
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Field Action
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to Log Your First Planting?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-light">
              Record coordinates, check sapling vitality, or run your site soil parameters through the species engine.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/tree-tracker?action=new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-semibold text-xs shadow-md transition-all"
              >
                <Trees className="w-4 h-4" />
                <span>Open Tree Tracker</span>
              </Link>
              <Link
                to="/identify?tab=conditions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] font-medium text-xs transition-all"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Find Compatible Species</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
