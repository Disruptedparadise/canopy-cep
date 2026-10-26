export interface Species {
  id: string;
  name: string;
  scientific_name: string;
  soil_types: string[];
  water_need: 'low' | 'medium' | 'high';
  climate_zones: string[];
  purpose: string[];
  growth_rate: 'slow' | 'moderate' | 'fast';
  mature_height_m: number;
  planting_season: string;
  care_instructions: string;
  image_url: string;
}

export type TreeStatus = 'healthy' | 'needs-watch' | 'not-surviving';

export type SlopeType = 'flat' | 'gentle' | 'steep';

export interface Checkin {
  id?: string;
  date: string;
  status: TreeStatus;
  note: string;
}

export interface TreePhoto {
  date: string;
  url: string;
}

export interface Campaign {
  campaign_id: string;
  name: string;
  description: string;
  organizer: string;
  area_name: string;
  start_date: string;
  end_date?: string; // optional — ongoing if blank
  goal_tree_count: number;
  focus_species_ids?: string[];
}

export interface TreeRecord {
  id: string; // maps to tree_id in Supabase
  species_id?: string;
  species: string; // maps to species_name in Supabase
  planter: string; // maps to planter_name in Supabase
  date_planted: string;
  status: TreeStatus;
  lat: number;
  lng: number;
  soil_type: string;
  slope: SlopeType;
  checkins: Checkin[];
  photos: TreePhoto[];
  notes?: string;
  user_id?: string | null; // Supabase auth user UUID
  campaign_id?: string | null; // optional link to a Campaign
}

export interface SoilTip {
  id: string;
  index: string;
  title: string;
  category: string;
  paragraph: string;
  actions: string[];
  image_url: string;
  image_alt: string;
}
