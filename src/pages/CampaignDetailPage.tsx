import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocalizedSpeciesName } from '../i18n';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useTrees, getEffectiveStatus } from '../context/TreeContext';
import { SPECIES_DATA } from '../data/speciesData';
import { Card, CardContent, CardHeader, Button } from '../components/ui';
import {
  Target,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Trees,
  TrendingUp,
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Layers,
  HeartPulse,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { CampaignBulkQrTagsModal } from '../components/CampaignBulkQrTagsModal';

function MapResizer() {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export const CampaignDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { getCampaignById, getCampaignStats, trees } = useTrees();
  const navigate = useNavigate();

  const campaign = id ? getCampaignById(id) : undefined;
  const stats = id ? getCampaignStats(id) : null;
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = React.useState(false);

  // Filter trees belonging to this campaign
  const campaignTrees = useMemo(() => {
    if (!id) return [];
    return trees.filter((t) => t.campaign_id === id);
  }, [trees, id]);

  // Center coordinate calculation
  const mapCenter: [number, number] = useMemo(() => {
    if (campaignTrees.length > 0) {
      const avgLat = campaignTrees.reduce((acc, t) => acc + t.lat, 0) / campaignTrees.length;
      const avgLng = campaignTrees.reduce((acc, t) => acc + t.lng, 0) / campaignTrees.length;
      return [avgLat, avgLng];
    }
    return [19.165, 73.215]; // Default Ambernath / Sahyadri center
  }, [campaignTrees]);

  if (!campaign || !stats) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Target className="w-12 h-12 text-[#4B5842] dark:text-[#A7BF9E] mx-auto opacity-40" />
        <h2 className="font-['Fraunces'] text-2xl font-bold text-[#23301E] dark:text-[#EDE8DD]">
          Campaign Not Found
        </h2>
        <p className="text-sm text-[#4B5842] dark:text-[#A7BF9E]">
          The requested reforestation campaign ID does not exist or has been archived.
        </p>
        <Button variant="outline" onClick={() => navigate('/campaigns')}>
          Return to Campaigns Directory
        </Button>
      </div>
    );
  }

  const focusSpeciesList = SPECIES_DATA.filter((s) =>
    campaign.focus_species_ids?.includes(s.id)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8 pb-12 animate-fadeIn">
      {/* Back navigation */}
      <div>
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#2D5A34] dark:text-[#7EBC8A] hover:underline px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-[#E2DDD2] dark:border-[#223826]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('campaignDetail.backLink', 'Back to All Campaigns')}</span>
        </Link>
      </div>

      {/* Campaign Hero Banner with Community Planting Photo Background */}
      <div className="rounded-3xl p-6 sm:p-10 border border-[#223826] shadow-sm relative overflow-hidden space-y-6 text-white bg-[#101C12]">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Sixty-five_volunteers_planted_trees_at_Crystal_Lake_April_6th%2C_near_Asuza%2C_CA_%2820190406-FS-ANF-008%29.jpg"
          alt={t('images.campaignDetailHeroAlt', 'Community tree planting volunteers restoring forest canopy')}
          title={t('images.campaignDetailHeroAlt', 'Community tree planting volunteers restoring forest canopy')}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101C12] via-[#142616]/80 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(10,20,12,0.7)_100%)]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[#2D5A34]/70 text-[#7EBC8A] border border-[#7EBC8A]/30">
                Campaign ID: {campaign.campaign_id}
              </span>
              <span className="text-xs font-mono text-[#D0DDD0]">
                {campaign.end_date ? `Active until ${campaign.end_date}` : 'Ongoing Long-Term Cohort'}
              </span>
            </div>

            <h1 className="font-['Fraunces'] text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F6F1] leading-[1.08]">
              {campaign.name}
            </h1>

            <p className="text-sm sm:text-base text-[#D0DDD0] font-light leading-relaxed">
              {campaign.description}
            </p>

            {/* Sub-meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#D0DDD0] pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7EBC8A]" />
                <span>Organizer: <strong className="text-white">{campaign.organizer}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7EBC8A]" />
                <span>Area: <strong className="text-white">{campaign.area_name}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7EBC8A]" />
                <span>Started: {campaign.start_date}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/tree-tracker?campaign_id=${campaign.campaign_id}`)}
              className="onearth-btn-primary px-5 py-3 text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer"
              id="plant-in-campaign-btn"
            >
              <Trees className="w-4 h-4 text-[#7EBC8A]" />
              <span>Plant in this Campaign</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/reports?campaign=${campaign.campaign_id}`)}
              className="onearth-btn-secondary px-5 py-3 text-sm font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer"
              id="campaign-report-btn"
            >
              <FileText className="w-4 h-4" />
              <span>View Campaign Report</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkTagModalOpen(true)}
              disabled={campaignTrees.length === 0}
              className="px-5 py-3 text-sm font-semibold rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-40"
              id="campaign-print-all-tags-btn"
            >
              <QrCode className="w-4 h-4 text-[#7EBC8A]" />
              <span>Print All Tags ({campaignTrees.length})</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="text-[11px] uppercase font-mono tracking-wider text-[#A3C09F]">
              Trees Planted
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#F8F6F1] mt-1">
              {stats.treeCount} <span className="text-xs text-[#A3C09F] font-sans font-normal">/ {campaign.goal_tree_count} goal</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#5EA46C] h-full rounded-full"
                style={{ width: `${Math.min(100, stats.progressPct)}%` }}
              />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="text-[11px] uppercase font-mono tracking-wider text-[#A3C09F]">
              Survival Rate
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#7EBC8A] mt-1">
              {stats.survivalPct}%
            </div>
            <div className="text-xs text-[#A3C09F] mt-1 font-light">
              {stats.healthyCount} healthy, {stats.needsWatchCount} watch
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="text-[11px] uppercase font-mono tracking-wider text-[#A3C09F]">
              Campaign Progress
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#F8F6F1] mt-1">
              {stats.progressPct}%
            </div>
            <div className="text-xs text-[#A3C09F] mt-1 font-light">
              {Math.max(0, campaign.goal_tree_count - stats.treeCount)} saplings remaining
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="text-[11px] uppercase font-mono tracking-wider text-[#A3C09F]">
              Planted Species
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#F8F6F1] mt-1">
              {new Set(campaignTrees.map((t) => t.species)).size}
            </div>
            <div className="text-xs text-[#A3C09F] mt-1 font-light">
              {focusSpeciesList.length} priority targets
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column: Mini Map & Trees Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Mini Map of Campaign Trees */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD2] dark:border-[#223826]">
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A]" />
              <span>Campaign GIS Coordinate Plot</span>
            </h2>
            <span className="text-xs font-mono text-[#5E725B] dark:text-[#8FA58C]">
              {campaignTrees.length} specimens mapped
            </span>
          </div>

          <div
            id="campaign-mini-map"
            className="w-full h-[400px] bg-[#EAE5DB] dark:bg-[#101C12] border border-[#E2DDD2] dark:border-[#223826] rounded-2xl overflow-hidden shadow-xs relative"
          >
            {campaignTrees.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-black/5 dark:bg-white/5">
                <Trees className="w-10 h-10 text-[#5E725B] dark:text-[#8FA58C] opacity-50" />
                <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#8FA58C] max-w-sm font-light">
                  No trees logged in this campaign yet. Click &quot;Plant in this Campaign&quot; to pin the first specimen!
                </p>
                <button
                  type="button"
                  className="onearth-btn-primary px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
                  onClick={() => navigate(`/tree-tracker?campaign_id=${campaign.campaign_id}`)}
                >
                  Log First Specimen
                </button>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <MapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {campaignTrees.map((t) => {
                  const currentStatus = getEffectiveStatus(t);
                  let fillColor = '#2D5A34';
                  let borderColor = '#162716';
                  if (currentStatus === 'needs-watch') {
                    fillColor = '#D48B38';
                    borderColor = '#8A5233';
                  } else if (currentStatus === 'not-surviving') {
                    fillColor = '#A6432D';
                    borderColor = '#8A3421';
                  }

                  return (
                    <CircleMarker
                      key={`camp-tree-${t.id}`}
                      center={[t.lat, t.lng]}
                      radius={9}
                      pathOptions={{
                        color: borderColor,
                        fillColor: fillColor,
                        fillOpacity: 0.95,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 p-1 min-w-[180px]">
                          <strong className="font-['Fraunces'] text-sm text-[#162716]">
                            {t.species}
                          </strong>
                          <div className="text-[10px] text-[#5E725B]">
                            Planted by: <strong>{t.planter}</strong> on {t.date_planted}
                          </div>
                          <div className="text-[10px] text-[#5E725B]">
                            Status: <strong className="capitalize">{currentStatus}</strong>
                          </div>
                          <div className="text-[10px] font-mono text-[#D48B38]">
                            {t.slope} slope • {t.soil_type} soil
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#5E725B] dark:text-[#8FA58C] onearth-card p-3 rounded-xl font-mono text-[11px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A34]" /> Healthy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D48B38]" /> Needs Watch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A6432D]" /> Not Surviving
              </span>
            </div>
            <span>Scope: {campaign.area_name}</span>
          </div>
        </div>

        {/* Right: Trees Table in Campaign */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD2] dark:border-[#223826]">
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC] flex items-center gap-2">
              <Trees className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A]" />
              <span>Planted Trees in this Campaign</span>
            </h2>
            <Link
              to={`/reports?campaign=${campaign.campaign_id}`}
              className="text-xs font-mono text-[#2D5A34] dark:text-[#7EBC8A] hover:underline flex items-center gap-1"
            >
              <span>Full Audit Report</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="onearth-card rounded-2xl overflow-hidden shadow-xs border border-[#E2DDD2] dark:border-[#223826]">
            <div className="max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-black/5 dark:bg-white/5 text-[#162716] dark:text-[#EDF3EC] border-b border-[#E2DDD2] dark:border-[#223826] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Species</th>
                    <th className="py-3 px-4">Planter</th>
                    <th className="py-3 px-4">Planted</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD2] dark:divide-[#223826]">
                  {campaignTrees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#5E725B] dark:text-[#8FA58C] font-light">
                        No trees registered under this campaign yet.
                      </td>
                    </tr>
                  ) : (
                    campaignTrees.map((t) => {
                      const st = getEffectiveStatus(t);
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-[#162716] dark:text-[#EDF3EC]">
                            <div className="font-semibold text-sm">{t.species}</div>
                            <div className="text-[10px] text-[#5E725B] dark:text-[#8FA58C] font-mono">
                              ID: {t.id}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#162716] dark:text-[#EDF3EC]">
                            {t.planter}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#5E725B] dark:text-[#8FA58C]">
                            {t.date_planted}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-mono rounded-full font-semibold uppercase ${
                                st === 'healthy'
                                  ? 'bg-[#2D5A34]/15 text-[#2D5A34] dark:text-[#7EBC8A]'
                                  : st === 'needs-watch'
                                  ? 'bg-[#D48B38]/15 text-[#D48B38]'
                                  : 'bg-[#A6432D]/15 text-[#A6432D]'
                              }`}
                            >
                              {st}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Species Cards */}
      {focusSpeciesList.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[#E2DDD2] dark:border-[#223826]">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#2D5A34] dark:text-[#7EBC8A]" />
            <h3 className="font-['Fraunces'] text-2xl font-bold text-[#162716] dark:text-[#EDF3EC]">
              Campaign Priority Species
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {focusSpeciesList.map((sp) => (
              <div
                key={sp.id}
                className="onearth-card rounded-2xl p-5 space-y-2 text-xs hover:border-[#2D5A34] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <span className="font-['Fraunces'] font-bold text-base text-[#162716] dark:text-[#EDF3EC]">
                    {sp.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[#D48B38]">
                    {sp.growth_rate}
                  </span>
                </div>
                <div className="text-xs italic text-[#5E725B] dark:text-[#8FA58C]">
                  {sp.scientific_name}
                </div>
                <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] line-clamp-2 font-light">
                  {sp.care_instructions}
                </p>
                <div className="text-[11px] font-mono text-[#2D5A34] dark:text-[#7EBC8A] pt-2 border-t border-[#E2DDD2] dark:border-[#223826]">
                  Water: {sp.water_need} • Soil: {sp.soil_types.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Campaign QR Tags Print Modal */}
      {isBulkTagModalOpen && (
        <CampaignBulkQrTagsModal
          campaign={campaign}
          trees={campaignTrees}
          onClose={() => setIsBulkTagModalOpen(false)}
        />
      )}
    </div>
  );
};
