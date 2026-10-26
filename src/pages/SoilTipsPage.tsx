import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Shield,
  Layers,
  CheckCircle2,
  Mountain,
  Droplets,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SoilTipsPage: React.FC = () => {
  const [selectedSlope, setSelectedSlope] = useState<'flat' | 'gentle' | 'steep'>('gentle');
  const [selectedSoil, setSelectedSoil] = useState<'loamy' | 'sandy' | 'clayey' | 'rocky'>('loamy');

  const protocols = [
    {
      id: 'swales',
      number: '01',
      title: 'Contour Swales & Water Infiltration',
      subtitle: 'Slope Hydrology',
      paragraph: 'Digging level shallow trenches along natural contour lines slows rainwater runoff from minutes to hours, allowing deep percolation into subterranean aquifers instead of washing away fertile topsoil.',
      steps: [
        'Survey elevation contours using an A-frame or water level.',
        'Excavate trenches 30–50cm deep, placing soil on the downhill side to form an uncompacted berm.',
        'Plant deep-rooting trees and vetiver grass directly along the mound to lock soil in place.',
      ],
      tag: 'Runoff Reduction',
      impact: 'Up to 85% less runoff',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'mulching',
      number: '02',
      title: 'Living Organic Mulch Blankets',
      subtitle: 'Moisture Retention',
      paragraph: 'Bare soil exposed to harsh sunlight and heavy rain loses organic matter rapidly. A 10cm blanket of dried leaves, straw, and woodchips keeps soil temperature cool, feeds earthworms, and preserves moisture.',
      steps: [
        'Apply 8–10cm of coarse organic mulch around sapling root basins.',
        'Keep mulch 5cm away from the tree stem to prevent fungal collar rot.',
        'Replenish annually before the onset of summer heat.',
      ],
      tag: 'Thermal Protection',
      impact: 'Cuts watering need by 50%',
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'vetiver',
      number: '03',
      title: 'Deep-Root Vetiver & Grass Buffers',
      subtitle: 'Biological Rebar',
      paragraph: 'Vetiver grass features massive spongy roots growing up to 3 meters deep within 12 months. Planted in continuous hedgerows across slopes, it acts like living underground concrete rebar.',
      steps: [
        'Plant vetiver slips 10–15cm apart in a single row across slopes.',
        'Form continuous hedges along field borders and stream embankments.',
        'Prune foliage to 30cm twice a year to stimulate root growth and yield organic mulch.',
      ],
      tag: 'Slope Stabilization',
      impact: 'Forms 3m root matrix',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'biochar',
      number: '04',
      title: 'Biochar & Organic Humus Enrichment',
      subtitle: 'Microbial Habitat',
      paragraph: 'Pyrolyzed biomass (biochar) inoculates soil with high-surface-area microscopic pores where mycorrhizal fungi, beneficial microbes, and nutrients anchor permanently for decades without decomposing.',
      steps: [
        'Crush biochar to pea-sized particles (2–5mm).',
        'Pre-charge ("inoculate") biochar with compost tea or cow dung slurry for 2 weeks.',
        'Mix 10% activated biochar into planting pit backfill before placing saplings.',
      ],
      tag: 'Permanent Soil Carbon',
      impact: 'Century-long carbon store',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'covercrop',
      number: '05',
      title: 'Nitrogen-Fixing Cover Crops',
      subtitle: 'Biological Fertilizer',
      paragraph: 'Interplanting leguminous companion plants (Sunn hemp, Cowpea, Velvet bean) fixes atmospheric nitrogen into the root zone while shading out invasive grasses between young trees.',
      steps: [
        'Broadcast legume seeds between tree rows at first monsoon showers.',
        'Allow cover to grow until flowering, then crimp or chop as surface mulch.',
        'Leaves release slow-release nitrogen directly into companion tree root zones.',
      ],
      tag: 'Fertility Generation',
      impact: '40–60 kg/ha nitrogen',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'windbreaks',
      number: '06',
      title: 'Tiered Windbreak & Riparian Buffers',
      subtitle: 'Microclimate Shelter',
      paragraph: 'Multi-tiered shelterbelts combining shrubs, medium trees (Moringa, Khair), and tall emergent trees (Casuarina, Shisham) deflect damaging desiccating winds and reduce soil moisture loss.',
      steps: [
        'Orient tree rows perpendicular to prevailing summer winds.',
        'Plant dense low shrubs on the windward side, followed by medium and tall canopies.',
        'Provides a protected microclimate extending 10–15 times tree height downwind.',
      ],
      tag: 'Desiccation Defense',
      impact: 'Reduces wind speed 60%',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Dynamic Slope & Soil Recommendation logic
  const getSlopeAdvice = () => {
    if (selectedSlope === 'steep') {
      if (selectedSoil === 'sandy' || selectedSoil === 'rocky') {
        return {
          risk: 'High Erosion Vulnerability',
          riskColor: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          recommendation: 'Loose sand or rock on steep slopes easily washes away under monsoonal rains. Plant continuous Vetiver grass hedges across contour lines every 3–4 meters. Interplant deep-anchoring pioneer trees like Khair, Babool, and Subabul with zero tillage.',
        };
      }
      return {
        risk: 'Moderate Slope Runoff',
        riskColor: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
        recommendation: 'Construct staggered contour swales with stone-reinforced overflow outlets. Mulch all exposed slope surfaces with 10cm dry leaves and plant deep-taproot trees like Banyan, Neem, and Arjun.',
      };
    }

    if (selectedSlope === 'gentle') {
      return {
        risk: 'Ideal Infiltration Conditions',
        riskColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        recommendation: 'Gentle slopes are ideal for wide water harvesting swales. Dig broad, shallow swales along contours to capture monsoonal overflow. Plant companion fruit and timber species (Jamun, Tamarind, Teak, Mango).',
      };
    }

    return {
      risk: 'Low Erosion / High Absorption',
      riskColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      recommendation: 'Flat terrain rarely erodes from runoff, but heavy clay can suffer waterlogging. Focus on deep biochar enrichment, thick leaf mulching, and planting moisture-tolerant trees like Jamun, Arjun, and Bamboo.',
    };
  };

  const advice = getSlopeAdvice();

  return (
    <div className="w-full pb-20 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-fadeIn">
      {/* Title */}
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/70 dark:border-stone-700/60 text-xs font-mono uppercase tracking-[0.16em] text-stone-700 dark:text-stone-300">
          <Sprout className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span>Soil Agronomy & Protection</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Soil Health & Swale Hydrology
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 font-light leading-relaxed">
          Field-tested techniques to stabilize hillsides, build living topsoil humus, and protect tree saplings from drought and runoff.
        </p>
      </div>

      {/* Interactive Slope & Soil Advisor */}
      <section className="canopy-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Interactive Slope & Soil Defense Advisor</span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-light">
              Select your site parameters to get instant recommended soil practices.
            </p>
          </div>
          <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-semibold border ${advice.riskColor}`}>
            {advice.risk}
          </span>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-500 uppercase">Slope Gradient</span>
            <div className="flex gap-1.5">
              {[
                { id: 'flat', label: 'Flat (0–5°)' },
                { id: 'gentle', label: 'Gentle (5–15°)' },
                { id: 'steep', label: 'Steep (>15°)' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSlope(s.id as any)}
                  className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                    selectedSlope === s.id
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-500 uppercase">Dominant Soil</span>
            <div className="flex gap-1.5">
              {[
                { id: 'loamy', label: 'Loamy' },
                { id: 'sandy', label: 'Sandy' },
                { id: 'clayey', label: 'Clay' },
                { id: 'rocky', label: 'Rocky' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSoil(s.id as any)}
                  className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                    selectedSoil === s.id
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advice Output */}
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-light">
          <strong className="text-zinc-950 dark:text-white block font-bold mb-1">Recommended Field Strategy:</strong>
          {advice.recommendation}
        </div>
      </section>

      {/* 6 Visual Protocol Cards */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
            6 Core Soil Protection Protocols
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Field-Proven Methods
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {protocols.map((proto) => (
            <div
              key={proto.id}
              className="canopy-card hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 w-full overflow-hidden bg-black/5 dark:bg-white/5">
                  <img
                    src={proto.image}
                    alt={proto.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      {proto.number}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-md font-semibold">
                      {proto.tag}
                    </span>
                  </div>

                  <span className="absolute bottom-3 left-3 text-xs font-mono text-zinc-200">
                    {proto.impact}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3.5">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-zinc-500 block">
                      {proto.subtitle}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                      {proto.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
                    {proto.paragraph}
                  </p>

                  {/* Checklist */}
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      Key Steps:
                    </span>
                    {proto.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Field Ready</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Standard Protocol ✓</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
