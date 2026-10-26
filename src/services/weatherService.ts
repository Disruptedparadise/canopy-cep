import { TreeRecord } from '../types';

export interface MeteorologicalData {
  temperature: number; // °C
  feelsLike: number; // °C
  relativeHumidity: number; // %
  precipitationMm: number; // current mm
  precipitationSum7d: number; // 7-day cumulative mm
  precipitationProbability: number; // %
  maxTemp7d: number; // peak 7-day temp °C
  evapotranspirationEt0: number; // mm/day reference evapotranspiration
  windSpeedKmH: number; // km/h
  weatherCode: number;
  weatherDescription: string;
  locationName: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  source: 'live' | 'fallback' | 'simulated-drought' | 'simulated-flood';
}

export type RiskSeverity = 'critical' | 'high' | 'moderate' | 'low';

export interface TreeWeatherRisk {
  treeId: string;
  tree: TreeRecord;
  droughtRisk: RiskSeverity;
  droughtScore: number; // 0 - 100
  floodRisk: RiskSeverity;
  floodScore: number; // 0 - 100
  primaryThreat: 'drought' | 'flood' | 'compound' | 'none';
  reasons: string[];
  remedy: string;
}

export type WeatherAlertLevel =
  | 'danger-drought'
  | 'danger-flood'
  | 'warning-drought'
  | 'warning-flood'
  | 'watch'
  | 'optimal';

export interface WeatherAlertSummary {
  alertLevel: WeatherAlertLevel;
  title: string;
  headline: string;
  description: string;
  highDroughtCount: number;
  highFloodCount: number;
  moderateRiskCount: number;
  safeCount: number;
  totalTrees: number;
  treesAtRisk: TreeWeatherRisk[];
  meteorology: MeteorologicalData;
}

// In-memory cache to prevent excessive requests
let cachedWeather: { data: MeteorologicalData; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * WMO Weather code interpreter
 */
export function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Mainly Clear';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy / Hazy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 63) return 'Moderate Rain';
  if (code === 65) return 'Heavy Rainfall';
  if (code >= 80 && code <= 82) return 'Torrential Showers';
  if (code >= 95) return 'Severe Thunderstorm';
  return 'Partly Cloudy';
}

/**
 * Calculate geographical centroid of tree coordinates
 */
export function getTreeCentroid(trees: TreeRecord[]): { lat: number; lng: number } {
  if (!trees || trees.length === 0) {
    return { lat: 19.1685, lng: 73.2112 }; // Default: Western Ghats / Ambernath watershed
  }

  const validTrees = trees.filter((t) => typeof t.lat === 'number' && typeof t.lng === 'number');
  if (validTrees.length === 0) {
    return { lat: 19.1685, lng: 73.2112 };
  }

  const sumLat = validTrees.reduce((acc, t) => acc + t.lat, 0);
  const sumLng = validTrees.reduce((acc, t) => acc + t.lng, 0);

  return {
    lat: Number((sumLat / validTrees.length).toFixed(4)),
    lng: Number((sumLng / validTrees.length).toFixed(4)),
  };
}

/**
 * Fallback meteorological baseline (Western Ghats sub-tropical climate)
 */
export function getFallbackMeteorologicalData(lat: number, lng: number): MeteorologicalData {
  return {
    temperature: 29.5,
    feelsLike: 32.0,
    relativeHumidity: 68,
    precipitationMm: 2.5,
    precipitationSum7d: 28.0,
    precipitationProbability: 35,
    maxTemp7d: 32.5,
    evapotranspirationEt0: 4.1,
    windSpeedKmH: 12.5,
    weatherCode: 2,
    weatherDescription: 'Mainly Clear with Seasonal Humidity',
    locationName: 'Western Ghats Watershed Foothills',
    latitude: lat,
    longitude: lng,
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
  };
}

/**
 * Preset simulations for testing extreme weather scenarios
 */
