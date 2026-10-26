import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTrees } from '../context/TreeContext';
import { useToast } from '../context/ToastContext';
import { Campaign } from '../types';
import { SPECIES_DATA } from '../data/speciesData';
import { CampaignForm } from '../components/campaigns/CampaignForm';
import { Card, CardContent, CardHeader, Button } from '../components/ui';
import {
  Target,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Trees,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Leaf,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const { t } = useTranslation();
  const { campaigns, trees, addCampaign, getCampaignStats } = useTrees();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Derive active vs completed
  const isCampaignActive = (c: Campaign) => {
    if (!c.end_date) return true;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(c.end_date).getTime() >= now.getTime();
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.area_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status
      const active = isCampaignActive(c);
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'completed' && active) return false;

      return true;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const handleCreateSuccess = (created: Campaign) => {
    setIsFormOpen(false);
    toast.success('Campaign Initiated', `"${created.name}" is now live in the registry.`);
  };

  return (
    <div className="w-full pb-12 animate-fadeIn">
      {/* Editorial Header Banner with Community Tree Planting Photo (Full Bleed Edge-to-Edge) */}
      <header className="relative w-full overflow-hidden shadow-[0_12px_36px_-10px_rgba(20,38,20,0.25)] border-b border-[#E2DDD2] dark:border-[#223826] mb-8">
        <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-[#101C12]">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Sixty-five_volunteers_planted_trees_at_Crystal_Lake_April_6th%2C_near_Asuza%2C_CA_%2820190406-FS-ANF-008%29.jpg"
            alt={t('images.communityVolunteersAlt', 'Community volunteers and land stewards planting trees together at a forest restoration event')}
            title={t('images.communityVolunteersAlt', 'Community volunteers and land stewards planting trees together at a forest restoration event')}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
          />
          {/* Dark gradient overlay fading toward page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101C12] via-[#142616]/75 to-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(10,20,12,0.7)_100%)]" />

          {/* Banner Content */}
          <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end text-white max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md text-[#F8F6F1] border border-[#7EBC8A]/40">
                  <Layers className="w-3.5 h-3.5 text-[#5EA46C]" />
                  <span>{t('campaigns.cohortsBadge', 'OnEarth Conservation Cohorts')}</span>
                </div>
                <h1 className="font-['Fraunces'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F8F6F1] drop-shadow-sm">
                  {t('campaigns.heading', 'Reforestation Campaigns')}
                </h1>
                <p className="text-sm sm:text-base text-[#D0DDD0] font-light leading-relaxed max-w-xl">
                  {t('campaigns.subheading', 'Coordinated watershed restorations, slope protection networks, and communal agroforestry cohorts grouping individual saplings toward measurable canopy coverage.')}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  className="onearth-btn-primary cursor-pointer shadow-md"
                  onClick={() => setIsFormOpen(true)}
                  id="open-create-campaign-btn"
                >
                  <Plus className="w-4 h-4 text-[#7EBC8A]" />
                  <span>{t('campaigns.initiateCampaign', 'Initiate Campaign')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 space-y-8">

      {/* Creation Modal / Inline Drawer */}
      {isFormOpen && (
        <div className="onearth-card p-6 sm:p-8 shadow-xl animate-fadeIn relative border-2 border-[#2D5A34]">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E2DDD2] dark:border-[#223826]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2D5A34]/15 flex items-center justify-center text-[#2D5A34] dark:text-[#7EBC8A]">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC]">
                Initiate New Reforestation Campaign
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-[#5E725B] hover:text-[#162716] dark:hover:text-[#EDF3EC] rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CampaignForm
            onSubmitCampaign={addCampaign}
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="onearth-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E725B] dark:text-[#8FA58C]" />
          <input
            type="text"
            placeholder="Search campaigns by name, area, steward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#F8F6F1] dark:bg-[#101C12] border border-[#E2DDD2] dark:border-[#223826] rounded-full text-xs text-[#162716] dark:text-[#EDF3EC] focus:outline-none focus:ring-2 focus:ring-[#2D5A34]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5E725B] hover:text-[#162716]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto p-1 bg-[#F8F6F1] dark:bg-[#101C12] rounded-full border border-[#E2DDD2] dark:border-[#223826]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#2D5A34] text-white shadow-xs'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC]'
            }`}
          >
            All ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-[#2D5A34] text-white shadow-xs'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC]'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-[#2D5A34] text-white shadow-xs'
                : 'text-[#5E725B] dark:text-[#8FA58C] hover:text-[#162716] dark:hover:text-[#EDF3EC]'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="onearth-card p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#2D5A34]/10 dark:bg-[#2D5A34]/25 flex items-center justify-center mx-auto text-[#2D5A34] dark:text-[#7EBC8A] border border-[#2D5A34]/30">
            {campaigns.length === 0 ? <Layers className="w-7 h-7" /> : <Target className="w-7 h-7" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-['Fraunces'] text-2xl font-bold text-[#162716] dark:text-[#EDF3EC]">
              {campaigns.length === 0 ? 'No Conservation Campaigns Yet' : 'No Matching Campaigns Found'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5E725B] dark:text-[#8FA58C] max-w-md mx-auto leading-relaxed font-light">
              {campaigns.length === 0
                ? 'Group tree plantings into coordinated community cohorts for watershed restoration, agroforestry, or riparian buffers.'
                : 'No campaigns matched your active search terms or status filter. Try clearing your query or reset the filters.'}
            </p>
          </div>
          <div>
            {campaigns.length === 0 ? (
              <button
                type="button"
                className="onearth-btn-primary"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="w-4 h-4 text-[#7EBC8A]" />
                <span>Initiate First Campaign</span>
              </button>
            ) : (
              <button
                type="button"
                className="onearth-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const stats = getCampaignStats(camp.campaign_id);
            const active = isCampaignActive(camp);

            // Compute focus species names
            const focusSpecies = SPECIES_DATA.filter((s) =>
              camp.focus_species_ids?.includes(s.id)
            );

            // Unique species represented in actual trees planted
            const treesInCamp = trees.filter((t) => t.campaign_id === camp.campaign_id);
            const uniquePlantedSpecies = new Set(treesInCamp.map((t) => t.species)).size;

            return (
              <div
                key={camp.campaign_id}
                id={`campaign-card-${camp.campaign_id}`}
                className="onearth-card flex flex-col justify-between hover:border-[#2D5A34] dark:hover:border-[#427B4C] hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-6 pb-4 border-b border-[#E2DDD2] dark:border-[#223826]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                            active
                              ? 'bg-[#2D5A34]/15 text-[#2D5A34] dark:text-[#7EBC8A] border-[#2D5A34]/30'
                              : 'bg-black/5 dark:bg-white/5 text-[#5E725B] dark:text-[#8FA58C] border-[#E2DDD2] dark:border-[#223826]'
                          }`}
                        >
                          {active ? 'Active Initiative' : 'Completed'}
                        </span>
                        <span className="text-[11px] font-mono text-[#D48B38] font-semibold">
                          {stats.survivalPct}% Survival
                        </span>
                      </div>
                      <h3 className="font-['Fraunces'] text-xl font-bold text-[#162716] dark:text-[#EDF3EC] group-hover:text-[#2D5A34] dark:group-hover:text-[#7EBC8A] transition-colors leading-snug">
                        <Link to={`/campaigns/${camp.campaign_id}`}>{camp.name}</Link>
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#5E725B] dark:text-[#8FA58C] mt-2.5 line-clamp-2 leading-relaxed font-light">
                    {camp.description}
                  </p>
                </div>

                <div className="p-6 pt-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 text-xs text-[#5E725B] dark:text-[#8FA58C]">
                    {/* Metadata items */}
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#2D5A34] dark:text-[#7EBC8A] shrink-0" />
                      <span className="truncate">
                        Lead Steward: <strong className="text-[#162716] dark:text-[#EDF3EC]">{camp.organizer}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#D48B38] shrink-0" />
                      <span className="truncate">{camp.area_name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#5E725B] dark:text-[#8FA58C] shrink-0" />
                      <span>
                        {camp.start_date} {camp.end_date ? `→ ${camp.end_date}` : '→ Ongoing'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-[#162716] dark:text-[#EDF3EC]">
                          {stats.treeCount} / {camp.goal_tree_count} trees planted
                        </span>
                        <span className="text-[#2D5A34] dark:text-[#7EBC8A] font-bold">
                          {stats.progressPct}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE5DB] dark:bg-[#1E3020] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#2D5A34] to-[#5EA46C] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stats.progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Species details */}
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E2DDD2] dark:border-[#223826]">
                      <span className="flex items-center gap-1 text-[#2D5A34] dark:text-[#7EBC8A]">
                        <Leaf className="w-3 h-3 text-[#5EA46C]" />
                        <span>
                          {uniquePlantedSpecies} {uniquePlantedSpecies === 1 ? 'species' : 'species'} planted
                        </span>
                      </span>
                      {focusSpecies.length > 0 && (
                        <span className="text-[10px] font-mono text-[#D48B38]">
                          {focusSpecies.length} focus targets
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#E2DDD2] dark:border-[#223826]">
                    <button
                      type="button"
                      className="onearth-btn-secondary flex-1 text-xs py-2 px-3"
                      onClick={() => navigate(`/campaigns/${camp.campaign_id}`)}
                    >
                      Inspect Details
                    </button>
                    <button
                      type="button"
                      className="onearth-btn-primary flex-1 text-xs py-2 px-3"
                      onClick={() => navigate(`/tree-tracker?campaign_id=${camp.campaign_id}`)}
                    >
                      <Trees className="w-3.5 h-3.5 text-[#7EBC8A]" />
                      <span>Plant Tree</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
