import { TreeRecord } from '../types';

export type BadgeCategory = 'planting' | 'survival' | 'stewardship' | 'biodiversity' | 'watershed';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'emerald';

export interface BadgeDefinition {
  id: string;
  name: string;
  shortTitle: string;
  description: string;
  ecologicalNarrative: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconName: string;
  targetValue: number;
  unit: 'trees' | 'days' | 'inspections' | 'species';
}

export interface UserBadgeProgress {
  badge: BadgeDefinition;
  unlocked: boolean;
  unlockedAt: string | null;
  currentValue: number;
  targetValue: number;
  progressPct: number; // 0 - 100
  qualifyingTreeIds: string[];
  qualifyingTrees: TreeRecord[];
  isNewUnlock?: boolean;
}

export interface PlanterStewardSummary {
  planterName: string;
  totalPlanted: number;
  survivingCount: number;
  survivalRatePct: number;
  longestSurvivalDays: number;
  distinctSpeciesCount: number;
  steepSlopeCount: number;
  totalCheckins: number;
  badgesUnlockedCount: number;
  totalBadgesCount: number;
  badges: UserBadgeProgress[];
  stewardRank: string;
}
