import { TreeRecord, TreeStatus, SlopeType, Checkin, TreePhoto } from '../types';
import { INITIAL_TREES } from '../data/treeData';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

export interface NewTreeInput {
  species: string;
  species_id?: string;
  planter: string;
  date_planted: string;
  status: TreeStatus;
  lat: number;
  lng: number;
  soil_type: string;
  slope: SlopeType;
  notes?: string;
  initialNote?: string;
  initialPhotoUrl?: string;
  user_id?: string | null;
  campaign_id?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Local cache for offline fallback or unconfigured Supabase
const LOCAL_STORAGE_KEY = 'rootguard_trees_cache_v3';

function getLocalTrees(): TreeRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read local trees:', e);
  }
  return [...INITIAL_TREES];
}

function saveLocalTrees(trees: TreeRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trees));
  } catch (e) {
    console.warn('Failed to persist local trees:', e);
  }
}

let inMemoryTrees: TreeRecord[] = getLocalTrees();

/**
 * Seed initial sample trees into Supabase if the tables are empty
 */
export async function seedSupabaseInitialData(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    for (const tree of INITIAL_TREES) {
      const speciesId = tree.species.toLowerCase().replace(/[^a-z0-9]/g, '-');
      // 1. Insert tree
      const { error: treeErr } = await supabase.from('trees').upsert({
        tree_id: tree.id,
        species_id: speciesId,
        species_name: tree.species,
        planter_name: tree.planter,
        latitude: tree.lat,
        longitude: tree.lng,
        date_planted: tree.date_planted,
        status: tree.status,
        soil_type: tree.soil_type,
        slope: tree.slope,
        notes: tree.notes || null,
        user_id: tree.user_id || null,
      });

      if (treeErr) {
        console.warn(`Could not seed tree ${tree.id}:`, treeErr.message);
        continue;
      }

      // 2. Insert checkins
      if (tree.checkins && tree.checkins.length > 0) {
        const checkinRows = tree.checkins.map((c, i) => ({
          id: `checkin-${tree.id}-${i}-${Date.now()}`,
          tree_id: tree.id,
          date: c.date,
          status: c.status,
          note: c.note,
        }));
        await supabase.from('checkins').upsert(checkinRows);
      }

      // 3. Insert photos
      if (tree.photos && tree.photos.length > 0) {
        const photoRows = tree.photos.map((p, i) => ({
          id: `photo-${tree.id}-${i}-${Date.now()}`,
          tree_id: tree.id,
          url: p.url,
          date: p.date,
        }));
        await supabase.from('photos').upsert(photoRows);
      }
    }
    console.log('Successfully seeded initial trees to Supabase');
  } catch (err) {
    console.warn('Error during Supabase seeding:', err);
  }
}

/**
 * Fetch all registered trees from Supabase (or fallback to local cache)
 */
