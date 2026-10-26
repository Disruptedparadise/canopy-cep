import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TreeRecord, TreeStatus, Checkin, TreePhoto, SlopeType, Campaign } from '../types';
import * as treeService from '../services/treeService';
import { NewTreeInput } from '../services/treeService';
import { INITIAL_CAMPAIGNS } from '../data/campaignData';

const LOCAL_STORAGE_KEY = 'ground_cover_trees_v2';
const CAMPAIGNS_STORAGE_KEY = 'rootguard_campaigns_v1';

export interface CampaignStats {
  treeCount: number;
  healthyCount: number;
  needsWatchCount: number;
  notSurvivingCount: number;
  survivalPct: number;
  progressPct: number;
  goal: number;
}

export interface TreeContextType {
  trees: TreeRecord[];
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  isLiveSupabase: boolean;
  reloadTrees: () => Promise<void>;
  addTree: (input: NewTreeInput) => Promise<TreeRecord>;
  addCheckin: (
    treeId: string,
    checkin: { status: TreeStatus; note: string; date?: string }
  ) => Promise<TreeRecord>;
  addPhoto: (
    treeId: string,
    photo: { url: string; date?: string }
  ) => Promise<TreeRecord>;
  getTreeById: (id: string) => TreeRecord | undefined;
  addCampaign: (campaign: Omit<Campaign, 'campaign_id'>) => Campaign;
  getCampaignById: (id: string) => Campaign | undefined;
  getCampaignStats: (campaignId: string) => CampaignStats;
  resetToDefault: () => Promise<void>;
  // Computed survival analytics
  survivalStats: {
    total: number;
    healthyCount: number;
    healthyPct: number;
    needsWatchCount: number;
    needsWatchPct: number;
    notSurvivingCount: number;
    notSurvivingPct: number;
    survivedTotal: number;
    survivedPct: number; // (healthy + needs-watch) / total
  };
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

// Helper to derive current status from the most recent check-in
export function getEffectiveStatus(tree: TreeRecord): TreeStatus {
  if (!tree.checkins || tree.checkins.length === 0) {
    return tree.status || 'healthy';
  }
  // Sort descending by date
  const sorted = [...tree.checkins].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].status;
}

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load local campaigns:', e);
    }
    return INITIAL_CAMPAIGNS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load via the services layer
  const loadTrees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await treeService.getTrees();
      setTrees(result.trees);
      setIsLiveSupabase(result.isLiveSupabase);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      console.error('Error fetching trees:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plantation records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrees();
  }, [loadTrees]);

  // Persist trees updates to localStorage
  useEffect(() => {
    if (trees.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trees));
      } catch (e) {
        console.warn('Failed to persist trees to localStorage:', e);
      }
    }
  }, [trees]);

  // Persist campaigns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    } catch (e) {
      console.warn('Failed to persist campaigns to localStorage:', e);
    }
  }, [campaigns]);

  const addTree = async (input: NewTreeInput): Promise<TreeRecord> => {
    try {
      const created = await treeService.submitTree(input);
      setTrees((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      console.error('API submitTree error:', err);
      throw err;
    }
  };

  const addCheckin = async (
    treeId: string,
    checkin: { status: TreeStatus; note: string; date?: string }
  ): Promise<TreeRecord> => {
    try {
      const updated = await treeService.addTreeCheckin(treeId, checkin);
      setTrees((prev) => prev.map((t) => (t.id === treeId ? updated : t)));
      return updated;
    } catch (err: unknown) {
      console.error('API addTreeCheckin error:', err);
      throw err;
    }
  };

  const addPhoto = async (
    treeId: string,
    photo: { url: string; date?: string }
  ): Promise<TreeRecord> => {
    try {
      const updated = await treeService.addTreePhoto(treeId, photo);
      setTrees((prev) => prev.map((t) => (t.id === treeId ? updated : t)));
      return updated;
    } catch (err: unknown) {
      console.error('API addTreePhoto error:', err);
      throw err;
    }
  };

  const getTreeById = (id: string) => {
    return trees.find((t) => t.id === id);
  };

  const addCampaign = (campaignInput: Omit<Campaign, 'campaign_id'>): Campaign => {
    const newCampaign: Campaign = {
      ...campaignInput,
      campaign_id: `camp-${Date.now()}`,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    return newCampaign;
  };

  const getCampaignById = (id: string) => {
    return campaigns.find((c) => c.campaign_id === id);
  };

  const getCampaignStats = (campaignId: string): CampaignStats => {
    const campaign = campaigns.find((c) => c.campaign_id === campaignId);
    const campaignTrees = trees.filter((t) => t.campaign_id === campaignId);
    const treeCount = campaignTrees.length;
    const goal = campaign?.goal_tree_count || 1;

    let healthyCount = 0;
    let needsWatchCount = 0;
    let notSurvivingCount = 0;

    campaignTrees.forEach((t) => {
      const st = getEffectiveStatus(t);
      if (st === 'healthy') healthyCount++;
      else if (st === 'needs-watch') needsWatchCount++;
      else if (st === 'not-surviving') notSurvivingCount++;
    });

    const survivedTotal = healthyCount + needsWatchCount;
    const survivalPct = treeCount > 0 ? Math.round((survivedTotal / treeCount) * 100) : 0;
    const progressPct = Math.min(100, Math.round((treeCount / goal) * 100));

    return {
      treeCount,
      healthyCount,
      needsWatchCount,
      notSurvivingCount,
      survivalPct,
      progressPct,
      goal,
    };
  };

  const resetToDefault = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      const data = await treeService.resetTreesData();
      setTrees(data);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute survival statistics across active registry
  const total = trees.length;
  let healthyCount = 0;
  let needsWatchCount = 0;
  let notSurvivingCount = 0;

  trees.forEach((t) => {
    const status = getEffectiveStatus(t);
    if (status === 'healthy') healthyCount++;
    else if (status === 'needs-watch') needsWatchCount++;
    else if (status === 'not-surviving') notSurvivingCount++;
  });

  const healthyPct = total > 0 ? Math.round((healthyCount / total) * 100) : 0;
  const needsWatchPct = total > 0 ? Math.round((needsWatchCount / total) * 100) : 0;
  const notSurvivingPct = total > 0 ? Math.round((notSurvivingCount / total) * 100) : 0;
  const survivedTotal = healthyCount + needsWatchCount;
  const survivedPct = total > 0 ? Math.round((survivedTotal / total) * 100) : 0;

  const survivalStats = {
    total,
    healthyCount,
    healthyPct,
    needsWatchCount,
    needsWatchPct,
    notSurvivingCount,
    notSurvivingPct,
    survivedTotal,
    survivedPct,
  };

  return (
    <TreeContext.Provider
      value={{
        trees,
        campaigns,
        isLoading,
        error,
        isLiveSupabase,
        reloadTrees: loadTrees,
        addTree,
        addCheckin,
        addPhoto,
        getTreeById,
        addCampaign,
        getCampaignById,
        getCampaignStats,
        resetToDefault,
        survivalStats,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
};

export const useTrees = (): TreeContextType => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTrees must be used within a TreeProvider');
  }
  return context;
};