export const SIMULATION_PRESETS: Record<'drought' | 'flood' | 'balanced', (lat: number, lng: number) => MeteorologicalData> = {
  drought: (lat, lng) => ({
    temperature: 38.5,
    feelsLike: 42.0,
    relativeHumidity: 22,
    precipitationMm: 0.0,
    precipitationSum7d: 0.2,
    precipitationProbability: 5,
    maxTemp7d: 40.2,
    evapotranspirationEt0: 6.8, // High soil moisture depletion
    windSpeedKmH: 24.0,
    weatherCode: 0,
    weatherDescription: 'Severe Heatwave & Acute Atmospheric Desiccation',
    locationName: 'Simulated Extreme Drought Scenario',
    latitude: lat,
    longitude: lng,
    lastUpdated: new Date().toISOString(),
    source: 'simulated-drought',
  }),
  flood: (lat, lng) => ({
    temperature: 24.5,
    feelsLike: 26.0,
    relativeHumidity: 96,
    precipitationMm: 68.0,
    precipitationSum7d: 185.0, // Monsoon deluge
    precipitationProbability: 95,
    maxTemp7d: 26.0,
    evapotranspirationEt0: 1.8,
    windSpeedKmH: 35.0,
    weatherCode: 82,
    weatherDescription: 'Monsoon Torrential Deluge & Severe Saturated Runoff',
    locationName: 'Simulated Flash Flood & Monsoonal Deluge',
    latitude: lat,
    longitude: lng,
    lastUpdated: new Date().toISOString(),
    source: 'simulated-flood',
  }),
  balanced: (lat, lng) => ({
    temperature: 27.0,
    feelsLike: 28.5,
    relativeHumidity: 70,
    precipitationMm: 6.0,
    precipitationSum7d: 34.0,
    precipitationProbability: 40,
    maxTemp7d: 29.5,
    evapotranspirationEt0: 3.5,
    windSpeedKmH: 10.0,
    weatherCode: 61,
    weatherDescription: 'Optimal Light Seasonal Rains & Mild Humidity',
    locationName: 'Optimal Silvicultural Equilibrium',
    latitude: lat,
    longitude: lng,
    lastUpdated: new Date().toISOString(),
    source: 'live',
  }),
};

/**
 * Fetch local meteorological data via Open-Meteo
 */
