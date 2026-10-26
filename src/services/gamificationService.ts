import { TreeRecord } from '../types';
import { BadgeDefinition, UserBadgeProgress, PlanterStewardSummary } from '../types/gamification';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-sapling',
    name: 'First Sapling Planted',
    shortTitle: 'First Sapling',
    description: 'Began the reforestation journey by registering your very first living sapling.',
    ecologicalNarrative:
      'Every mature forest tract begins with an individual seedling anchored firmly into local soil.',
    category: 'planting',
    tier: 'bronze',
    iconName: 'Sprout',
    targetValue: 1,
    unit: 'trees',
  },
  {
    id: 'first-10-trees',
    name: 'First 10 Trees Planted',
    shortTitle: '10 Trees Milestone',
    description: 'Expanded reforestation efforts by successfully logging 10 living trees in the field ledger.',
    ecologicalNarrative:
      'A cluster of 10 trees initiates an active microclimate canopy, reducing surface soil evaporation and providing bird perches.',
    category: 'planting',
    tier: 'silver',
    iconName: 'Trees',
    targetValue: 10,
    unit: 'trees',
  },
  {
    id: 'quarter-century-grove',
    name: 'Quarter-Century Grove',
    shortTitle: '25 Trees Grove',
    description: 'Established a dedicated community grove of 25+ verified trees.',
    ecologicalNarrative:
      'Twenty-five established native trees form a self-reinforcing mycorrhizal fungal network beneath the topsoil.',
    category: 'planting',
    tier: 'gold',
    iconName: 'Landmark',
    targetValue: 25,
    unit: 'trees',
  },
  {
    id: 'one-year-survival',
    name: '1-Year Survival Milestone',
    shortTitle: '1-Year Survival',
    description: 'Successfully nurtured at least one sapling past the critical 365-day first-year establishment threshold.',
    ecologicalNarrative:
      'Over 80% of conventional tree planting mortalities occur within the first 12 months. Surpassing 365 days indicates established taproot contact with deeper subsoil water.',
    category: 'survival',
    tier: 'gold',
    iconName: 'ShieldCheck',
    targetValue: 365,
    unit: 'days',
  },
  {
    id: 'two-year-veteran',
    name: 'Two-Season Canopy Veteran',
    shortTitle: '2-Year Veteran',
    description: 'Guided a specimen through 730+ days (2 full annual cycles of monsoon deluges and summer heatwaves).',
    ecologicalNarrative:
      'Two full seasonal cycles signify that the sapling has developed lignified bark, wind resistance, and permanent drought tolerance.',
    category: 'survival',
    tier: 'emerald',
    iconName: 'Crown',
    targetValue: 730,
    unit: 'days',
  },
  {
    id: 'slope-erosion-sentinel',
    name: 'Slope Erosion Sentinel',
    shortTitle: 'Erosion Sentinel',
    description: 'Planted 3 or more trees on steep terrain gradients to intercept runoff and arrest topsoil washout.',
    ecologicalNarrative:
      'Steep slope root systems weave living subterranean bio-nets that mitigate mudslides and stabilize hillside watersheds.',
    category: 'watershed',
    tier: 'silver',
    iconName: 'Mountain',
    targetValue: 3,
    unit: 'trees',
  },
  {
    id: 'poly-culture-biodiversity',
    name: 'Poly-Culture Biodiversity Steward',
    shortTitle: 'Biodiversity Steward',
    description: 'Cultivated ecological resilience by planting 3 or more distinct native tree species.',
    ecologicalNarrative:
      'Monocultures collapse under pest pressure; poly-cultures mimic natural climax forest ecosystems with complementary root depths.',
    category: 'biodiversity',
    tier: 'silver',
    iconName: 'Sparkles',
    targetValue: 3,
    unit: 'species',
  },
  {
    id: 'longitudinal-auditor',
    name: 'Longitudinal Field Inspector',
    shortTitle: 'Field Inspector',
    description: 'Demonstrated rigorous scientific stewardship by logging 5 or more ongoing health check-in audits.',
    ecologicalNarrative:
      'True ecological restoration requires continuous empirical observation and timely intervention rather than unmonitored planting.',
    category: 'stewardship',
    tier: 'bronze',
    iconName: 'ClipboardCheck',
    targetValue: 5,
    unit: 'inspections',
  },
];

const UNLOCKED_BADGES_STORAGE_KEY_PREFIX = 'rootguard_unlocked_badges_v1_';

/**
 * Retrieves persisted unlock timestamps from localStorage
 */
