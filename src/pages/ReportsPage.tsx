import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sprout,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  User,
  Trees,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useTrees, getEffectiveStatus } from '../context/TreeContext';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocalizedSpeciesName } from '../i18n';
import { useToast } from '../context/ToastContext';
import { TreeRecord, TreeStatus } from '../types';
import { Badge, Button } from '../components/ui';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialCampaign = searchParams.get('campaign') || 'all';
  const { trees, campaigns } = useTrees();
  const { toast } = useToast();

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedPlanter, setSelectedPlanter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaign);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expanded rows state (tree IDs)
  const [expandedTreeIds, setExpandedTreeIds] = useState<Set<string>>(new Set());

  // Distinct options derived from the current trees dataset
  const uniqueSpecies = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t) => {
      if (t.species) set.add(t.species);
    });
    return Array.from(set).sort();
  }, [trees]);

  const uniquePlanters = useMemo(() => {
    const set = new Set<string>();
    trees.forEach((t) => {
      if (t.planter) set.add(t.planter);
    });
    return Array.from(set).sort();
  }, [trees]);

  // Quick preset helper
  const applyPreset = (preset: '30' | '90' | 'year' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    const toStr = now.toISOString().split('T')[0];
    setDateTo(toStr);

    if (preset === '30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().split('T')[0]);
    } else if (preset === '90') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setDateFrom(past.toISOString().split('T')[0]);
    } else if (preset === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setDateFrom(startOfYear.toISOString().split('T')[0]);
    }
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedSpecies('all');
    setSelectedPlanter('all');
    setSelectedStatus('all');
    setSelectedCampaign('all');
    setSearchQuery('');
    toast.info('Filters Reset', 'Showing complete unfiltered forestry registry.');
  };

  // Filtered dataset
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      const effectiveStatus = getEffectiveStatus(tree);

      // Date range on date_planted
      if (dateFrom && tree.date_planted < dateFrom) return false;
      if (dateTo && tree.date_planted > dateTo) return false;

      // Campaign filter
      if (selectedCampaign !== 'all' && tree.campaign_id !== selectedCampaign) {
        return false;
      }

      // Species filter
      if (selectedSpecies !== 'all' && tree.species.toLowerCase() !== selectedSpecies.toLowerCase()) {
        return false;
      }

      // Planter filter
      if (selectedPlanter !== 'all' && tree.planter.toLowerCase() !== selectedPlanter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && effectiveStatus !== selectedStatus) {
        return false;
      }

      // Keyword search (ID, species, planter, soil, note)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = tree.id.toLowerCase().includes(query);
        const speciesMatch = tree.species.toLowerCase().includes(query);
        const planterMatch = tree.planter.toLowerCase().includes(query);
        const soilMatch = tree.soil_type?.toLowerCase().includes(query);
        const notesMatch = tree.notes?.toLowerCase().includes(query);
        if (!idMatch && !speciesMatch && !planterMatch && !soilMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [trees, dateFrom, dateTo, selectedSpecies, selectedPlanter, selectedStatus, selectedCampaign, searchQuery]);

  // Summary row metrics for the filtered set
  const summaryMetrics = useMemo(() => {
    const total = filteredTrees.length;
    let healthyCount = 0;
    let needsWatchCount = 0;
    let notSurvivingCount = 0;

    const speciesCounts: Record<string, number> = {};

    filteredTrees.forEach((tree) => {
      const st = getEffectiveStatus(tree);
      if (st === 'healthy') healthyCount++;
      else if (st === 'needs-watch') needsWatchCount++;
      else if (st === 'not-surviving') notSurvivingCount++;

      speciesCounts[tree.species] = (speciesCounts[tree.species] || 0) + 1;
    });

    const survivedTotal = healthyCount + needsWatchCount;
    const survivalPct = total > 0 ? Math.round((survivedTotal / total) * 100) : 0;
    const healthyPct = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

    // Find most-planted species in filtered range
    let mostPlantedSpecies = 'None';
    let maxCount = 0;
    Object.entries(speciesCounts).forEach(([sp, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPlantedSpecies = sp;
      }
    });

    const mostPlantedPct = total > 0 ? Math.round((maxCount / total) * 100) : 0;

    return {
      total,
      survivalPct,
      healthyCount,
      healthyPct,
      needsWatchCount,
      notSurvivingCount,
      mostPlantedSpecies,
      mostPlantedCount: maxCount,
      mostPlantedPct,
    };
  }, [filteredTrees]);

  // Toggle row expansion
  const toggleRow = (treeId: string) => {
    setExpandedTreeIds((prev) => {
      const next = new Set(prev);
      if (next.has(treeId)) {
        next.delete(treeId);
      } else {
        next.add(treeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredTrees.map((t) => t.id));
    setExpandedTreeIds(allIds);
  };

  const collapseAll = () => {
    setExpandedTreeIds(new Set());
  };

  // Download filtered data as CSV
  const handleDownloadCSV = () => {
    if (filteredTrees.length === 0) {
      toast.info('No Records', 'There are no trees matching the current filters to export.');
      return;
    }

    const headers = [
      'Tree ID',
      'Species',
      'Planter',
      'Date Planted',
      'Current Status',
      'Soil Type',
      'Slope',
      'Latitude',
      'Longitude',
      'Total Checkins',
      'Latest Checkin Date',
      'Latest Checkin Status',
      'Latest Checkin Notes',
    ];

    const rows = filteredTrees.map((tree) => {
      const effectiveStatus = getEffectiveStatus(tree);
      const sortedCheckins = [...(tree.checkins || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latest = sortedCheckins[0];

      return [
        `"${tree.id}"`,
        `"${(tree.species || '').replace(/"/g, '""')}"`,
        `"${(tree.planter || '').replace(/"/g, '""')}"`,
        `"${tree.date_planted || ''}"`,
        `"${effectiveStatus}"`,
        `"${(tree.soil_type || '').replace(/"/g, '""')}"`,
        `"${tree.slope || 'flat'}"`,
        tree.lat || 0,
        tree.lng || 0,
        tree.checkins?.length || 0,
        `"${latest?.date || ''}"`,
        `"${latest?.status || ''}"`,
        `"${(latest?.note || tree.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `rootguard-forestry-report-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      'CSV Export Downloaded',
      `Exported ${filteredTrees.length} tree record(s) matching your criteria.`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const printDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8 animate-fadeIn pb-16">
      {/* Editorial Header */}
      <header className="rounded-3xl p-6 sm:p-10 border border-[#223826] shadow-sm relative overflow-hidden text-white bg-[#101C12]">
        <img
          src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=80"
          alt={t('images.reportsCanopyAlt', 'Lush temperate forest canopy audit and forestry tracking')}
          title={t('images.reportsCanopyAlt', 'Lush temperate forest canopy audit and forestry tracking')}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101C12] via-[#142616]/80 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(10,20,12,0.7)_100%)]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-[#7EBC8A] text-xs font-semibold tracking-wider uppercase font-mono">
              <FileText className="w-4 h-4 text-[#7EBC8A]" />
              <span>{t('reports.badge', 'Field Audits & Archival Records • ISO 14064 Compatible')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-['Fraunces'] font-bold text-[#F8F6F1] tracking-tight leading-[1.08]">
              {t('reports.heading', 'Reports & Registry Audit')}
            </h1>

            <p className="text-sm sm:text-base text-[#D0DDD0] leading-relaxed font-light">
              {t('reports.subheading', 'Filter, examine, and export longitudinal plantation histories. Review check-in records across all monitored zones or compile exportable survival proofs for conservation grants.')}
            </p>
          </div>

          {/* Action Controls */}
          <div className="no-print flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              id="print-report-btn"
              onClick={handlePrint}
              className="onearth-btn-secondary px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#2D5A34] dark:text-[#7EBC8A]" />
              <span>{t('reports.printReport', 'Print Report')}</span>
            </button>

            <button
              type="button"
              id="download-csv-btn"
              onClick={handleDownloadCSV}
              className="onearth-btn-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-[#7EBC8A]" />
              <span>{t('reports.downloadCsv', 'Download CSV ({{count}})', { count: filteredTrees.length })}</span>
            </button>
          </div>
        </div>
      </header>

      {/* PRINT-ONLY OFFICIAL BANNER */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black font-['Fraunces']">
              OnEarth — Forestry Survival & Plantation Audit Report
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Field Station: Sahyadri Agroforestry • ISO 14064 Longitudinal Tree Survival Ledger
            </p>
          </div>
          <div className="text-right text-xs text-neutral-700 font-mono">
            <div>Report Date: {printDateStr}</div>
            <div>Total Specimens in Scope: {filteredTrees.length}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-neutral-600 bg-neutral-100 p-2 rounded">
          <strong>Applied Filter Scope: </strong>
          Date Range: {dateFrom || 'Earliest'} to {dateTo || 'Present'} • Species:{' '}
          {selectedSpecies === 'all' ? 'All Species' : selectedSpecies} • Planter:{' '}
          {selectedPlanter === 'all' ? 'All Planters' : selectedPlanter} • Status:{' '}
          {selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
        </div>
      </div>

      {/* FILTERS PANEL */}
      <section
        id="reports-filter-section"
        className="no-print onearth-card p-5 sm:p-6 rounded-2xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD2] dark:border-[#223826] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#162716] dark:text-[#EDF3EC] font-mono">
            <Filter className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A]" />
            <span>Audit Query Filters</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-xs text-[#5E725B] dark:text-[#8FA58C] mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] hover:border-[#2D5A34] text-[#162716] dark:text-[#EDF3EC] cursor-pointer font-medium transition-colors"
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30')}
              className="px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] hover:border-[#2D5A34] text-[#162716] dark:text-[#EDF3EC] cursor-pointer font-medium transition-colors"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('90')}
              className="px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] hover:border-[#2D5A34] text-[#162716] dark:text-[#EDF3EC] cursor-pointer font-medium transition-colors"
            >
              Last 90 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('year')}
              className="px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] hover:border-[#2D5A34] text-[#162716] dark:text-[#EDF3EC] cursor-pointer font-medium transition-colors"
            >
              This Year
            </button>
          </div>
        </div>

        {/* Combinable Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Date From */}
          <div className="space-y-1">
            <label
              htmlFor="filter-date-from"
              className="block font-semibold uppercase tracking-wider text-[11px] text-[#5E725B] dark:text-[#8FA58C]"
            >
              Planted From
            </label>
            <div className="relative">
              <input
                type="date"
                id="filter-date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-xs px-3 py-2 text-[#162716] dark:text-[#EDF3EC] rounded-full focus:outline-none focus:border-[#2D5A34]"
              />
              <Calendar className="w-3.5 h-3.5 text-[#5E725B] dark:text-[#8FA58C] absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label
              htmlFor="filter-date-to"
              className="block font-semibold uppercase tracking-wider text-[11px] text-[#5E725B] dark:text-[#8FA58C]"
            >
              Planted To
            </label>
            <div className="relative">
              <input
                type="date"
                id="filter-date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-xs px-3 py-2 text-[#162716] dark:text-[#EDF3EC] rounded-full focus:outline-none focus:border-[#2D5A34]"
              />
              <Calendar className="w-3.5 h-3.5 text-[#5E725B] dark:text-[#8FA58C] absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Species Selector */}
          <div className="space-y-1">
            <label
              htmlFor="filter-species-select"
              className="block font-semibold uppercase tracking-wider text-[11px] text-[#5E725B] dark:text-[#8FA58C]"
            >
              Botanical Species
            </label>
            <select
              id="filter-species-select"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-xs px-3 py-2 text-[#162716] dark:text-[#EDF3EC] rounded-full focus:outline-none focus:border-[#2D5A34] cursor-pointer"
            >
              <option value="all">All Species ({uniqueSpecies.length})</option>
              {uniqueSpecies.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Planter Selector */}
          <div className="space-y-1">
            <label
              htmlFor="filter-planter-select"
              className="block font-semibold uppercase tracking-wider text-[11px] text-[#5E725B] dark:text-[#8FA58C]"
            >
              Planter / Steward
            </label>
            <select
              id="filter-planter-select"
              value={selectedPlanter}
              onChange={(e) => setSelectedPlanter(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-xs px-3 py-2 text-[#162716] dark:text-[#EDF3EC] rounded-full focus:outline-none focus:border-[#2D5A34] cursor-pointer"
            >
              <option value="all">All Planters ({uniquePlanters.length})</option>
              {uniquePlanters.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Row: Status Filter, Search, and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status Radio Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#5E725B] dark:text-[#8FA58C] mr-1 uppercase font-mono">
              Status:
            </span>
            {(
              [
                { id: 'all', label: 'All Statuses' },
                { id: 'healthy', label: 'Healthy' },
                { id: 'needs-watch', label: 'Needs Watch' },
                { id: 'not-surviving', label: 'Not Surviving' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                  selectedStatus === st.id
                    ? 'bg-[#2D5A34] text-white border-[#2D5A34]'
                    : 'bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C] border-[#E2DDD2] dark:border-[#223826] hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Keyword Search & Reset */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search ID, species, planter…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-xs pl-8.5 pr-3 py-2 text-[#162716] dark:text-[#EDF3EC] rounded-full focus:outline-none focus:border-[#2D5A34]"
              />
              <Search className="w-3.5 h-3.5 text-[#5E725B] dark:text-[#8FA58C] absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#D48B38] hover:underline cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* SUMMARY ROW FOR FILTERED SET */}
      <section
        id="reports-summary-cards"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Metric 1: Trees in Range */}
        <div className="onearth-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#D48B38] uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A]" />
              Trees in Range
            </span>
            <span className="font-normal text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
              {trees.length > 0
                ? `${Math.round((summaryMetrics.total / trees.length) * 100)}% of ledger`
                : '0%'}
            </span>
          </div>

          <div className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-[#162716] dark:text-[#EDF3EC]">
            {summaryMetrics.total}{' '}
            <span className="text-sm font-sans font-normal text-[#5E725B] dark:text-[#8FA58C]">
              specimens
            </span>
          </div>

          <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] font-light">
            {filteredTrees.length === trees.length
              ? 'Complete registry included in this view.'
              : `Filtered subset out of ${trees.length} total planted records.`}
          </p>
        </div>

        {/* Metric 2: Survival Rate in Range */}
        <div className="onearth-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#2D5A34] dark:text-[#7EBC8A] uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A]" />
              Survival Rate in Range
            </span>
            <span className="font-mono font-bold text-sm text-[#2D5A34] dark:text-[#7EBC8A]">
              {summaryMetrics.survivalPct}%
            </span>
          </div>

          <div className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-[#162716] dark:text-[#EDF3EC]">
            {summaryMetrics.survivalPct}%{' '}
            <span className="text-sm font-sans font-normal text-[#5E725B] dark:text-[#8FA58C]">
              surviving
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5E725B] dark:text-[#8FA58C] font-light">
            <span className="text-[#2D5A34] dark:text-[#7EBC8A] font-semibold">{summaryMetrics.healthyCount} Healthy</span>
            <span>•</span>
            <span className="text-[#D48B38]">{summaryMetrics.needsWatchCount} Watch</span>
            <span>•</span>
            <span className="text-[#A6432D]">{summaryMetrics.notSurvivingCount} Lost</span>
          </div>
        </div>

        {/* Metric 3: Most-Planted Species in Range */}
        <div className="onearth-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#D48B38] uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A]" />
              Most-Planted Species
            </span>
            <span className="font-normal text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
              {summaryMetrics.mostPlantedPct}% of scope
            </span>
          </div>

          <div className="font-['Fraunces'] text-2xl sm:text-3xl font-bold text-[#162716] dark:text-[#EDF3EC] truncate">
            {summaryMetrics.mostPlantedSpecies}
          </div>

          <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] font-light">
            {summaryMetrics.mostPlantedCount > 0
              ? `${summaryMetrics.mostPlantedCount} specimen(s) logged in this filtered period.`
              : 'No species registered in this criteria.'}
          </p>
        </div>
      </section>

      {/* DETAILED TABLE WITH EXPANDABLE CHECK-IN HISTORY */}
      <section className="onearth-card rounded-2xl overflow-hidden shadow-xs border border-[#E2DDD2] dark:border-[#223826]">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E2DDD2] dark:border-[#223826] flex flex-wrap items-center justify-between gap-3 bg-black/5 dark:bg-white/5">
          <div className="space-y-0.5">
            <h3 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC]">
              Plantation Records Ledger
            </h3>
            <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] font-light">
              Showing {filteredTrees.length} matching tree records. Click any row to view its full longitudinal inspection timeline.
            </p>
          </div>

          <div className="no-print flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-[#162716] dark:text-[#EDF3EC] hover:border-[#2D5A34] cursor-pointer transition-colors"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826] text-[#162716] dark:text-[#EDF3EC] hover:border-[#2D5A34] cursor-pointer transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {filteredTrees.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#3F6B37]/10 dark:bg-[#E5BA5A]/15 text-[#3F6B37] dark:text-[#E5BA5A] border border-[#3F6B37]/25 dark:border-[#E5BA5A]/30 flex items-center justify-center mx-auto">
              {trees.length === 0 ? <Trees className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="font-['Fraunces'] text-xl font-bold text-[#23301E] dark:text-[#EDE7D6]">
                {trees.length === 0 ? 'No Plantation Records in Ledger' : 'No Plantation Records Match This Query'}
              </div>
              <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] max-w-sm mx-auto leading-relaxed">
                {trees.length === 0
                  ? 'No trees have been logged yet. Begin registering saplings on the operational ledger to generate audit reports and export data.'
                  : 'Try widening your date boundaries or resetting species, planter, or campaign filters.'}
              </p>
            </div>
            {trees.length === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.assign('/tree-tracker')}
                leftIcon={<Trees className="w-4 h-4" />}
              >
                Go to Tree Tracker
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear All Active Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#C9C2A9] dark:border-[#263823] bg-[#F2EEE1] dark:bg-[#111A0F] font-mono text-[11px] uppercase tracking-wider text-[#4B5842] dark:text-[#A7B89E]">
                  <th className="py-3 px-4">Tree ID</th>
                  <th className="py-3 px-4">Species</th>
                  <th className="py-3 px-4">Planter</th>
                  <th className="py-3 px-4">Planted Date</th>
                  <th className="py-3 px-4">Soil & Slope</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-center">Check-ins</th>
                  <th className="py-3 px-4 text-right no-print">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9C2A9]/40 dark:divide-[#263823]">
                {filteredTrees.map((tree) => {
                  const effectiveStatus = getEffectiveStatus(tree);
                  const isExpanded = expandedTreeIds.has(tree.id);
                  const checkinCount = tree.checkins?.length || 0;

                  return (
                    <React.Fragment key={tree.id}>
                      <tr
                        onClick={() => toggleRow(tree.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-[#3F6B37]/5 dark:bg-[#3F6B37]/10'
                            : 'hover:bg-[#F2EEE1]/60 dark:hover:bg-[#1A2917]/50'
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#23301E] dark:text-[#EDE7D6]">
                          {tree.id}
                        </td>

                        {/* Species */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#23301E] dark:text-[#EDE7D6]">
                            {tree.species}
                          </div>
                          {tree.notes && (
                            <div className="text-[10px] text-[#4B5842] dark:text-[#A7B89E] line-clamp-1 italic">
                              &ldquo;{tree.notes}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* Planter */}
                        <td className="py-3 px-4 text-[#4B5842] dark:text-[#A7B89E]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#AD6B44] dark:text-[#D9A441]" />
                            <span>{tree.planter}</span>
                          </div>
                        </td>

                        {/* Planted Date */}
                        <td className="py-3 px-4 font-mono text-[#23301E] dark:text-[#EDE7D6]">
                          {tree.date_planted}
                        </td>

                        {/* Soil & Slope */}
                        <td className="py-3 px-4 text-[#4B5842] dark:text-[#A7B89E]">
                          <span className="capitalize">{tree.soil_type || 'Loam'}</span> •{' '}
                          <span className="capitalize">{tree.slope || 'flat'}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <Badge variant={effectiveStatus} dot>
                            {effectiveStatus === 'healthy'
                              ? 'Healthy'
                              : effectiveStatus === 'needs-watch'
                              ? 'Needs Watch'
                              : 'Not Surviving'}
                          </Badge>
                        </td>

                        {/* Check-in Count */}
                        <td className="py-3 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              checkinCount > 0
                                ? 'bg-[#3F6B37]/10 dark:bg-[#3F6B37]/20 border-[#3F6B37]/30 text-[#2C4B27] dark:text-[#A7B89E]'
                                : 'bg-[#F2EEE1] dark:bg-[#131E12] border-[#C9C2A9] dark:border-[#263823] text-[#4B5842]'
                            }`}
                          >
                            {checkinCount}
                          </span>
                        </td>

                        {/* Expand Action Button */}
                        <td className="py-3 px-4 text-right no-print">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(tree.id);
                            }}
                            className="p-1 rounded text-[#4B5842] dark:text-[#A7B89E] hover:text-[#23301E] dark:hover:text-[#EDE7D6] hover:bg-[#EAE5D6] dark:hover:bg-[#1A2917] cursor-pointer"
                            aria-label={isExpanded ? 'Collapse history' : 'Expand history'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE INSPECTION HISTORY ACCORDION */}
                      {isExpanded && (
                        <tr className="bg-[#F2EEE1]/70 dark:bg-[#111A0F]/80 border-b border-[#C9C2A9]/60 dark:border-[#263823]">
                          <td colSpan={8} className="p-4 sm:p-6">
                            <div className="space-y-4 max-w-4xl mx-auto">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9C2A9]/40 dark:border-[#263823] pb-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-[#3F6B37] dark:text-[#D9A441]" />
                                  <h4 className="font-['Fraunces'] font-bold text-sm text-[#23301E] dark:text-[#EDE7D6]">
                                    Chronological Check-in History for {tree.species} ({tree.id})
                                  </h4>
                                </div>
                                <div className="text-[11px] font-mono text-[#4B5842] dark:text-[#A7B89E]">
                                  Coordinates: {tree.lat.toFixed(4)}°N, {tree.lng.toFixed(4)}°E
                                </div>
                              </div>

                              {/* Baseline establishment info */}
                              <div className="p-3 bg-[#FBF8EF] dark:bg-[#172415] rounded border border-[#C9C2A9] dark:border-[#263823] flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="font-semibold text-[#23301E] dark:text-[#EDE7D6]">
                                    Baseline Planting:
                                  </span>{' '}
                                  Planted by {tree.planter} on <strong>{tree.date_planted}</strong> in{' '}
                                  <span className="capitalize">{tree.soil_type}</span> soil ({tree.slope}{' '}
                                  slope).
                                </div>
                                <span className="font-mono text-[10px] text-[#8A5233] dark:text-[#D9A441]">
                                  ORIGINAL STATUS: {tree.status.toUpperCase()}
                                </span>
                              </div>

                              {/* Subsequent Check-ins Timeline */}
                              {tree.checkins && tree.checkins.length > 0 ? (
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#4B5842] dark:text-[#A7B89E] block">
                                    Subsequent Field Inspections ({tree.checkins.length})
                                  </span>

                                  <div className="space-y-2">
                                    {tree.checkins.map((chk, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="p-3 bg-[#FBF8EF] dark:bg-[#172415] border border-[#C9C2A9] dark:border-[#263823] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-[#23301E] dark:text-[#EDE7D6]">
                                              {chk.date}
                                            </span>
                                            <Badge variant={chk.status} dot>
                                              {chk.status === 'healthy'
                                                ? 'Healthy'
                                                : chk.status === 'needs-watch'
                                                ? 'Needs Watch'
                                                : 'Not Surviving'}
                                            </Badge>
                                          </div>
                                          <p className="text-[#4B5842] dark:text-[#A7B89E] italic text-[11px]">
                                            &ldquo;{chk.note || 'Regular growth check performed.'}&rdquo;
                                          </p>
                                        </div>

                                        <div className="text-[10px] font-mono text-[#8A5233] dark:text-[#D9A441] shrink-0">
                                          Inspection #{cIdx + 1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-[#FBF8EF] dark:bg-[#172415] rounded border border-[#C9C2A9] dark:border-[#263823] text-xs text-[#4B5842] dark:text-[#A7B89E] flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-[#8A5233] dark:text-[#D9A441] shrink-0" />
                                  <span>
                                    Initial baseline record established on {tree.date_planted}. No subsequent field check-ins logged for this specimen yet.
                                  </span>
                                </div>
                              )}

                              {/* Photo Evidence if any */}
                              {tree.photos && tree.photos.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#4B5842] dark:text-[#A7B89E] block">
                                    {t('reports.photoEvidenceTitle', 'Specimen Photo Evidence ({{count}})', { count: tree.photos.length })}
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {tree.photos.map((p, pIdx) => (
                                      <div
                                        key={pIdx}
                                        className="w-20 h-20 rounded border border-[#C9C2A9] dark:border-[#263823] overflow-hidden bg-black/5 relative group"
                                      >
                                        <img
                                          src={p.url}
                                          alt={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', { date: p.date })}
                                          title={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', { date: p.date })}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center font-mono py-0.5">
                                          {p.date}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-[#C9C2A9]/50 dark:border-[#263823] bg-[#F2EEE1]/30 dark:bg-[#111A0F]/50 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4B5842] dark:text-[#A7B89E]">
          <span>
            Displaying <strong>{filteredTrees.length}</strong> of <strong>{trees.length}</strong> total registered specimens.
          </span>
          <span className="font-mono text-[11px]">
            Data Export Standard: CSV (RFC 4180) • PDF Print Enabled
          </span>
        </div>
      </section>
    </div>
  );
};