export async function fetchLocalMeteorology(
  lat: number,
  lng: number,
  forceRefresh = false
): Promise<MeteorologicalData> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedWeather &&
    now - cachedWeather.timestamp < CACHE_TTL_MS &&
    Math.abs(cachedWeather.data.latitude - lat) < 0.05 &&
    Math.abs(cachedWeather.data.longitude - lng) < 0.05
  ) {
    return cachedWeather.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&forecast_days=7&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo API response code ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const prec7d = Array.isArray(daily.precipitation_sum)
      ? daily.precipitation_sum.reduce((acc: number, v: number) => acc + (v || 0), 0)
      : 15;

    const maxTemp = Array.isArray(daily.temperature_2m_max)
      ? Math.max(...daily.temperature_2m_max)
      : 30;

    const avgEt0 = Array.isArray(daily.et0_fao_evapotranspiration) && daily.et0_fao_evapotranspiration.length > 0
      ? daily.et0_fao_evapotranspiration.slice(0, 3).reduce((a: number, b: number) => a + (b || 0), 0) / 3
      : 4.0;

    const probRain = Array.isArray(daily.precipitation_probability_max) && daily.precipitation_probability_max.length > 0
      ? Math.max(...daily.precipitation_probability_max)
      : 40;

    const weatherCode = current.weather_code ?? 1;

    const result: MeteorologicalData = {
      temperature: Math.round((current.temperature_2m ?? 28) * 10) / 10,
      feelsLike: Math.round((current.apparent_temperature ?? 30) * 10) / 10,
      relativeHumidity: Math.round(current.relative_humidity_2m ?? 65),
      precipitationMm: Math.round((current.precipitation ?? 0) * 10) / 10,
      precipitationSum7d: Math.round(prec7d * 10) / 10,
      precipitationProbability: Math.round(probRain),
      maxTemp7d: Math.round(maxTemp * 10) / 10,
      evapotranspirationEt0: Math.round(avgEt0 * 10) / 10,
      windSpeedKmH: Math.round(current.wind_speed_10m ?? 12),
      weatherCode,
      weatherDescription: interpretWeatherCode(weatherCode),
      locationName: `Field Basin (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
      latitude: lat,
      longitude: lng,
      lastUpdated: new Date().toISOString(),
      source: 'live',
    };

    cachedWeather = { data: result, timestamp: now };
    return result;
  } catch (err) {
    console.warn('Weather API failed or timed out, activating fallback telemetry:', err);
    return getFallbackMeteorologicalData(lat, lng);
  }
}

/**
 * Cross-references registered trees with local meteorological data
 * Generates an empirical, multi-factor risk dossier for drought and flooding.
 */
export function crossReferenceTreesWithWeather(
  trees: TreeRecord[],
  weather: MeteorologicalData
): WeatherAlertSummary {
  if (!trees || trees.length === 0) {
    return {
      alertLevel: 'optimal',
      title: 'No Registered Trees',
      headline: 'Awaiting sapling registration for microclimate evaluation.',
      description: 'Pin trees in the tracker to calculate localized drought and flood vectors.',
      highDroughtCount: 0,
      highFloodCount: 0,
      moderateRiskCount: 0,
      safeCount: 0,
      totalTrees: 0,
      treesAtRisk: [],
      meteorology: weather,
    };
  }

  // 1. MACRO METEOROLOGICAL BASELINE DEFICIT / SURGE
  // Drought Climatic Factor (0 - 45 pts)
  let macroDroughtPoints = 0;
  if (weather.temperature >= 38) macroDroughtPoints += 20;
  else if (weather.temperature >= 34) macroDroughtPoints += 14;
  else if (weather.temperature >= 30) macroDroughtPoints += 7;

  if (weather.precipitationSum7d < 2) macroDroughtPoints += 18;
  else if (weather.precipitationSum7d < 10) macroDroughtPoints += 12;
  else if (weather.precipitationSum7d < 25) macroDroughtPoints += 5;

  if (weather.relativeHumidity < 30) macroDroughtPoints += 12;
  else if (weather.relativeHumidity < 45) macroDroughtPoints += 6;

  if (weather.evapotranspirationEt0 >= 5.5) macroDroughtPoints += 10;
  else if (weather.evapotranspirationEt0 >= 4.2) macroDroughtPoints += 5;

  // Flooding Climatic Factor (0 - 55 pts)
  let macroFloodPoints = 0;
  if (weather.precipitationMm >= 50) macroFloodPoints += 30;
  else if (weather.precipitationMm >= 25) macroFloodPoints += 18;
  else if (weather.precipitationMm >= 10) macroFloodPoints += 10;

  if (weather.precipitationSum7d >= 150) macroFloodPoints += 30;
  else if (weather.precipitationSum7d >= 90) macroFloodPoints += 20;
  else if (weather.precipitationSum7d >= 50) macroFloodPoints += 10;

  // Evaluate each tree individually based on site-specific physical parameters
  const treesAtRisk: TreeWeatherRisk[] = trees.map((tree) => {
    let droughtScore = macroDroughtPoints;
    let floodScore = macroFloodPoints;
    const reasons: string[] = [];

    // --- SOIL CROSS-REFERENCE ---
    const soil = (tree.soil_type || 'loamy').toLowerCase();
    if (soil === 'sandy') {
      droughtScore += 24; // Sandy soil rapidly desiccates with high drainage
      floodScore -= 12; // Free-draining sand resists stagnant pooling
      reasons.push('Sandy soil drains rapidly with negligible moisture retention under heat');
    } else if (soil === 'rocky') {
      droughtScore += 18; // Shallow root zone, radiant heat from rocks
      floodScore += 10; // Rapid runoff sheetflow
      reasons.push('Shallow rocky bedrock restricts taproot access to groundwater');
    } else if (soil === 'clayey') {
      droughtScore -= 8; // Retains moisture longer
      floodScore += 28; // High compaction and poor percolation cause waterlogging
      reasons.push('Dense clay soil saturates easily, risking root anoxia and waterlogging');
    } else {
      // Loamy
      droughtScore -= 5;
      floodScore -= 5;
    }

    // --- SLOPE CROSS-REFERENCE ---
    const slope = tree.slope || 'gentle';
    if (slope === 'steep') {
      droughtScore += 16; // Water runs off before infiltration; exposed to drying ridge winds
      floodScore += 22; // High rainfall causes flash erosion and root exposure
      reasons.push('Steep gradient accelerates sheet runoff and high-velocity soil erosion');
    } else if (slope === 'flat') {
      droughtScore -= 8; // Water settles
      floodScore += 25; // Ponding and stagnation in depressions
      reasons.push('Flat basin gradient promotes standing water and saturation');
    }

    // --- TREE AGE / VITALITY CROSS-REFERENCE ---
    const isNeedsWatch = tree.status === 'needs-watch';
    if (isNeedsWatch) {
      droughtScore += 12;
      floodScore += 12;
      reasons.push('Current specimen health is flagged as "Needs Watch" with compromised vigor');
    }

    // Days since planting
    const plantedMs = new Date(tree.date_planted).getTime();
    const daysOld = !isNaN(plantedMs) ? Math.max(1, Math.round((Date.now() - plantedMs) / (1000 * 60 * 60 * 24))) : 180;
    if (daysOld < 90) {
      droughtScore += 14;
      floodScore += 10;
      reasons.push(`Young sapling (${daysOld} days old) without deep lignified root anchoring`);
    }

    // --- SPECIES TOLERANCE MODIFIERS ---
    const sp = (tree.species || '').toLowerCase();
    if (sp.includes('neem') || sp.includes('peepal') || sp.includes('banyan') || sp.includes('subabul')) {
      droughtScore -= 10; // Hardy native taproot
    } else if (sp.includes('gulmohar') || sp.includes('bamboo')) {
      if (slope === 'steep' && floodScore > 40) {
        // Bamboo helps slope, Gulmohar easily slides
        if (sp.includes('gulmohar')) {
          floodScore += 8;
          reasons.push('Gulmohar shallow root plate is prone to slope washouts during heavy rain');
        }
      }
    }

    // Clamp scores
    droughtScore = Math.min(100, Math.max(0, Math.round(droughtScore)));
    floodScore = Math.min(100, Math.max(0, Math.round(floodScore)));

    const droughtRisk: RiskSeverity =
      droughtScore >= 70 ? 'critical' : droughtScore >= 50 ? 'high' : droughtScore >= 35 ? 'moderate' : 'low';

    const floodRisk: RiskSeverity =
      floodScore >= 70 ? 'critical' : floodScore >= 50 ? 'high' : floodScore >= 35 ? 'moderate' : 'low';

    // Determine primary threat
    let primaryThreat: 'drought' | 'flood' | 'compound' | 'none' = 'none';
    if (droughtScore >= 50 && floodScore >= 50) {
      primaryThreat = 'compound';
    } else if (droughtScore >= 50 && droughtScore > floodScore) {
      primaryThreat = 'drought';
    } else if (floodScore >= 50 && floodScore > droughtScore) {
      primaryThreat = 'flood';
    } else if (droughtScore >= 35 || floodScore >= 35) {
      primaryThreat = droughtScore >= floodScore ? 'drought' : 'flood';
    }

    // Prescribe silvicultural remedy based on factors
    let remedy = 'Maintain regular inspection cadence and monitor soil surface.';
    if (primaryThreat === 'drought' || (droughtScore >= 45 && droughtScore > floodScore)) {
      if (soil === 'sandy' || slope === 'steep') {
        remedy = 'Apply a thick 10cm straw/leaf mulch collar and deploy a 5L slow inverted drip bottle to sustain root moisture.';
      } else {
        remedy = 'Deep soak root zone with 8-10L water during early morning hours and construct a shallow moisture retention basin.';
      }
    } else if (primaryThreat === 'flood' || (floodScore >= 45 && floodScore > droughtScore)) {
      if (slope === 'steep') {
        remedy = 'Stake securely with bamboo bracing and construct a rock check-dam 1m upslope to divert torrential runoff.';
      } else if (soil === 'clayey' || slope === 'flat') {
        remedy = 'Excavate a 15cm radial drainage bioswale around the base to prevent stagnant ponding and root rot asphyxiation.';
      } else {
        remedy = 'Inspect soil compaction and ensure water does not accumulate over root collar.';
      }
    }

    return {
      treeId: tree.id,
      tree,
      droughtRisk,
      droughtScore,
      floodRisk,
      floodScore,
      primaryThreat,
      reasons: reasons.slice(0, 3),
      remedy,
    };
  });

  // Calculate cohort aggregates
  const highDroughtCount = treesAtRisk.filter((t) => t.droughtRisk === 'critical' || t.droughtRisk === 'high').length;
  const highFloodCount = treesAtRisk.filter((t) => t.floodRisk === 'critical' || t.floodRisk === 'high').length;
  const moderateRiskCount = treesAtRisk.filter(
    (t) =>
      (t.droughtRisk === 'moderate' || t.floodRisk === 'moderate') &&
      t.droughtRisk !== 'critical' &&
      t.droughtRisk !== 'high' &&
      t.floodRisk !== 'critical' &&
      t.floodRisk !== 'high'
  ).length;
  const safeCount = treesAtRisk.filter((t) => t.droughtRisk === 'low' && t.floodRisk === 'low').length;

  // Determine Overall Meteorological Alert Level
  let alertLevel: WeatherAlertLevel = 'optimal';
  let title = 'Optimal Meteorological Equilibrium';
  let headline = 'Current local weather conditions support steady sapling transpiration and root establishment.';
  let description = `Mild temperatures (${weather.temperature}°C) and steady rainfall (${weather.precipitationSum7d}mm 7-day total) keep soil moisture balanced across registered planting zones.`;

  if (highDroughtCount > 0 && highDroughtCount >= highFloodCount) {
    if (highDroughtCount >= trees.length * 0.35 || weather.temperature >= 36) {
      alertLevel = 'danger-drought';
      title = 'Severe Drought & Heatwave Vulnerability Alert';
      headline = `${highDroughtCount} of ${trees.length} saplings face acute desiccation under extreme temperature (${weather.temperature}°C) and negligible rainfall.`;
      description = `High atmospheric evapotranspiration (${weather.evapotranspirationEt0} mm/day) combined with ${weather.precipitationSum7d}mm 7-day precipitation threatens saplings planted in sandy soils and steep crests.`;
    } else {
      alertLevel = 'warning-drought';
      title = 'Elevated Soil Moisture Deficit Warning';
      headline = `${highDroughtCount} saplings in permeable or elevated terrain show early drought stress vulnerability.`;
      description = `Rising temperatures (${weather.temperature}°C) and drying winds require supplemental deep root hydration and protective mulching.`;
    }
  } else if (highFloodCount > 0) {
    if (highFloodCount >= trees.length * 0.35 || weather.precipitationMm >= 40 || weather.precipitationSum7d >= 120) {
      alertLevel = 'danger-flood';
      title = 'Monsoon Deluge & Flash Washout Warning';
      headline = `${highFloodCount} of ${trees.length} saplings are located in high-risk waterlogging basins or erosion-prone slope channels.`;
      description = `Heavy precipitation (${weather.precipitationMm}mm today, ${weather.precipitationSum7d}mm forecast) threatens flat clay basins with root anoxia and steep slopes with gully scouring.`;
    } else {
      alertLevel = 'warning-flood';
      title = 'Localized Waterlogging & Runoff Advisory';
      headline = `${highFloodCount} saplings located in flat depressions or drainage corridors are exposed to excess moisture.`;
      description = `Continuous showers (${weather.precipitationSum7d}mm 7-day cumulative) elevate soil saturation in low-drainage clayey zones.`;
    }
  } else if (moderateRiskCount > 0) {
    alertLevel = 'watch';
    title = 'Microclimate Vigilance Watch';
    headline = `${moderateRiskCount} saplings have moderate microclimatic sensitivity. No immediate extreme weather hazard detected.`;
    description = `Atmospheric conditions are within sustainable thresholds, but trees in steep slopes or young seedlings warrant routine field checks.`;
  }

  return {
    alertLevel,
    title,
    headline,
    description,
    highDroughtCount,
    highFloodCount,
    moderateRiskCount,
    safeCount,
    totalTrees: trees.length,
    treesAtRisk,
    meteorology: weather,
  };
}
