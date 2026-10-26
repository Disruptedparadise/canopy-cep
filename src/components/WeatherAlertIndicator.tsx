import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTrees } from '../context/TreeContext';
import {
  fetchLocalMeteorology,
  crossReferenceTreesWithWeather,
  getTreeCentroid,
  SIMULATION_PRESETS,
  MeteorologicalData,
  WeatherAlertSummary,
  TreeWeatherRisk,
} from '../services/weatherService';
import {
  Sun,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  AlertTriangle,
  Flame,
  Waves,
  ShieldCheck,
  RefreshCw,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Sparkles,
  TreePine,
  Compass,
} from 'lucide-react';

export interface WeatherAlertIndicatorProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const WeatherAlertIndicator: React.FC<WeatherAlertIndicatorProps> = ({
  className = '',
  defaultExpanded = false,
}) => {
  const { t } = useTranslation();
  const { trees } = useTrees();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [meteorology, setMeteorology] = useState<MeteorologicalData | null>(null);
  const [activeScenario, setActiveScenario] = useState<'live' | 'drought' | 'flood'>('live');
  const [showVulnerableDrawer, setShowVulnerableDrawer] = useState<boolean>(defaultExpanded);
  const [filterRiskType, setFilterRiskType] = useState<'all' | 'drought' | 'flood' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate coordinates of tree center
  const centroid = useMemo(() => getTreeCentroid(trees), [trees]);

  // Load meteorology data
  const loadWeather = async (scenario: 'live' | 'drought' | 'flood', forceRefresh = false) => {
    if (scenario === 'live') {
      try {
        setRefreshing(true);
        const data = await fetchLocalMeteorology(centroid.lat, centroid.lng, forceRefresh);
        setMeteorology(data);
      } catch (e) {
        console.error('Failed to load weather:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    } else if (scenario === 'drought') {
      setMeteorology(SIMULATION_PRESETS.drought(centroid.lat, centroid.lng));
      setLoading(false);
    } else if (scenario === 'flood') {
      setMeteorology(SIMULATION_PRESETS.flood(centroid.lat, centroid.lng));
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(activeScenario);
  }, [centroid.lat, centroid.lng, activeScenario]);

  // Cross-reference trees with meteorological data
  const alertSummary: WeatherAlertSummary = useMemo(() => {
    if (!meteorology) {
      return {
        alertLevel: 'optimal',
        title: 'Loading Meteorological Telemetry...',
        headline: 'Syncing with meteorological satellites and local field stations.',
        description: 'Cross-referencing tree root zones with precipitation and temperature.',
        highDroughtCount: 0,
        highFloodCount: 0,
        moderateRiskCount: 0,
        safeCount: trees.length,
        totalTrees: trees.length,
        treesAtRisk: [],
        meteorology: {
          temperature: 28,
          feelsLike: 29,
          relativeHumidity: 65,
          precipitationMm: 0,
          precipitationSum7d: 15,
          precipitationProbability: 30,
          maxTemp7d: 31,
          evapotranspirationEt0: 3.8,
          windSpeedKmH: 10,
          weatherCode: 1,
          weatherDescription: 'Syncing...',
          locationName: 'Field Basin',
          latitude: centroid.lat,
          longitude: centroid.lng,
          lastUpdated: new Date().toISOString(),
          source: 'live',
        },
      };
    }
    return crossReferenceTreesWithWeather(trees, meteorology);
  }, [trees, meteorology, centroid.lat, centroid.lng]);

  // Filter list of trees at risk
  const filteredTrees = useMemo(() => {
    return alertSummary.treesAtRisk.filter((item) => {
      // Risk filter
      if (filterRiskType === 'drought') {
        if (item.droughtRisk !== 'critical' && item.droughtRisk !== 'high') return false;
      } else if (filterRiskType === 'flood') {
        if (item.floodRisk !== 'critical' && item.floodRisk !== 'high') return false;
      } else if (filterRiskType === 'safe') {
        if (item.droughtRisk !== 'low' || item.floodRisk !== 'low') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sp = (item.tree.species || '').toLowerCase();
        const pl = (item.tree.planter || '').toLowerCase();
        const sl = (item.tree.slope || '').toLowerCase();
        const st = (item.tree.soil_type || '').toLowerCase();
        return sp.includes(q) || pl.includes(q) || sl.includes(q) || st.includes(q);
      }

      return true;
    });
  }, [alertSummary.treesAtRisk, filterRiskType, searchQuery]);

  // Visual Theme Config according to Alert Level
  const alertTheme = useMemo(() => {
    switch (alertSummary.alertLevel) {
      case 'danger-drought':
        return {
          border: 'border-[#A6432D] dark:border-[#A6432D]/70',
          bg: 'bg-[#FBF5F2] dark:bg-[#2A1713]',
          bannerBg: 'bg-[#A6432D] text-white',
          badgeBg: 'bg-[#A6432D]/15 text-[#A6432D] dark:bg-[#A6432D]/30 dark:text-[#FFAAA0]',
          accentText: 'text-[#A6432D] dark:text-[#FFAAA0]',
          metricBg: 'bg-[#F4ECE8] dark:bg-[#341B16] border-[#E8D4CC] dark:border-[#4B2921]',
          icon: Flame,
          categoryName: t('dashboard.weatherAlert.levels.dangerDrought', 'CRITICAL DROUGHT WARNING'),
          gradient: 'from-[#A6432D]/15 to-transparent',
        };
      case 'warning-drought':
        return {
          border: 'border-[#D48B38] dark:border-[#D48B38]/70',
          bg: 'bg-[#FCF8F2] dark:bg-[#261D12]',
          bannerBg: 'bg-[#D48B38] text-white',
          badgeBg: 'bg-[#D48B38]/15 text-[#D48B38] dark:bg-[#D48B38]/30 dark:text-[#F8D29F]',
          accentText: 'text-[#D48B38] dark:text-[#F8D29F]',
          metricBg: 'bg-[#F6EFE3] dark:bg-[#322414] border-[#EADAC5] dark:border-[#4E371C]',
          icon: Sun,
          categoryName: t('dashboard.weatherAlert.levels.warningDrought', 'ELEVATED DROUGHT RISK'),
          gradient: 'from-[#D48B38]/15 to-transparent',
        };
      case 'danger-flood':
        return {
          border: 'border-[#2A5B84] dark:border-[#3B7CA8]/70',
          bg: 'bg-[#F2F7FA] dark:bg-[#0F1E2A]',
          bannerBg: 'bg-[#2A5B84] text-white',
          badgeBg: 'bg-[#2A5B84]/15 text-[#2A5B84] dark:bg-[#3B7CA8]/30 dark:text-[#A8D3F5]',
          accentText: 'text-[#2A5B84] dark:text-[#A8D3F5]',
          metricBg: 'bg-[#E7F0F7] dark:bg-[#162A3B] border-[#CDE0EF] dark:border-[#22425C]',
          icon: Waves,
          categoryName: t('dashboard.weatherAlert.levels.dangerFlood', 'FLASH FLOOD & WASHOUT WARNING'),
          gradient: 'from-[#2A5B84]/15 to-transparent',
        };
      case 'warning-flood':
        return {
          border: 'border-[#3B7CA8] dark:border-[#3B7CA8]/60',
          bg: 'bg-[#F4F8FA] dark:bg-[#12222E]',
          bannerBg: 'bg-[#3B7CA8] text-white',
          badgeBg: 'bg-[#3B7CA8]/15 text-[#3B7CA8] dark:bg-[#3B7CA8]/30 dark:text-[#B6DCF8]',
          accentText: 'text-[#3B7CA8] dark:text-[#B6DCF8]',
          metricBg: 'bg-[#EAF1F6] dark:bg-[#1A2E3D] border-[#D3E3EE] dark:border-[#254359]',
          icon: CloudRain,
          categoryName: t('dashboard.weatherAlert.levels.warningFlood', 'WATERLOGGING ADVISORY'),
          gradient: 'from-[#3B7CA8]/15 to-transparent',
        };
      case 'watch':
        return {
          border: 'border-[#7EBC8A]/60 dark:border-[#2D5A34]',
          bg: 'bg-[#F8FAF7] dark:bg-[#121F14]',
          bannerBg: 'bg-[#2D5A34] text-white',
          badgeBg: 'bg-[#2D5A34]/15 text-[#2D5A34] dark:bg-[#2D5A34]/30 dark:text-[#7EBC8A]',
          accentText: 'text-[#2D5A34] dark:text-[#7EBC8A]',
          metricBg: 'bg-[#EDF3EC] dark:bg-[#182B1C] border-[#D4E3D2] dark:border-[#26452B]',
          icon: Info,
          categoryName: t('dashboard.weatherAlert.levels.watch', 'MICROCLIMATE WATCH'),
          gradient: 'from-[#2D5A34]/10 to-transparent',
        };
      default:
        return {
          border: 'border-[#2D5A34]/40 dark:border-[#223826]',
          bg: 'bg-[#F8FAF7] dark:bg-[#101C12]',
          bannerBg: 'bg-[#2D5A34] text-white',
          badgeBg: 'bg-[#2D5A34]/15 text-[#2D5A34] dark:bg-[#2D5A34]/30 dark:text-[#7EBC8A]',
          accentText: 'text-[#2D5A34] dark:text-[#7EBC8A]',
          metricBg: 'bg-[#EDF3EC] dark:bg-[#162716] border-[#D4E3D2] dark:border-[#223826]',
          icon: ShieldCheck,
          categoryName: t('dashboard.weatherAlert.levels.optimal', 'OPTIMAL SILVICULTURAL WEATHER'),
          gradient: 'from-[#2D5A34]/10 to-transparent',
        };
    }
  }, [alertSummary.alertLevel, t]);

  const StatusIcon = alertTheme.icon;

  return (
    <div
      id="weather-alerts"
      className={`rounded-2xl border ${alertTheme.border} ${alertTheme.bg} shadow-md overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Banner Alert Bar */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                alertSummary.alertLevel.startsWith('danger')
                  ? 'bg-[#A6432D] text-white animate-pulse'
                  : alertSummary.alertLevel.startsWith('warning')
                  ? 'bg-[#D48B38] text-white'
                  : 'bg-[#2D5A34] text-white'
              }`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase ${alertTheme.badgeBg}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  {alertTheme.categoryName}
                </span>

                <span className="text-[11px] font-mono text-[#5E725B] dark:text-[#8FA58C] flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#5EA46C]" />
                  <span>
                    Centroid: {centroid.lat}°N, {centroid.lng}°E
                  </span>
                </span>
              </div>

              <h3 className="font-['Fraunces'] text-xl sm:text-2xl font-bold text-[#162716] dark:text-[#EDF3EC] leading-snug">
                {alertSummary.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#9FB19D] leading-relaxed max-w-3xl">
                {alertSummary.headline}
              </p>
            </div>
          </div>

          {/* Scenario Simulator & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <div className="flex items-center rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveScenario('live')}
                title="Fetch live satellite and meteorological model forecast"
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeScenario === 'live'
                    ? 'bg-[#2D5A34] text-white font-semibold shadow-xs'
                    : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-white'
                }`}
              >
                <span>Live Met Data</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('drought')}
                title="Simulate heatwave drought (>38°C, zero rainfall)"
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeScenario === 'drought'
                    ? 'bg-[#A6432D] text-white font-semibold shadow-xs'
                    : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Simulate Drought</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('flood')}
                title="Simulate monsoon deluge (>180mm rainfall)"
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeScenario === 'flood'
                    ? 'bg-[#2A5B84] text-white font-semibold shadow-xs'
                    : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-white'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>Simulate Flood</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadWeather('live', true)}
              disabled={refreshing}
              title="Re-query Open-Meteo API"
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#5EA46C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Meteorological Data Telemetry Ribbon */}
        {meteorology && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
            {/* Temperature */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-[#D48B38]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
                  {meteorology.temperature}°C
                </span>
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
                Feels like {meteorology.feelsLike}°C
              </div>
            </div>

            {/* Relative Humidity */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>Rel. Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-[#3B7CA8]" />
              </div>
              <div className="text-xl sm:text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
                {meteorology.relativeHumidity}%
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
                {meteorology.relativeHumidity < 30
                  ? 'High desiccation'
                  : meteorology.relativeHumidity > 85
                  ? 'High saturation'
                  : 'Balanced humidity'}
              </div>
            </div>

            {/* 7-Day Rainfall */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>7-Day Rain</span>
                <CloudRain className="w-3.5 h-3.5 text-[#2A5B84]" />
              </div>
              <div className="text-xl sm:text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
                {meteorology.precipitationSum7d} <span className="text-xs font-mono font-normal">mm</span>
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
                {meteorology.precipitationProbability}% precip prob
              </div>
            </div>

            {/* Evapotranspiration ET0 */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>Evaporation (ET₀)</span>
                <Sun className="w-3.5 h-3.5 text-[#E5BA5A]" />
              </div>
              <div className="text-xl sm:text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
                {meteorology.evapotranspirationEt0} <span className="text-xs font-mono font-normal">mm/d</span>
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C]">
                Soil drying demand
              </div>
            </div>

            {/* Wind Velocity */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>Wind Velocity</span>
                <Wind className="w-3.5 h-3.5 text-[#5E725B]" />
              </div>
              <div className="text-xl sm:text-2xl font-['Fraunces'] font-bold text-[#162716] dark:text-[#EDF3EC]">
                {meteorology.windSpeedKmH} <span className="text-xs font-mono font-normal">km/h</span>
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C] truncate">
                {meteorology.windSpeedKmH > 25 ? 'High ridge wind' : 'Mild canopy breeze'}
              </div>
            </div>

            {/* Sky Conditions */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${alertTheme.metricBg} space-y-1`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C] uppercase">
                <span>Condition</span>
                <Sparkles className="w-3.5 h-3.5 text-[#5EA46C]" />
              </div>
              <div className="text-sm font-semibold text-[#162716] dark:text-[#EDF3EC] truncate mt-1" title={meteorology.weatherDescription}>
                {meteorology.weatherDescription}
              </div>
              <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C] flex items-center gap-1 font-mono">
                <span>Source:</span>
                <span className="capitalize font-semibold text-[#2D5A34] dark:text-[#7EBC8A]">
                  {meteorology.source === 'live' ? 'Open-Meteo' : meteorology.source}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cross-Referenced Tree Impact Summary Bar */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-[#5EA46C]" />
              <span className="font-semibold text-[#162716] dark:text-[#EDF3EC]">
                {trees.length} Monitored Saplings
              </span>
            </div>

            <div className="h-4 w-px bg-black/15 dark:bg-white/15 hidden sm:block" />

            {/* High Drought Count */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                alertSummary.highDroughtCount > 0 ? 'text-[#A6432D] font-bold' : 'text-[#5E725B] dark:text-[#8FA58C]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>
                {alertSummary.highDroughtCount} At Drought Risk
              </span>
            </div>

            {/* High Flood Count */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                alertSummary.highFloodCount > 0 ? 'text-[#2A5B84] font-bold' : 'text-[#5E725B] dark:text-[#8FA58C]'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>
                {alertSummary.highFloodCount} In Flood / Washout Zones
              </span>
            </div>

            {/* Safe Count */}
            <div className="flex items-center gap-1.5 text-[#2D5A34] dark:text-[#7EBC8A] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{alertSummary.safeCount} Structurally Safe</span>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setShowVulnerableDrawer(!showVulnerableDrawer)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline cursor-pointer self-start md:self-auto"
          >
            <span>
              {showVulnerableDrawer
                ? 'Hide Vulnerability Audit'
                : `Inspect ${alertSummary.highDroughtCount + alertSummary.highFloodCount} Vulnerable Trees`}
            </span>
            {showVulnerableDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Section: Tree Cross-Reference Inspection & Actionable Remedies */}
      {showVulnerableDrawer && (
        <div className="border-t border-black/10 dark:border-white/10 p-5 sm:p-6 bg-white/40 dark:bg-black/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-['Fraunces'] text-lg font-bold text-[#162716] dark:text-[#EDF3EC]">
                Cross-Referenced Tree Vulnerability Dossier
              </h4>
              <p className="text-xs text-[#5E725B] dark:text-[#8FA58C]">
                Specific tree coordinates evaluated against local soil drainage and slope erosion under active weather vectors.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterRiskType('all')}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                  filterRiskType === 'all'
                    ? 'bg-[#162716] dark:bg-white text-white dark:text-[#162716] font-bold'
                    : 'bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C]'
                }`}
              >
                All ({alertSummary.treesAtRisk.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRiskType('drought')}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                  filterRiskType === 'drought'
                    ? 'bg-[#A6432D] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 text-[#A6432D]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Drought ({alertSummary.highDroughtCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterRiskType('flood')}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                  filterRiskType === 'flood'
                    ? 'bg-[#2A5B84] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 text-[#2A5B84]'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>Flood ({alertSummary.highFloodCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterRiskType('safe')}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                  filterRiskType === 'safe'
                    ? 'bg-[#2D5A34] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 text-[#2D5A34] dark:text-[#7EBC8A]'
                }`}
              >
                Safe ({alertSummary.safeCount})
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by species, planter, soil or slope (e.g., Neem, Sandy, Steep)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-[#101C12] border border-black/15 dark:border-white/15 text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:ring-1 focus:ring-[#2D5A34]"
            />
          </div>

          {/* Tree Risk Cards Grid */}
          {filteredTrees.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#5E725B] dark:text-[#8FA58C] font-mono">
              No trees match the selected filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTrees.map((item) => {
                const isHighDrought = item.droughtRisk === 'critical' || item.droughtRisk === 'high';
                const isHighFlood = item.floodRisk === 'critical' || item.floodRisk === 'high';

                return (
                  <div
                    key={item.treeId}
                    className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#142417]/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                      <div>
                        <div className="font-['Fraunces'] font-bold text-base text-[#162716] dark:text-[#EDF3EC]">
                          {item.tree.species}
                        </div>
                        <div className="text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
                          Planted by {item.tree.planter} • {item.tree.date_planted}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-1">
                        {isHighDrought && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#A6432D]/15 text-[#A6432D] dark:text-[#FFAAA0] flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Drought: {item.droughtScore}%
                          </span>
                        )}
                        {isHighFlood && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#2A5B84]/15 text-[#2A5B84] dark:text-[#A8D3F5] flex items-center gap-1">
                            <Waves className="w-3 h-3" />
                            Flood: {item.floodScore}%
                          </span>
                        )}
                        {!isHighDrought && !isHighFlood && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#2D5A34]/15 text-[#2D5A34] dark:text-[#7EBC8A] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Low Hazard
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Physical Site Cross-Reference */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#5E725B] dark:text-[#8FA58C] bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                      <div>
                        <span className="text-[9px] block uppercase text-black/50 dark:text-white/50">Slope</span>
                        <span className="font-semibold capitalize text-[#162716] dark:text-[#EDF3EC]">
                          {item.tree.slope}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] block uppercase text-black/50 dark:text-white/50">Soil Type</span>
                        <span className="font-semibold capitalize text-[#162716] dark:text-[#EDF3EC]">
                          {item.tree.soil_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] block uppercase text-black/50 dark:text-white/50">Coordinates</span>
                        <span className="text-[10px] truncate block text-[#162716] dark:text-[#EDF3EC]">
                          {item.tree.lat.toFixed(3)}, {item.tree.lng.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Cross-Referenced Hazard Explanation */}
                    {item.reasons.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[#5E725B] dark:text-[#8FA58C]">
                          Identified Meteorological Vulnerability:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[#162716] dark:text-[#D2E0D0] text-[11px]">
                          {item.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Remedy */}
                    <div className="p-2.5 rounded-lg bg-[#2D5A34]/10 dark:bg-[#2D5A34]/20 border border-[#2D5A34]/20 text-xs space-y-1">
                      <div className="font-mono text-[10px] font-bold text-[#2D5A34] dark:text-[#7EBC8A] uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Recommended Field Action:</span>
                      </div>
                      <p className="text-[#162716] dark:text-[#EDF3EC] text-[11px] leading-relaxed">
                        {item.remedy}
                      </p>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10px] font-mono text-[#5E725B] dark:text-[#8FA58C]">
                        ID: {item.tree.id}
                      </span>
                      <Link
                        to={`/tree-tracker`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Locate on Field Map</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