export async function getTrees(): Promise<{ trees: TreeRecord[]; isLiveSupabase: boolean; error?: string }> {
  const supabase = getSupabase();

  if (!supabase) {
    // Supabase not configured in environment
    return {
      trees: inMemoryTrees,
      isLiveSupabase: false,
    };
  }

  try {
    // Attempt nested query joining checkins and photos
    const { data: treesData, error: treesError } = await supabase
      .from('trees')
      .select(`
        tree_id,
        user_id,
        species_id,
        species_name,
        planter_name,
        latitude,
        longitude,
        date_planted,
        status,
        soil_type,
        slope,
        notes,
        created_at,
        checkins (
          id,
          date,
          status,
          note
        ),
        photos (
          id,
          url,
          date
        )
      `)
      .order('date_planted', { ascending: false });

    if (treesError) {
      console.warn('Supabase relation query error, trying separate queries:', treesError.message);

      // Fallback: Query trees, checkins, and photos separately
      const { data: flatTrees, error: flatError } = await supabase
        .from('trees')
        .select('*')
        .order('date_planted', { ascending: false });

      if (flatError) {
        throw new Error(flatError.message);
      }

      if (!flatTrees || flatTrees.length === 0) {
        // Tables are empty; auto-seed with initial data
        await seedSupabaseInitialData();
        return { trees: inMemoryTrees, isLiveSupabase: true };
      }

      const { data: flatCheckins } = await supabase.from('checkins').select('*');
      const { data: flatPhotos } = await supabase.from('photos').select('*');

      const mapped: TreeRecord[] = flatTrees.map((row: any) => {
        const treeCheckins: Checkin[] = (flatCheckins || [])
          .filter((c: any) => c.tree_id === row.tree_id)
          .map((c: any) => ({
            date: c.date,
            status: c.status as TreeStatus,
            note: c.note,
          }));

        const treePhotos: TreePhoto[] = (flatPhotos || [])
          .filter((p: any) => p.tree_id === row.tree_id)
          .map((p: any) => ({
            date: p.date,
            url: p.url,
          }));

        return {
          id: row.tree_id,
          species_id: row.species_id || undefined,
          species: row.species_name,
          planter: row.planter_name,
          date_planted: row.date_planted,
          status: (row.status as TreeStatus) || 'healthy',
          lat: Number(row.latitude),
          lng: Number(row.longitude),
          soil_type: row.soil_type,
          slope: (row.slope as SlopeType) || 'gentle',
          notes: row.notes || undefined,
          user_id: row.user_id || null,
          campaign_id: row.campaign_id || null,
          checkins: treeCheckins,
          photos: treePhotos,
        };
      });

      inMemoryTrees = mapped;
      saveLocalTrees(mapped);
      return { trees: mapped, isLiveSupabase: true };
    }

    if (!treesData || treesData.length === 0) {
      // Auto seed initial data if empty table
      console.log('Supabase "trees" table is empty; seeding initial data...');
      await seedSupabaseInitialData();
      return { trees: inMemoryTrees, isLiveSupabase: true };
    }

    // Map nested rows into TreeRecord[]
    const mapped: TreeRecord[] = treesData.map((row: any) => {
      const checkins: Checkin[] = (row.checkins || []).map((c: any) => ({
        date: c.date,
        status: c.status as TreeStatus,
        note: c.note,
      }));

      const photos: TreePhoto[] = (row.photos || []).map((p: any) => ({
        date: p.date,
        url: p.url,
      }));

      return {
        id: row.tree_id,
        species_id: row.species_id || undefined,
        species: row.species_name,
        planter: row.planter_name,
        date_planted: row.date_planted,
        status: (row.status as TreeStatus) || 'healthy',
        lat: Number(row.latitude),
        lng: Number(row.longitude),
        soil_type: row.soil_type,
        slope: (row.slope as SlopeType) || 'gentle',
        notes: row.notes || undefined,
        user_id: row.user_id || null,
        campaign_id: row.campaign_id || null,
        checkins,
        photos,
      };
    });

    inMemoryTrees = mapped;
    saveLocalTrees(mapped);
    return { trees: mapped, isLiveSupabase: true };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return {
      trees: inMemoryTrees,
      isLiveSupabase: false,
      error: err?.message || 'Failed to connect to Supabase.',
    };
  }
}

/**
 * Submit a newly planted tree record to Supabase (and local cache)
 */
export async function submitTree(input: NewTreeInput): Promise<TreeRecord> {
  if (!input.species || !input.species.trim()) {
    throw new ApiError('Species name is required', 400);
  }
  if (!input.planter || !input.planter.trim()) {
    throw new ApiError('Planter identifier is required', 400);
  }
  if (typeof input.lat !== 'number' || typeof input.lng !== 'number') {
    throw new ApiError('Valid geographic coordinates are required', 400);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const treeDate = input.date_planted || todayStr;
  const treeId = `tree-${Date.now()}`;
  const speciesId = input.species_id || input.species.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const checkinId = `checkin-${Date.now()}`;
  const initialCheckin: Checkin = {
    id: checkinId,
    date: treeDate,
    status: input.status,
    note:
      input.initialNote?.trim() ||
      input.notes?.trim() ||
      `Sapling planted on ${input.slope} slope with ${input.soil_type} soil.`,
  };

  const defaultPhotoUrl =
    input.initialPhotoUrl ||
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80';

  const initialPhoto: TreePhoto = {
    date: treeDate,
    url: defaultPhotoUrl,
  };

  const newTree: TreeRecord = {
    id: treeId,
    species_id: speciesId,
    species: input.species.trim(),
    planter: input.planter.trim(),
    date_planted: treeDate,
    status: input.status,
    lat: input.lat,
    lng: input.lng,
    soil_type: input.soil_type,
    slope: input.slope,
    notes: input.notes?.trim(),
    user_id: input.user_id || null,
    campaign_id: input.campaign_id || null,
    checkins: [initialCheckin],
    photos: [initialPhoto],
  };

  // 1. Write to Supabase if available
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Insert into trees table
      const { error: treeInsertErr } = await supabase.from('trees').insert({
        tree_id: treeId,
        species_id: speciesId,
        species_name: input.species.trim(),
        planter_name: input.planter.trim(),
        latitude: input.lat,
        longitude: input.lng,
        date_planted: treeDate,
        status: input.status,
        soil_type: input.soil_type,
        slope: input.slope,
        notes: input.notes?.trim() || null,
        user_id: input.user_id || null,
      });

      if (treeInsertErr) {
        console.error('Supabase tree insert error:', treeInsertErr);
        throw new Error(treeInsertErr.message);
      }

      // Insert into checkins table
      const checkinId = `checkin-${Date.now()}`;
      await supabase.from('checkins').insert({
        id: checkinId,
        tree_id: treeId,
        date: treeDate,
        status: input.status,
        note: initialCheckin.note,
      });

      // Insert into photos table
      const photoId = `photo-${Date.now()}`;
      await supabase.from('photos').insert({
        id: photoId,
        tree_id: treeId,
        url: defaultPhotoUrl,
        date: treeDate,
      });
    } catch (err: any) {
      console.warn('Failed to write tree to Supabase, saving to local state:', err);
      // Still update local memory so user action isn't lost
    }
  }

  // Update in-memory & local storage
  inMemoryTrees = [newTree, ...inMemoryTrees];
  saveLocalTrees(inMemoryTrees);
  return newTree;
}

