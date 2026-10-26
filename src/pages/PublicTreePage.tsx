import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTrees, getEffectiveStatus } from '../context/TreeContext';
import { SPECIES_DATA } from '../data/speciesData';
import { computeTreeErosionRisk, EROSION_RISK_COLORS } from '../utils/erosionRisk';
import { TreeStatus, TreePhoto } from '../types';
import { TreeQrTagModal } from '../components/TreeQrTagModal';
import {
  Sprout,
  Calendar,
  User,
  MapPin,
  Trees,
  Layers,
  Compass,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  HeartPulse,
  Clock,
  ExternalLink,
  QrCode,
  Image as ImageIcon,
  X,
  Share2,
  Check,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { getLocalizedSpeciesName } from '../i18n';

export const PublicTreePage: React.FC = () => {
  const { t } = useTranslation();
  const { tree_id } = useParams<{ tree_id: string }>();
  const { trees, isLoading, getCampaignById } = useTrees();
  const toast = useToast();

  const [lightboxPhoto, setLightboxPhoto] = useState<TreePhoto | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Locate the tree by exact ID or case-insensitive match
  const tree = useMemo(() => {
    if (!tree_id) return undefined;
    return trees.find(
      (t) =>
        t.id === tree_id ||
        t.id.toLowerCase() === tree_id.toLowerCase()
    );
  }, [trees, tree_id]);

  const speciesMeta = useMemo(() => {
    if (!tree) return null;
    return (
      SPECIES_DATA.find(
        (s) =>
          s.name.toLowerCase() === tree.species.toLowerCase() ||
          (tree.species_id && s.id === tree.species_id)
      ) || null
    );
  }, [tree]);

  const campaign = useMemo(() => {
    if (!tree?.campaign_id) return null;
    return getCampaignById(tree.campaign_id) || null;
  }, [tree, getCampaignById]);

  // Compute terrain erosion risk
  const erosionRisk = useMemo(() => {
    if (!tree) return null;
    return computeTreeErosionRisk(tree, trees);
  }, [tree, trees]);

  const currentStatus: TreeStatus = tree ? getEffectiveStatus(tree) : 'healthy';

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${tree?.species} (${tree?.id}) — RootGuard Specimen`,
          text: `Check out this ${tree?.species} tree planted on ${tree?.date_planted} via RootGuard Forest Registry.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link Copied', 'Public verification link copied to clipboard.');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled or clipboard fallback
    }
  };

  // Status helper badge
  const renderStatusBadge = (st: TreeStatus) => {
    switch (st) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#3F6B37]/15 text-[#2C4B27] dark:bg-[#3F6B37]/25 dark:text-[#A7BF9E] border border-[#3F6B37]/30">
            <span className="w-2 h-2 rounded-full bg-[#3F6B37] animate-pulse" />
            Healthy & Thriving
          </span>
        );
      case 'needs-watch':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C79A3F]/20 text-[#8A5233] dark:bg-[#C79A3F]/30 dark:text-[#E2B766] border border-[#C79A3F]/40">
            <span className="w-2 h-2 rounded-full bg-[#C79A3F]" />
            Under Watch
          </span>
        );
      case 'not-surviving':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#A6432D]/15 text-[#A6432D] dark:bg-[#A6432D]/25 dark:text-[#E5BA5A] border border-[#A6432D]/40">
            <span className="w-2 h-2 rounded-full bg-[#A6432D]" />
            Not Surviving
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2EEE1] dark:bg-[#121B11] text-[#23301E] dark:text-[#EDE8DD] px-4 font-['Work_Sans',sans-serif]">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#3F6B37]/15 dark:bg-[#3F6B37]/30 flex items-center justify-center mx-auto text-[#3F6B37] dark:text-[#D9A441]">
            <Sprout className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-['Fraunces'] text-xl font-bold">Verifying Field Specimen…</h2>
          <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] font-mono">
            Retrieving public ecological ledger entry for {tree_id}
          </p>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2EEE1] dark:bg-[#121B11] text-[#23301E] dark:text-[#EDE8DD] p-4 font-['Work_Sans',sans-serif]">
        <div className="bg-[#FBF8EF] dark:bg-[#162214] border border-[#C9C2A9] dark:border-[#2D452B] p-8 sm:p-12 rounded-lg max-w-md w-full text-center space-y-4 shadow-md">
          <div className="w-14 h-14 rounded-full bg-[#A6432D]/10 text-[#A6432D] flex items-center justify-center mx-auto border border-[#A6432D]/20">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-['Fraunces'] text-2xl font-bold">Specimen Record Not Found</h2>
          <p className="text-xs sm:text-sm text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
            No active tree could be found with the identifier <code className="font-mono font-bold bg-[#EFEAD8] dark:bg-[#202C1E] px-1.5 py-0.5 rounded">{tree_id}</code>. The tag may belong to another registry or have been re-indexed.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C4B27] hover:bg-[#1E331B] text-[#FBF8EF] text-xs font-semibold rounded transition-colors"
            >
              <Sprout className="w-4 h-4" />
              <span>Explore RootGuard Platform</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortedCheckins = [...(tree.checkins || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-[#F2EEE1] dark:bg-[#121B11] text-[#23301E] dark:text-[#EDE8DD] font-['Work_Sans',sans-serif] pb-16 selection:bg-[#3F6B37]/25">
      {/* Public Top Navigation Bar */}
      <header className="bg-[#2C4B27] text-[#FBF8EF] border-b border-[#3F6B37] px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#E5BA5A] text-[#1E2E1A] flex items-center justify-center shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <span className="font-['Fraunces'] font-black text-base text-white tracking-wide block leading-tight">
                RootGuard
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#D7DFD3] uppercase block">
                Public Forest Registry
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#3F6B37] hover:bg-[#4C7E42] text-white rounded transition-colors cursor-pointer border border-[#4C7E42]"
              title="Print physical tag"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E5BA5A]" />
              <span className="hidden sm:inline">Print Tag</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1F331B] hover:bg-[#162613] text-[#EDE8DD] rounded transition-colors cursor-pointer border border-[#3F6B37]/40"
              title="Share verification record"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#E5BA5A]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Specimen Dossier Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Verification Certificate Banner */}
        <div className="bg-[#FBF8EF] dark:bg-[#162214] border border-[#C9C2A9] dark:border-[#2D452B] rounded-lg shadow-sm overflow-hidden">
          {/* Card Top Strip */}
          <div className="bg-[#23301E] dark:bg-[#1C2C1A] text-[#EDE8DD] px-5 py-3 border-b border-[#3F6B37]/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E5BA5A]" />
              <span className="text-[#E5BA5A] font-bold">Verified Field Ledger Record</span>
              <span className="text-[#8C9E85]">•</span>
              <span className="text-[#D7DFD3]">Read-Only Public Inspection</span>
            </div>
            <span className="text-[11px] text-[#A7BF9E]">
              Specimen ID: <strong className="text-white">{tree.id}</strong>
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header: Species, Planter, Status */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#C9C2A9]/60 dark:border-[#2D452B] pb-6">
              <div className="space-y-1.5">
                <div className="text-xs uppercase font-mono tracking-wider text-[#4B5842] dark:text-[#A7BF9E] flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-[#3F6B37] dark:text-[#E5BA5A]" />
                  <span>{t('treeTracker.card.plantedSpecimen', 'Planted Specimen')}</span>
                </div>
                <h1 className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-[#23301E] dark:text-[#EDE8DD] leading-tight">
                  {getLocalizedSpeciesName(tree.species, t)}
                </h1>
                {speciesMeta?.scientific_name && (
                  <p className="font-serif italic text-base sm:text-lg text-[#55694E] dark:text-[#A7BF9E]">
                    {speciesMeta.scientific_name}
                  </p>
                )}

                {campaign && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#3F6B37] dark:text-[#E5BA5A] bg-[#3F6B37]/10 dark:bg-[#E5BA5A]/10 px-2.5 py-1 rounded">
                      <Sprout className="w-3 h-3" />
                      <span>Cohort: {campaign.name} ({campaign.area_name})</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                {renderStatusBadge(currentStatus)}
                <span className="text-[11px] font-mono text-[#6A7862] dark:text-[#8D9F88]">
                  Logged on: {tree.date_planted}
                </span>
              </div>
            </div>

            {/* Specimen Key Field Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Planter */}
              <div className="bg-[#F2EEE1]/80 dark:bg-[#1A2618] p-3.5 rounded border border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6953] dark:text-[#96A890] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#3F6B37] dark:text-[#E5BA5A]" />
                  Planter
                </span>
                <p className="text-sm font-semibold text-[#23301E] dark:text-[#EDE8DD] truncate">
                  {tree.planter}
                </p>
                <p className="text-[10px] text-[#6A7862] dark:text-[#8D9F88]">Field Steward</p>
              </div>

              {/* Terrain Slope */}
              <div className="bg-[#F2EEE1]/80 dark:bg-[#1A2618] p-3.5 rounded border border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6953] dark:text-[#96A890] flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#AD6B44] dark:text-[#E5BA5A]" />
                  Slope Gradient
                </span>
                <p className="text-sm font-semibold text-[#23301E] dark:text-[#EDE8DD] capitalize">
                  {tree.slope} slope
                </p>
                <p className="text-[10px] text-[#6A7862] dark:text-[#8D9F88]">Topographic Relief</p>
              </div>

              {/* Soil Classification */}
              <div className="bg-[#F2EEE1]/80 dark:bg-[#1A2618] p-3.5 rounded border border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6953] dark:text-[#96A890] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#8A5233] dark:text-[#E5BA5A]" />
                  Soil Texture
                </span>
                <p className="text-sm font-semibold text-[#23301E] dark:text-[#EDE8DD] capitalize">
                  {tree.soil_type}
                </p>
                <p className="text-[10px] text-[#6A7862] dark:text-[#8D9F88]">Substrate Layer</p>
              </div>

              {/* GPS Coordinates */}
              <div className="bg-[#F2EEE1]/80 dark:bg-[#1A2618] p-3.5 rounded border border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6953] dark:text-[#96A890] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#3F6B37] dark:text-[#E5BA5A]" />
                  Coordinates
                </span>
                <p className="text-xs font-mono font-semibold text-[#23301E] dark:text-[#EDE8DD] truncate">
                  {tree.lat.toFixed(4)}°, {tree.lng.toFixed(4)}°
                </p>
                <p className="text-[10px] text-[#6A7862] dark:text-[#8D9F88]">Georeferenced Pin</p>
              </div>
            </div>

            {/* Erosion Risk Assessment Card */}
            {erosionRisk && (
              <div className="bg-[#F7F4EC] dark:bg-[#1A2618]/90 border border-[#C9C2A9] dark:border-[#2D452B] p-5 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9C2A9]/60 dark:border-[#2D452B] pb-2.5">
                  <div className="flex items-center gap-2">
                    {erosionRisk.level === 'high' ? (
                      <ShieldAlert className="w-4 h-4 text-[#A6432D]" />
                    ) : erosionRisk.level === 'medium' ? (
                      <AlertTriangle className="w-4 h-4 text-[#8A5233] dark:text-[#E2B766]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#2C4B27] dark:text-[#52A046]" />
                    )}
                    <h3 className="font-['Fraunces'] font-bold text-base text-[#23301E] dark:text-[#EDE8DD]">
                      Terrain Erosion Vulnerability Assessment
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded border ${
                        EROSION_RISK_COLORS[erosionRisk.level].bg
                      } ${EROSION_RISK_COLORS[erosionRisk.level].badgeBorder}`}
                      style={{ color: EROSION_RISK_COLORS[erosionRisk.level].text }}
                    >
                      {erosionRisk.level} Risk • {erosionRisk.score}/9 pts
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] leading-relaxed">
                  {erosionRisk.summary} Calculated from terrain slope ({erosionRisk.factors.slope.points}/3 pts), soil cohesion ({erosionRisk.factors.soil.points}/3 pts), and neighboring canopy buffer ({erosionRisk.factors.density.points}/3 pts).
                </p>

                {erosionRisk.recommendedTips.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-mono font-semibold text-[#5A6851] dark:text-[#96AF8E] block mb-1">
                      Targeted Conservation Actions:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {erosionRisk.recommendedTips.map((tip) => (
                        <div
                          key={tip.id}
                          className="bg-white/70 dark:bg-[#121B11] p-2.5 rounded border border-[#C9C2A9]/50 dark:border-[#2D452B] text-xs space-y-1"
                        >
                          <div className="font-semibold text-[#2C4B27] dark:text-[#E5BA5A]">
                            Tip {tip.index}: {tip.title}
                          </div>
                          <p className="text-[11px] text-[#4B5842] dark:text-[#A7BF9E] line-clamp-2">
                            {tip.paragraph}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specimen Notes if any */}
            {tree.notes && (
              <div className="bg-white/60 dark:bg-[#1A2618] p-4 rounded border border-[#C9C2A9]/60 dark:border-[#2D452B] space-y-1 text-xs">
                <span className="font-mono uppercase font-semibold text-[#4B5842] dark:text-[#A7BF9E]">
                  Planter Planting Notes:
                </span>
                <p className="text-[#23301E] dark:text-[#EDE8DD] italic leading-relaxed">
                  "{tree.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Growth Photos Timeline */}
        <section className="bg-[#FBF8EF] dark:bg-[#162214] border border-[#C9C2A9] dark:border-[#2D452B] rounded-lg p-6 sm:p-7 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#C9C2A9]/60 dark:border-[#2D452B] pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#3F6B37] dark:text-[#E5BA5A]" />
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
                Photographic Growth Timeline
              </h2>
            </div>
            <span className="text-xs font-mono text-[#4B5842] dark:text-[#A7BF9E]">
              {tree.photos?.length || 0} photo{tree.photos?.length === 1 ? '' : 's'} archived
            </span>
          </div>

          {(!tree.photos || tree.photos.length === 0) ? (
            <div className="py-8 text-center text-xs text-[#4B5842] dark:text-[#A7BF9E] bg-[#F2EEE1]/50 dark:bg-[#121B11] rounded p-6">
              No photographic growth documentation has been uploaded yet for this specimen.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {tree.photos.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxPhoto(p)}
                  className="group relative cursor-pointer overflow-hidden rounded border border-[#C9C2A9] dark:border-[#2D452B] bg-black/10 aspect-4/3 transition-all hover:shadow-md hover:border-[#3F6B37]"
                >
                  <img
                    src={p.url}
                    alt={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                      date: p.date,
                    })}
                    title={t('images.photoDateAlt', 'Specimen check-in photograph taken on {{date}}', {
                      date: p.date,
                    })}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[11px] font-mono text-white flex items-center justify-between">
                    <span>{p.date}</span>
                    <span className="text-[10px] opacity-75 group-hover:opacity-100">{t('publicTree.clickToZoom', 'Click to zoom')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Full Check-in Inspection History */}
        <section className="bg-[#FBF8EF] dark:bg-[#162214] border border-[#C9C2A9] dark:border-[#2D452B] rounded-lg p-6 sm:p-7 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#C9C2A9]/60 dark:border-[#2D452B] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#3F6B37] dark:text-[#E5BA5A]" />
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
                Field Inspection & Check-in History
              </h2>
            </div>
            <span className="text-xs font-mono text-[#4B5842] dark:text-[#A7BF9E]">
              {sortedCheckins.length} inspection event{sortedCheckins.length === 1 ? '' : 's'}
            </span>
          </div>

          {sortedCheckins.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#4B5842] dark:text-[#A7BF9E] bg-[#F2EEE1]/50 dark:bg-[#121B11] rounded p-6">
              No follow-up check-in inspections logged yet. Initial planting record created on {tree.date_planted}.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCheckins.map((chk, idx) => (
                <div
                  key={idx}
                  className="bg-[#F7F4EC] dark:bg-[#1A2618] border border-[#C9C2A9]/70 dark:border-[#2D452B] rounded p-4 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9C2A9]/40 dark:border-[#2D452B] pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#3F6B37] dark:text-[#E5BA5A]" />
                      <span className="font-mono text-xs font-bold text-[#23301E] dark:text-[#EDE8DD]">
                        {chk.date}
                      </span>
                    </div>

                    <div>
                      {renderStatusBadge(chk.status)}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#23301E] dark:text-[#EDE8DD] leading-relaxed pt-1">
                    "{chk.note}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Read-Only Public Notice & Call-to-Action */}
        <div className="bg-[#2C4B27]/10 dark:bg-[#1A2618] border border-[#2C4B27]/30 dark:border-[#2D452B] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-['Fraunces'] font-bold text-base text-[#23301E] dark:text-[#EDE8DD]">
              Community Forestry Verification Ledger
            </h4>
            <p className="text-xs text-[#4B5842] dark:text-[#A7BF9E] max-w-xl">
              RootGuard verifies longitudinal survival outcomes for grassroots reforestation programs.
              This public record is scannable by community stewards, landholders, and auditors in the field.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="px-4 py-2 text-xs font-semibold bg-[#2C4B27] hover:bg-[#1E331B] text-[#FBF8EF] rounded shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Explore RootGuard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Lightbox for zooming photos */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-1 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={t('images.expandedPhotoAlt', 'Expanded full-resolution specimen photograph taken on {{date}}', {
                date: lightboxPhoto.date,
              })}
              title={t('images.expandedPhotoAlt', 'Expanded full-resolution specimen photograph taken on {{date}}', {
                date: lightboxPhoto.date,
              })}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
            <p className="text-white text-xs font-mono mt-2">
              {t('publicTree.photoRecordedDate', 'Growth Photo Recorded: {{date}}', { date: lightboxPhoto.date })}
            </p>
          </div>
        </div>
      )}

      {/* QR Tag Modal */}
      {isQrModalOpen && (
        <TreeQrTagModal
          tree={tree}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}
    </div>
  );
};
