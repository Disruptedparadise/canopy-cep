import { Campaign } from '../types';

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    campaign_id: 'camp-ambernath-2026',
    name: 'Ambernath Slope Restoration 2026',
    description:
      'High-gradient ridge stabilization initiative targeting monsoon runoff corridors along the eastern Sahyadri escarpment.',
    organizer: 'Watershed Canopy Trust',
    area_name: 'Eastern Ridge & Ambernath Slopes',
    start_date: '2026-01-10',
    end_date: '2026-10-31',
    goal_tree_count: 25,
    focus_species_ids: ['neem', 'peepal', 'banyan', 'gulmohar'],
  },
  {
    campaign_id: 'camp-ghats-watershed',
    name: 'Western Ghats Riparian Buffer Initiative',
    description:
      'Riverbank and streamway ecological buffer planting to arrest alluvial erosion and create shade corridors for local aquatic habitats.',
    organizer: 'Dr. Maya Sen (Steward Collective)',
    area_name: 'Ulhas River Tributary Corridor',
    start_date: '2025-06-01',
    // ongoing — end_date is omitted
    goal_tree_count: 20,
    focus_species_ids: ['bamboo', 'jamun', 'arjun', 'amla'],
  },
  {
    campaign_id: 'camp-kalyan-commons',
    name: 'Kalyan Community Agroforestry Commons',
    description:
      'Community grove and food forest establishment prioritizing deep-rooting native fruit and medicinal trees on communal terrace lands.',
    organizer: 'Kalyan Gram Panchayat & Volunteers',
    area_name: 'Kalyan Foothills Community Land',
    start_date: '2024-05-15',
    end_date: '2025-12-31',
    goal_tree_count: 15,
    focus_species_ids: ['mango', 'amla', 'tamarind', 'jackfruit'],
  },
];