/**
 * Add a longitudinal check-in inspection to a tree in Supabase
 */
export async function addTreeCheckin(
  treeId: string,
  checkin: { status: TreeStatus; note: string; date?: string }
): Promise<TreeRecord> {
  const index = inMemoryTrees.findIndex((t) => t.id === treeId);
  const existing = index !== -1 ? inMemoryTrees[index] : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const checkinDate = checkin.date || todayStr;
  const checkinId = `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const newCheckin: Checkin = {
    id: checkinId,
    date: checkinDate,
    status: checkin.status,
    note: checkin.note.trim() || 'Routine survival inspection recorded.',
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error: checkinErr } = await supabase.from('checkins').insert({
        id: checkinId,
        tree_id: treeId,
        date: checkinDate,
        status: checkin.status,
        note: newCheckin.note,
      });

      if (checkinErr) {
        console.error('Supabase checkin insert error:', checkinErr);
      }

      // Update current status on trees table
      await supabase.from('trees').update({ status: checkin.status }).eq('tree_id', treeId);
    } catch (err) {
      console.warn('Failed to write checkin to Supabase:', err);
    }
  }

  if (existing) {
    const updatedCheckins = [newCheckin, ...(existing.checkins || [])];
    const sorted = [...updatedCheckins].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestStatus = sorted[0].status;

    const updatedTree: TreeRecord = {
      ...existing,
      status: latestStatus,
      checkins: updatedCheckins,
    };

    inMemoryTrees[index] = updatedTree;
    saveLocalTrees(inMemoryTrees);
    return updatedTree;
  }

  throw new ApiError(`Tree with ID "${treeId}" not found.`, 404);
}

/**
 * Add a photographic growth record to a tree in Supabase
 */
export async function addTreePhoto(
  treeId: string,
  photo: { url: string; date?: string }
): Promise<TreeRecord> {
  const index = inMemoryTrees.findIndex((t) => t.id === treeId);
  const existing = index !== -1 ? inMemoryTrees[index] : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const photoDate = photo.date || todayStr;
  const newPhoto: TreePhoto = {
    date: photoDate,
    url: photo.url,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { error: photoErr } = await supabase.from('photos').insert({
        id: photoId,
        tree_id: treeId,
        url: photo.url,
        date: photoDate,
      });

      if (photoErr) {
        console.error('Supabase photo insert error:', photoErr);
      }
    } catch (err) {
      console.warn('Failed to write photo to Supabase:', err);
    }
  }

  if (existing) {
    const updatedTree: TreeRecord = {
      ...existing,
      photos: [newPhoto, ...(existing.photos || [])],
    };

    inMemoryTrees[index] = updatedTree;
    saveLocalTrees(inMemoryTrees);
    return updatedTree;
  }

  throw new ApiError(`Tree with ID "${treeId}" not found.`, 404);
}

/**
 * Reset trees database back to initial seed data
 */
export async function resetTreesData(): Promise<TreeRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Re-seed Supabase
      await seedSupabaseInitialData();
    } catch (err) {
      console.warn('Failed to reset Supabase trees:', err);
    }
  }

  inMemoryTrees = [...INITIAL_TREES];
  saveLocalTrees(inMemoryTrees);
  return inMemoryTrees;
}

/**
 * Generates an RFC-4180 compliant CSV string representing tree records
 */
export function exportTreesToCsv(trees: TreeRecord[]): string {
  const headers = [
    'Specimen ID',
    'Species',
    'Planter',
    'Date Planted',
    'Current Status',
    'Latitude',
    'Longitude',
    'Soil Type',
    'Slope Gradient',
    'Checkins Count',
    'Photos Count',
    'User ID',
    'Field Notes',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = trees.map((t) => {
    return [
      escapeCsv(t.id),
      escapeCsv(t.species),
      escapeCsv(t.planter),
      escapeCsv(t.date_planted),
      escapeCsv(t.status),
      escapeCsv(t.lat.toFixed(5)),
      escapeCsv(t.lng.toFixed(5)),
      escapeCsv(t.soil_type),
      escapeCsv(t.slope),
      escapeCsv(t.checkins?.length || 0),
      escapeCsv(t.photos?.length || 0),
      escapeCsv(t.user_id || ''),
      escapeCsv(t.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers an in-browser file download for CSV content
 */
export function triggerCsvDownload(csvContent: string, filename = 'rootguard_plantation_ledger.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
