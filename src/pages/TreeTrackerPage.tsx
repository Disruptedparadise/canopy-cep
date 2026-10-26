import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useTrees, getEffectiveStatus } from '../context/TreeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { TreeRecord } from '../types';
import { SPECIES_DATA } from '../data/speciesData';
import { CheckinModal } from '../components/CheckinModal';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  X,
  Layers,
  Sprout,
  Filter,
} from 'lucide-react';

// Location picker component for map clicks
function LocationMarker({
  selectedLoc,
  onSelect,
}: {
  selectedLoc: { lat: number; lng: number } | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!selectedLoc) return null;

  return (
    <CircleMarker
      center={[selectedLoc.lat, selectedLoc.lng]}
      pathOptions={{ color: '#10B981', fillColor: '#34D399', fillOpacity: 0.9, weight: 2 }}
      radius={9}
    >
      <Popup>
        <div className="text-xs p-1">
          <strong>Selected Planting Site</strong>
          <div>Lat: {selectedLoc.lat.toFixed(5)}</div>
          <div>Lng: {selectedLoc.lng.toFixed(5)}</div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// Invalidate map size on mount
function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export const TreeTrackerPage: React.FC = () => {
  const { trees, addTree } = useTrees();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign_id') || undefined;
  const speciesParam = searchParams.get('species') || undefined;
  const actionParam = searchParams.get('action') || undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'needs-watch' | 'my-trees'>('all');
  const [selectedTree, setSelectedTree] = useState<TreeRecord | null>(null);
  const [checkinModalTree, setCheckinModalTree] = useState<TreeRecord | null>(null);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [pickedLoc, setPickedLoc] = useState<{ lat: number; lng: number } | null>(null);

  // New tree form state
  const [speciesName, setSpeciesName] = useState(speciesParam || 'Neem');
  const [planterName, setPlanterName] = useState(user?.name || 'Field Steward');
  const [soilType, setSoilType] = useState('loamy');
  const [slope, setSlope] = useState<'flat' | 'gentle' | 'steep'>('gentle');
  const [treeNotes, setTreeNotes] = useState('');

  // Auto-open plant modal when arriving from a campaign, navbar, or species finder
  useEffect(() => {
    if (speciesParam) {
      setSpeciesName(speciesParam);
      setIsPlantModalOpen(true);
    } else if (campaignId || actionParam === 'new') {
      setIsPlantModalOpen(true);
    }
  }, [campaignId, speciesParam, actionParam]);

  // Filtered trees
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSpecies = tree.species.toLowerCase().includes(q);
        const matchPlanter = tree.planter.toLowerCase().includes(q);
        const matchId = tree.id.toLowerCase().includes(q);
        if (!matchSpecies && !matchPlanter && !matchId) return false;
      }

      // Filter status
      if (filterStatus === 'healthy') {
        return getEffectiveStatus(tree) === 'healthy';
      }
      if (filterStatus === 'needs-watch') {
        return getEffectiveStatus(tree) === 'needs-watch';
      }
      if (filterStatus === 'my-trees' && user?.name) {
        return tree.planter.toLowerCase() === user.name.toLowerCase();
      }

      return true;
    });
  }, [trees, searchQuery, filterStatus, user]);

  // Center of the map
  const mapCenter: [number, number] = useMemo(() => {
    if (trees.length > 0) {
      return [trees[0].lat, trees[0].lng];
    }
    return [18.5204, 73.8567]; // Default
  }, [trees]);

  // Handle submit new tree
  const handlePlantTree = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = pickedLoc ? pickedLoc.lat : (mapCenter[0] + (Math.random() - 0.5) * 0.01);
    const lng = pickedLoc ? pickedLoc.lng : (mapCenter[1] + (Math.random() - 0.5) * 0.01);

    try {
      await addTree({
        species: speciesName,
        planter: planterName,
        lat,
        lng,
        date_planted: new Date().toISOString().split('T')[0],
        status: 'healthy',
        soil_type: soilType,
        slope,
        notes: treeNotes || undefined,
        campaign_id: campaignId,
      });

      success('Tree Registered', `${speciesName} successfully pinned to the field map.`);
      setIsPlantModalOpen(false);
      setPickedLoc(null);
      setTreeNotes('');
    } catch (err: any) {
      error('Registration Failed', err?.message || 'Could not register tree.');
    }
  };

  const getMarkerColor = (tree: TreeRecord) => {
    const status = getEffectiveStatus(tree);
    if (status === 'healthy') return '#10B981';
    if (status === 'needs-watch') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#08090A] transition-colors">
      {/* Top Header & Search Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#0D0F11] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-950 dark:text-white leading-tight">
              Tree Registry & Field Map
            </h1>
            <span className="text-[11px] text-zinc-500 font-mono">
              {trees.length} living saplings monitored
            </span>
          </div>
        </div>

        {/* Center: Search & Filter Pills */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trees by species or planter…"
              className="w-full pl-9 pr-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/5 dark:border-white/5 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('healthy')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'healthy' ? 'bg-emerald-500 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Healthy
            </button>
            <button
              onClick={() => setFilterStatus('needs-watch')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'needs-watch' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Watch
            </button>
          </div>
        </div>

        {/* Right: + Plant Tree Primary Action */}
        <button
          onClick={() => setIsPlantModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Plant Tree</span>
        </button>
      </div>

      {/* Main Split-Screen View: Map (65%) + Tree List (35%) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Map Container */}
        <div className="flex-1 h-full min-h-[350px] relative">
          <MapContainer
            center={mapCenter}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <InvalidateMapSize />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker
              selectedLoc={pickedLoc}
              onSelect={(lat, lng) => {
                setPickedLoc({ lat, lng });
                setIsPlantModalOpen(true);
              }}
            />

            {filteredTrees.map((tree) => (
              <CircleMarker
                key={tree.id}
                center={[tree.lat, tree.lng]}
                pathOptions={{
                  color: getMarkerColor(tree),
                  fillColor: getMarkerColor(tree),
                  fillOpacity: 0.85,
                  weight: 2,
                }}
                radius={selectedTree?.id === tree.id ? 10 : 7}
                eventHandlers={{
                  click: () => setSelectedTree(tree),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <strong className="block text-sm text-zinc-900 dark:text-white">{tree.species}</strong>
                    <div className="text-zinc-600 dark:text-zinc-400">Planter: {tree.planter}</div>
                    <div className="text-zinc-600 dark:text-zinc-400">Status: <span className="capitalize text-emerald-600 dark:text-emerald-400 font-semibold">{getEffectiveStatus(tree)}</span></div>
                    <button
                      onClick={() => setCheckinModalTree(tree)}
                      className="mt-1 w-full py-1 text-[11px] rounded bg-emerald-600 text-white font-semibold text-center cursor-pointer block"
                    >
                      + Add Check-in
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Quick Helper Pill */}
          <div className="absolute bottom-4 left-4 z-[400] pointer-events-none bg-white/90 dark:bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-[11px] text-zinc-800 dark:text-zinc-300 font-medium shadow-sm">
            Tip: Click anywhere on the map to pin a new tree
          </div>
        </div>

        {/* Tree List Sidebar Panel (Clean & Simple) */}
        <div className="w-full lg:w-96 h-64 lg:h-full border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 bg-white dark:bg-[#0A0C0E] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <span>{filteredTrees.length} trees found</span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Live Registry</span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5 p-2 space-y-1">
            {filteredTrees.map((tree) => {
              const status = getEffectiveStatus(tree);
              const isSelected = selectedTree?.id === tree.id;
              return (
                <div
                  key={tree.id}
                  onClick={() => setSelectedTree(tree)}
                  className={`p-3 rounded-xl transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-white/[0.08] border border-emerald-500/30 dark:border-white/[0.15]'
                      : 'hover:bg-black/5 dark:hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-950 dark:text-white">{tree.species}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
                        status === 'healthy'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>{tree.planter}</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {tree.date_planted}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {tree.lat.toFixed(4)}, {tree.lng.toFixed(4)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckinModalTree(tree);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                      >
                        + Check-in
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTrees.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                <Sprout className="w-6 h-6 mx-auto text-zinc-400" />
                <p>No trees match your search or filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clean Modal: Plant Tree */}
      {isPlantModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsPlantModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0F1113] border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-5 z-10 animate-slideUp">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Register a Planted Tree</span>
              </h2>
              <button
                onClick={() => setIsPlantModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlantTree} className="space-y-4">
              {campaignId && (
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <span>🌿</span>
                  <span>This tree will be linked to the campaign.</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-zinc-500 uppercase">
                  Tree Species
                </label>
                <select
                  value={speciesName}
                  onChange={(e) => setSpeciesName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {SPECIES_DATA.map((sp) => (
                    <option key={sp.id} value={sp.name} className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">
                      {sp.name} ({sp.scientific_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-zinc-500 uppercase">
                  Planter Name
                </label>
                <input
                  type="text"
                  required
                  value={planterName}
                  onChange={(e) => setPlanterName(e.target.value)}
                  placeholder="e.g. Maya Sen"
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">
                    Soil Type
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="loamy" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Loamy</option>
                    <option value="sandy" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Sandy</option>
                    <option value="clayey" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Clayey</option>
                    <option value="rocky" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Rocky</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">
                    Slope Gradient
                  </label>
                  <select
                    value={slope}
                    onChange={(e) => setSlope(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="flat" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Flat (0–5°)</option>
                    <option value="gentle" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Gentle (5–15°)</option>
                    <option value="steep" className="bg-white dark:bg-[#0F1113] text-zinc-900 dark:text-white">Steep (Over 15°)</option>
                  </select>
                </div>
              </div>

              {pickedLoc && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                  Coordinates: {pickedLoc.lat.toFixed(5)}, {pickedLoc.lng.toFixed(5)}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-zinc-500 uppercase">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={treeNotes}
                  onChange={(e) => setTreeNotes(e.target.value)}
                  placeholder="e.g. Mulched with straw, watered 5 liters."
                  className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlantModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                >
                  Save Tree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkin Modal */}
      {checkinModalTree && (
        <CheckinModal
          tree={checkinModalTree}
          onClose={() => setCheckinModalTree(null)}
          onGrowthLogAdded={() => {
            setCheckinModalTree(null);
            success('Check-in Logged', 'Survival status updated.');
          }}
        />
      )}
    </div>
  );
};
