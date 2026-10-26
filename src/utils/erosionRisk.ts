import { TreeRecord, SlopeType, SoilTip } from '../types';
import { SOIL_TIPS_DATA } from '../data/soilTipsData';

export type ErosionRiskLevel = 'low' | 'medium' | 'high';

export interface FactorBreakdown {
  label: string;
  value: string;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface ErosionRiskAssessment {
  level: ErosionRiskLevel;
  score: number; // 0 - 9
  maxScore: number;
  percent: number; // 0 - 100%
  nearbyTreeCount: number; // within 500m radius
  searchRadiusMeters: number;
  factors: {
    slope: FactorBreakdown;
    soil: FactorBreakdown;
    density: FactorBreakdown;
  };
  recommendedTips: SoilTip[];
  summary: string;
}

/**
 * Calculate Great-Circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Counts how many trees are within a given radius (default 500m).
 * Optionally excludes a tree (e.g. self).
 */
export function countNearbyTrees(
  targetLat: number,
  targetLng: number,
  trees: TreeRecord[],
  radiusMeters = 500,
  excludeTreeId?: string
): number {
  return trees.filter((tree) => {
    if (excludeTreeId && tree.id === excludeTreeId) return false;
    const distance = calculateDistanceMeters(targetLat, targetLng, tree.lat, tree.lng);
    return distance <= radiusMeters;
  }).length;
}

/**
 * Evaluates the Slope factor (0 to 3 points).
 * Steeper slope = faster runoff velocity and shear detachment = higher risk.
 */
export function getSlopeScore(slope: SlopeType): {
  points: number;
  explanation: string;
} {
  switch (slope) {
    case 'flat':
      return {
        points: 0,
        explanation: 'Flat terrain (<2° gradient): Minimal gravitational runoff velocity; rainwater infiltrates rather than shearing topsoil.',
      };
    case 'gentle':
      return {
        points: 1,
        explanation: 'Gentle slope (2°–8° gradient): Moderate runoff acceleration during torrential rain; minor sheet wash vulnerability.',
      };
    case 'steep':
      return {
        points: 3,
        explanation: 'Steep incline (>8° gradient): High hydraulic kinetic energy; susceptible to severe rill carving and mass soil transport.',
      };
    default:
      return {
        points: 1,
        explanation: 'Undetermined slope: baseline moderate runoff assumed.',
      };
  }
}

/**
 * Evaluates the Soil Type factor (0 to 3 points).
 * Cohesive soils (clayey, loamy) resist detachment better than non-cohesive or loose soils (sandy, rocky).
 */
export function getSoilScore(soilType: string): {
  points: number;
  explanation: string;
} {
  const norm = soilType.trim().toLowerCase();

  if (norm.includes('clay')) {
    return {
      points: 0,
      explanation: 'Clayey soil: High electro-chemical particle cohesion strongly resists particle detachment, though surface crusting requires mulching.',
    };
  }

  if (norm.includes('loam')) {
    return {
      points: 1,
      explanation: 'Loamy soil: Balanced aggregation of sand, silt, and clay offers good infiltration capacity and structural stability.',
    };
  }

  if (norm.includes('rock') || norm.includes('gravel') || norm.includes('stony')) {
    return {
      points: 2,
      explanation: 'Rocky/skeletal soil: Low water-holding capacity with loose surface scree prone to sliding and dry ravelling.',
    };
  }

  if (norm.includes('sand')) {
    return {
      points: 3,
      explanation: 'Sandy soil: Coarse granular texture with near-zero cohesion; vulnerable to severe hydraulic scouring and gully formation.',
    };
  }

  // Fallback for peaty, silt, saline, etc.
  return {
    points: 2,
    explanation: `${soilType} soil: Intermediate soil structural stability against hydraulic detachment.`,
  };
}

/**
 * Evaluates the Local Tree Density factor within ~500m (0 to 3 points).
 * Lower tree density = less root soil binding and less raindrop interception canopy = higher risk.
 */
export function getDensityScore(nearbyCount: number): {
  points: number;
  explanation: string;
} {
  if (nearbyCount >= 4) {
    return {
      points: 0,
      explanation: `High local tree density (${nearbyCount} nearby specimens within 500m): Interlocking root networks bind soil horizons and established canopies decelerate falling raindrops.`,
    };
  }

  if (nearbyCount >= 2) {
    return {
      points: 1,
      explanation: `Moderate tree density (${nearbyCount} nearby specimens within 500m): Partial canopy cover and developing root webs provide baseline slope anchoring.`,
    };
  }

  if (nearbyCount === 1) {
    return {
      points: 2,
      explanation: `Sparse tree density (only 1 nearby specimen within 500m): Fragmented ground anchorage leaves open channels for erosive sheet flow.`,
    };
  }

  return {
    points: 3,
    explanation: `Isolated location (0 neighboring trees within 500m): Completely unshielded parcel without adjacent root networks or vegetative barriers.`,
  };
}

/**
 * Pull 1-2 targeted tips from SOIL_TIPS_DATA matching the specific terrain vulnerabilities.
 */
export function getRecommendedSoilTips(
  slope: SlopeType,
  soilType: string,
  nearbyCount: number
): SoilTip[] {
  const normSoil = soilType.toLowerCase();
  const tips: SoilTip[] = [];

  // Tip 03: "Slowing Runoff on Slopes" (High priority for steep or gentle slopes with erosion vulnerability)
  const runoffTip = SOIL_TIPS_DATA.find((t) => t.id === 'tip-03');
  // Tip 02: "Mulching Bare Soil" (Shield loose sand/rock or bare ground from kinetic rainfall)
  const mulchTip = SOIL_TIPS_DATA.find((t) => t.id === 'tip-02');
  // Tip 05: "Keeping Soil Permanently Covered" (Living roots for isolated or sparse plantings)
  const coverTip = SOIL_TIPS_DATA.find((t) => t.id === 'tip-05');
  // Tip 01: "Composting Organic Biomass" (Improves soil aggregation)
  const compostTip = SOIL_TIPS_DATA.find((t) => t.id === 'tip-01');

  if (slope === 'steep' && runoffTip) {
    tips.push(runoffTip);
  }

  if ((normSoil.includes('sand') || normSoil.includes('rock')) && mulchTip) {
    if (!tips.some((t) => t.id === mulchTip.id)) {
      tips.push(mulchTip);
    }
  }

  if (nearbyCount <= 1 && coverTip) {
    if (tips.length < 2 && !tips.some((t) => t.id === coverTip.id)) {
      tips.push(coverTip);
    }
  }

  // Fallback to ensure we always surface 1-2 high-impact tips
  if (tips.length === 0 && runoffTip) tips.push(runoffTip);
  if (tips.length < 2 && mulchTip && !tips.some((t) => t.id === mulchTip.id)) tips.push(mulchTip);
  if (tips.length < 2 && compostTip && !tips.some((t) => t.id === compostTip.id)) tips.push(compostTip);

  return tips.slice(0, 2);
}

/**
 * Transparent erosion risk scoring function.
 * Computes risk level (low / medium / high) per area or tree based on:
 * - Steeper slope = higher risk (0-3 pts)
 * - Sandy/rocky soil = higher risk than loamy/clayey (0-3 pts)
 * - Lower tree density nearby (count of trees within ~500m) = higher risk (0-3 pts)
 * Total Score = 0 to 9 points.
 * - Low: 0 - 3 points
 * - Medium: 4 - 6 points
 * - High: 7 - 9 points
 */
export function computeErosionRisk(
  slope: SlopeType,
  soilType: string,
  nearbyTreeCount: number
): ErosionRiskAssessment {
  const slopeFactor = getSlopeScore(slope);
  const soilFactor = getSoilScore(soilType);
  const densityFactor = getDensityScore(nearbyTreeCount);

  const score = slopeFactor.points + soilFactor.points + densityFactor.points;
  const maxScore = 9;
  const percent = Math.round((score / maxScore) * 100);

  let level: ErosionRiskLevel = 'low';
  if (score >= 7) {
    level = 'high';
  } else if (score >= 4) {
    level = 'medium';
  } else {
    level = 'low';
  }

  let summary = '';
  if (level === 'high') {
    summary = 'Severe erosion vulnerability driven by steep gradients, non-cohesive soil, and sparse root coverage.';
  } else if (level === 'medium') {
    summary = 'Moderate erosion hazard. Requires monitoring of runoff gullies and vegetative ground cover reinforcement.';
  } else {
    summary = 'Favorable soil stability with gentle relief and cohesive ground aggregation.';
  }

  const recommendedTips = getRecommendedSoilTips(slope, soilType, nearbyTreeCount);

  return {
    level,
    score,
    maxScore,
    percent,
    nearbyTreeCount,
    searchRadiusMeters: 500,
    factors: {
      slope: {
        label: 'Topographical Slope',
        value: slope.toUpperCase(),
        points: slopeFactor.points,
        maxPoints: 3,
        explanation: slopeFactor.explanation,
      },
      soil: {
        label: 'Soil Texture Erodibility',
        value: soilType.toUpperCase(),
        points: soilFactor.points,
        maxPoints: 3,
        explanation: soilFactor.explanation,
      },
      density: {
        label: 'Local Tree Density (500m)',
        value: `${nearbyTreeCount} trees nearby`,
        points: densityFactor.points,
        maxPoints: 3,
        explanation: densityFactor.explanation,
      },
    },
    recommendedTips,
    summary,
  };
}

/**
 * Helper to compute risk for an existing TreeRecord within a full dataset.
 */
export function computeTreeErosionRisk(
  tree: TreeRecord,
  allTrees: TreeRecord[]
): ErosionRiskAssessment {
  const nearbyCount = countNearbyTrees(tree.lat, tree.lng, allTrees, 500, tree.id);
  return computeErosionRisk(tree.slope, tree.soil_type, nearbyCount);
}

/**
 * Risk styling color tokens for maps and UI badges.
 */
export const EROSION_RISK_COLORS = {
  low: {
    border: '#2C4B27',
    fill: '#3F6B37',
    text: '#2C4B27',
    bg: 'bg-[#3F6B37]/15',
    badgeBorder: 'border-[#3F6B37]/30',
    ringStroke: '#2C4B27',
    ringFill: '#3F6B37',
    ringOpacity: 0.25,
    ringRadius: 14,
    haloColor: '#2C4B27',
    haloOpacity: 0.25,
  },
  medium: {
    border: '#8A5233',
    fill: '#C79A3F',
    text: '#8A5233',
    bg: 'bg-[#C79A3F]/25',
    badgeBorder: 'border-[#C79A3F]/50',
    ringStroke: '#8A5233',
    ringFill: '#C79A3F',
    ringOpacity: 0.35,
    ringRadius: 20,
    haloColor: '#8A5233',
    haloOpacity: 0.35,
  },
  high: {
    border: '#7A2412',
    fill: '#A6432D',
    text: '#A6432D',
    bg: 'bg-[#A6432D]/15',
    badgeBorder: 'border-[#A6432D]/40',
    ringStroke: '#A6432D',
    ringFill: '#A6432D',
    ringOpacity: 0.45,
    ringRadius: 28,
    haloColor: '#A6432D',
    haloOpacity: 0.45,
  },
};