function getPersistedUnlockHistory(storageKey: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(UNLOCKED_BADGES_STORAGE_KEY_PREFIX + storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persists newly unlocked badge timestamps
 */
function savePersistedUnlockHistory(storageKey: string, history: Record<string, string>): void {
  try {
    localStorage.setItem(UNLOCKED_BADGES_STORAGE_KEY_PREFIX + storageKey, JSON.stringify(history));
  } catch (err) {
    console.warn('Could not persist badge unlock history:', err);
  }
}

/**
 * Calculates days since planting for living trees
 */
export function getTreeSurvivalDays(tree: TreeRecord): number {
  if (tree.status === 'not-surviving') return 0;
  const plantedMs = new Date(tree.date_planted).getTime();
  if (isNaN(plantedMs)) return 0;
  const nowMs = Date.now();
  const diffDays = Math.floor((nowMs - plantedMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Evaluates a cohort of trees against all badge milestones
 */
export function evaluateStewardBadges(
  trees: TreeRecord[],
  storageKey = 'global'
): PlanterStewardSummary {
  const history = getPersistedUnlockHistory(storageKey);
  const updatedHistory = { ...history };
  const nowIso = new Date().toISOString();

  // Basic cohort aggregates
  const totalPlanted = trees.length;
  const livingTrees = trees.filter((t) => t.status !== 'not-surviving');
  const survivingCount = livingTrees.length;
  const survivalRatePct = totalPlanted > 0 ? Math.round((survivingCount / totalPlanted) * 100) : 0;

  // Max survival days among living trees
  const survivalDaysList = livingTrees.map(getTreeSurvivalDays);
  const longestSurvivalDays = survivalDaysList.length > 0 ? Math.max(...survivalDaysList) : 0;

  // Distinct species
  const speciesSet = new Set(trees.map((t) => (t.species || '').trim().toLowerCase()).filter(Boolean));
  const distinctSpeciesCount = speciesSet.size;

  // Steep slope plantings
  const steepSlopeTrees = trees.filter((t) => t.slope === 'steep');
  const steepSlopeCount = steepSlopeTrees.length;

  // Total check-ins logged across all trees
  const totalCheckins = trees.reduce((acc, t) => acc + (t.checkins ? t.checkins.length : 0), 0);

  // Evaluate each badge
  const badges: UserBadgeProgress[] = BADGE_DEFINITIONS.map((badge) => {
    let currentValue = 0;
    let qualifyingTrees: TreeRecord[] = [];

    switch (badge.id) {
      case 'first-sapling': {
        currentValue = totalPlanted;
        qualifyingTrees = trees.slice(0, 1);
        break;
      }
      case 'first-10-trees': {
        currentValue = totalPlanted;
        qualifyingTrees = trees.slice(0, 10);
        break;
      }
      case 'quarter-century-grove': {
        currentValue = totalPlanted;
        qualifyingTrees = trees.slice(0, 25);
        break;
      }
      case 'one-year-survival': {
        // Living trees with >= 365 days
        qualifyingTrees = livingTrees.filter((t) => getTreeSurvivalDays(t) >= 365);
        currentValue = longestSurvivalDays;
        break;
      }
      case 'two-year-veteran': {
        // Living trees with >= 730 days
        qualifyingTrees = livingTrees.filter((t) => getTreeSurvivalDays(t) >= 730);
        currentValue = longestSurvivalDays;
        break;
      }
      case 'slope-erosion-sentinel': {
        qualifyingTrees = steepSlopeTrees;
        currentValue = steepSlopeCount;
        break;
      }
      case 'poly-culture-biodiversity': {
        currentValue = distinctSpeciesCount;
        // 1 sample tree per distinct species
        const seenSpecies = new Set<string>();
        qualifyingTrees = trees.filter((t) => {
          const sp = (t.species || '').trim().toLowerCase();
          if (!seenSpecies.has(sp)) {
            seenSpecies.add(sp);
            return true;
          }
          return false;
        });
        break;
      }
      case 'longitudinal-auditor': {
        currentValue = totalCheckins;
        qualifyingTrees = trees.filter((t) => t.checkins && t.checkins.length > 0);
        break;
      }
      default:
        break;
    }

    const unlocked = currentValue >= badge.targetValue;
    const progressPct = Math.min(100, Math.round((currentValue / badge.targetValue) * 100));

    let unlockedAt = history[badge.id] || null;
    let isNewUnlock = false;

    if (unlocked && !unlockedAt) {
      unlockedAt = nowIso;
      updatedHistory[badge.id] = nowIso;
      isNewUnlock = true;
    }

    return {
      badge,
      unlocked,
      unlockedAt,
      currentValue,
      targetValue: badge.targetValue,
      progressPct,
      qualifyingTreeIds: qualifyingTrees.map((t) => t.id),
      qualifyingTrees,
      isNewUnlock,
    };
  });

  // Save any new unlocks
  if (Object.keys(updatedHistory).length !== Object.keys(history).length) {
    savePersistedUnlockHistory(storageKey, updatedHistory);
  }

  const badgesUnlockedCount = badges.filter((b) => b.unlocked).length;

  // Calculate steward rank
  let stewardRank = 'Apprentice Planter';
  if (badgesUnlockedCount >= 7) {
    stewardRank = 'Grand Canopy Guardian';
  } else if (badgesUnlockedCount >= 5) {
    stewardRank = 'Master Forest Steward';
  } else if (badgesUnlockedCount >= 3) {
    stewardRank = 'Canopy Architect';
  } else if (badgesUnlockedCount >= 1) {
    stewardRank = 'Field Conservationist';
  }

  const primaryPlanter = trees.length > 0 && trees[0].planter ? trees[0].planter : 'Field Steward';

  return {
    planterName: primaryPlanter,
    totalPlanted,
    survivingCount,
    survivalRatePct,
    longestSurvivalDays,
    distinctSpeciesCount,
    steepSlopeCount,
    totalCheckins,
    badgesUnlockedCount,
    totalBadgesCount: BADGE_DEFINITIONS.length,
    badges,
    stewardRank,
  };
}

/**
 * Acknowledge all pending unlock celebrations for this steward
 */
export function dismissBadgeNewStatus(storageKey: string): void {
  // If needed, mark seen
}
