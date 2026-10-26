import { TreeRecord } from '../types';

export const INITIAL_TREES: TreeRecord[] = [
  {
    id: 'tree-001',
    species: 'Neem',
    planter: 'Aarav Deshmukh',
    date_planted: '2024-07-14',
    status: 'healthy',
    lat: 19.1685,
    lng: 73.2112,
    soil_type: 'loamy',
    slope: 'gentle',
    notes: 'Contour bund planting on northern slope.',
    campaign_id: 'camp-ambernath-2026',
    checkins: [
      {
        date: '2024-07-14',
        status: 'healthy',
        note: 'Sapling planted along northern contour bund with 10L initial deep watering.',
      },
      {
        date: '2024-10-22',
        status: 'healthy',
        note: 'New shoots emerged. Root leaf mulch intact; excellent foliage vigor.',
      },
      {
        date: '2025-02-15',
        status: 'healthy',
        note: 'Overwintered smoothly. Leader stem thickened with 35cm vertical growth.',
      },
    ],
    photos: [
      {
        date: '2024-07-14',
        url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
      },
      {
        date: '2025-02-15',
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-002',
    species: 'Banyan',
    planter: 'Sunita Patil',
    date_planted: '2023-08-20',
    status: 'healthy',
    lat: 19.1721,
    lng: 73.2245,
    soil_type: 'clayey',
    slope: 'flat',
    notes: 'Community grove sanctuary near village well.',
    campaign_id: 'camp-ghats-watershed',
    checkins: [
      {
        date: '2023-08-20',
        status: 'healthy',
        note: 'Planted near community well basin with protective circular stone ring.',
      },
      {
        date: '2024-03-12',
        status: 'healthy',
        note: 'Strong lateral branch canopy forming. Soil moisture retained well.',
      },
      {
        date: '2024-11-05',
        status: 'healthy',
        note: 'First aerial roots beginning to descend toward soil.',
      },
    ],
    photos: [
      {
        date: '2023-08-20',
        url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-003',
    species: 'Bamboo',
    planter: 'Kiran Shinde',
    date_planted: '2024-06-10',
    status: 'healthy',
    lat: 19.1589,
    lng: 73.2087,
    soil_type: 'sandy',
    slope: 'steep',
    notes: 'Planted along monsoon gully line to prevent bank erosion.',
    campaign_id: 'camp-ambernath-2026',
    checkins: [
      {
        date: '2024-06-10',
        status: 'healthy',
        note: 'Culm cluster positioned in steep runoff gully bed.',
      },
      {
        date: '2024-09-18',
        status: 'needs-watch',
        note: 'Heavy monsoon gully scouring exposed top roots; reinforced with rock check dam.',
      },
      {
        date: '2024-12-04',
        status: 'healthy',
        note: 'Rhizomes anchored well into silt bed. Bank erosion arrested.',
      },
    ],
    photos: [
      {
        date: '2024-06-10',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-004',
    species: 'Gulmohar',
    planter: 'Priya Joshi',
    date_planted: '2024-05-18',
    status: 'needs-watch',
    lat: 19.1623,
    lng: 73.2198,
    soil_type: 'rocky',
    slope: 'steep',
    notes: 'Wind exposure on southern crest; requires protective bamboo stake.',
    campaign_id: 'camp-ambernath-2026',
    checkins: [
      {
        date: '2024-05-18',
        status: 'healthy',
        note: 'Planted on south-facing ridge crest with compost amendment.',
      },
      {
        date: '2024-08-30',
        status: 'needs-watch',
        note: 'Severe desiccation from hot ridge winds. Foliage yellowing along margins.',
      },
      {
        date: '2024-11-19',
        status: 'needs-watch',
        note: 'Staked with protective burlap wind screen. Needs supplemental mulch and water bag.',
      },
    ],
    photos: [
      {
        date: '2024-05-18',
        url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-005',
    species: 'Vetiver Grass',
    planter: 'Ramesh Kadam',
    date_planted: '2024-09-02',
    status: 'healthy',
    lat: 19.1554,
    lng: 73.2173,
    soil_type: 'loamy',
    slope: 'gentle',
    notes: 'Dense contour barrier along terraced farm runoff ridge.',
    campaign_id: 'camp-ghats-watershed',
    checkins: [
      {
        date: '2024-09-02',
        status: 'healthy',
        note: 'Root slips planted 15cm apart on terrace bund.',
      },
      {
        date: '2024-11-20',
        status: 'healthy',
        note: 'Dense continuous hedgerow established, successfully trapping fine runoff silt.',
      },
    ],
    photos: [
      {
        date: '2024-09-02',
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-006',
    species: 'Teak',
    planter: 'Aarav Deshmukh',
    date_planted: '2024-04-10',
    status: 'not-surviving',
    lat: 19.1512,
    lng: 73.2291,
    soil_type: 'clayey',
    slope: 'steep',
    notes: 'Experimental timber test on lower waterlogged terrace.',
    checkins: [
      {
        date: '2024-04-10',
        status: 'healthy',
        note: 'Sapling planted in lower terrace furrow during pre-monsoon prep.',
      },
      {
        date: '2024-07-28',
        status: 'needs-watch',
        note: 'Severe drainage failure in heavy clay after 12 straight rainy days.',
      },
      {
        date: '2024-10-15',
        status: 'not-surviving',
        note: 'Root rot from compacted saturated clay. Stem completely dried and hollow.',
      },
    ],
    photos: [
      {
        date: '2024-04-10',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-007',
    species: 'Peepal',
    planter: 'Sunita Patil',
    date_planted: '2024-06-25',
    status: 'healthy',
    lat: 19.1764,
    lng: 73.2185,
    soil_type: 'rocky',
    slope: 'steep',
    notes: 'Planted on rocky hillside outcrop to anchor fractured bedrock.',
    campaign_id: 'camp-ambernath-2026',
    checkins: [
      {
        date: '2024-06-25',
        status: 'healthy',
        note: 'Root ball nestled into natural limestone fissure.',
      },
      {
        date: '2024-12-10',
        status: 'healthy',
        note: 'Vigorous heart-shaped foliage. Taproots penetrating deep into crevices.',
      },
    ],
    photos: [
      {
        date: '2024-06-25',
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tree-008',
    species: 'Mango',
    planter: 'Priya Joshi',
    date_planted: '2024-07-05',
    status: 'needs-watch',
    lat: 19.1648,
    lng: 73.2315,
    soil_type: 'sandy',
    slope: 'flat',
    notes: 'Agroforestry border tree near orchard fringe.',
    campaign_id: 'camp-kalyan-commons',
    checkins: [
      {
        date: '2024-07-05',
        status: 'healthy',
        note: 'Grafted Alphonso sapling planted with leaf mulch perimeter.',
      },
      {
        date: '2024-10-30',
        status: 'needs-watch',
        note: 'Rapid drainage in sandy soil causing water stress between irrigation cycles.',
      },
    ],
    photos: [
      {
        date: '2024-07-05',
        url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
