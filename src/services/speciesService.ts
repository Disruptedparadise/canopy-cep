import { Species } from '../types';
import { SPECIES_DATA } from '../data/speciesData';

// Simulated network delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch list of all tree species
 * Ready to be swapped with: const res = await fetch('/api/species'); return res.json();
 */
export async function getSpecies(simulateDelayMs = 0): Promise<Species[]> {
  if (simulateDelayMs > 0) {
    await delay(simulateDelayMs);
  }
  return JSON.parse(JSON.stringify(SPECIES_DATA));
}

/**
 * Fetch single species by ID or common name
 */
export async function getSpeciesById(idOrName: string, simulateDelayMs = 0): Promise<Species | null> {
  if (simulateDelayMs > 0) {
    await delay(simulateDelayMs);
  }
  const match = SPECIES_DATA.find(
    (s) =>
      s.id.toLowerCase() === idOrName.toLowerCase() ||
      s.name.toLowerCase() === idOrName.toLowerCase()
  );
  if (!match) return null;
  return JSON.parse(JSON.stringify(match));
}
