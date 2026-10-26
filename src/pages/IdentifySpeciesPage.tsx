import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { SpeciesGuidePage } from './SpeciesGuidePage';
import { PhotoRecognitionPage } from './PhotoRecognitionPage';
import { Leaf, Camera, Upload, Compass } from 'lucide-react';

export const IdentifySpeciesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const currentTab: 'conditions' | 'photo' | 'camera' =
    tabParam === 'photo' ? 'photo' : tabParam === 'camera' ? 'camera' : 'conditions';

  const handleTabChange = (newTab: 'conditions' | 'photo' | 'camera') => {
    const updated = new URLSearchParams(searchParams);
    if (newTab === 'photo' || newTab === 'camera') {
      updated.set('tab', newTab);
    } else {
      updated.delete('tab');
    }
    setSearchParams(updated, { replace: true });
  };

  const tabs = [
    { id: 'conditions', label: 'Species Catalog & Soil Match', icon: Leaf },
    { id: 'photo', label: 'Upload Leaf/Bark Photo', icon: Upload },
    { id: 'camera', label: 'Live Camera Scanner', icon: Camera },
  ];

  return (
    <div className="w-full pb-16 space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Title & Spring-Animated Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-black/10 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Species Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Identify & Match Species
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-light max-w-xl leading-relaxed">
            Filter 100 resilient native trees against your site soil and slope, or identify unknown specimens from leaves and bark.
          </p>
        </div>

        {/* Linear Spring Segmented Control Tabs */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/10 dark:border-white/10 self-start md:self-auto">
          {tabs.map((tab) => {
            const active = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as any)}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none flex items-center gap-2 ${
                  active
                    ? 'text-zinc-950 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="speciesTabIndicator"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    className="absolute inset-0 bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-full shadow-xs"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View */}
      <main id="identify-tab-panel">
        {currentTab === 'conditions' ? (
          <SpeciesGuidePage hideHeader={true} />
        ) : (
          <PhotoRecognitionPage
            hideHeader={true}
            initialMode={currentTab === 'camera' ? 'camera' : 'upload'}
            onModeChange={(mode) => {
              if (mode === 'camera' && currentTab !== 'camera') {
                handleTabChange('camera');
              } else if (mode === 'upload' && currentTab === 'camera') {
                handleTabChange('photo');
              }
            }}
          />
        )}
      </main>
    </div>
  );
};
