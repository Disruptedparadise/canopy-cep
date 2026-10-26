import { SoilTip } from '../types';
import { SOIL_TIPS_DATA } from '../data/soilTipsData';

export type { SoilTip };

// Simulated network delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all curated soil health restoration tips
 * Ready to be swapped with: const res = await fetch('/api/soil-tips'); return res.json();
 */
export async function getSoilTips(simulateDelayMs = 0): Promise<SoilTip[]> {
  if (simulateDelayMs > 0) {
    await delay(simulateDelayMs);
  }
  return JSON.parse(JSON.stringify(SOIL_TIPS_DATA));
}

/**
 * Fetch specific tip by ID
 */
export async function getSoilTipById(id: string, simulateDelayMs = 0): Promise<SoilTip | null> {
  if (simulateDelayMs > 0) {
    await delay(simulateDelayMs);
  }
  const match = SOIL_TIPS_DATA.find((t) => t.id === id);
  if (!match) return null;
  return JSON.parse(JSON.stringify(match));
}
