import { SoilTip } from '../types';

export const SOIL_TIPS_DATA: SoilTip[] = [
  {
    id: 'tip-01',
    index: '01',
    title: 'Composting Organic Biomass',
    category: 'Microbial Health & Organic Matter',
    paragraph:
      'Healthy soil relies on an abundant community of mycorrhizal fungi, earthworms, and aerobic bacteria. Returning leaf litter, farm residues, and kitchen greens directly restores humus, unlocking locked trace minerals and improving crumb soil structure.',
    actions: [
      'Maintain a 30:1 carbon-to-nitrogen ratio using brown dry leaves and green clippings.',
      'Aerate the pile bi-weekly to sustain aerobic fermentation and eliminate pathogens.',
      'Incorporate 2–3 inches of mature dark compost into tree drip lines before monsoon planting.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1585336261026-8f359c11867c?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Dark, rich organic compost and humus teeming with beneficial soil organisms',
  },
  {
    id: 'tip-02',
    index: '02',
    title: 'Mulching Bare Soil',
    category: 'Moisture Retention & Thermal Shield',
    paragraph:
      'Unshielded topsoil can exceed 48°C under direct sunlight, vaporizing subterranean moisture and sterilizing fragile soil biology. A generous organic mulch blanket stabilizes ground temperatures, suppresses weeds, and reduces irrigation demands by up to 60%.',
    actions: [
      'Apply a 3 to 4-inch layer of coarse woodchips, straw, or crushed sugarcane bagasse.',
      'Keep mulch pulled back 3 inches from tree trunks to prevent fungal collar rot.',
      'Replenish mulch carpets at the end of the monsoon to preserve residual profile moisture.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Coarse organic bark and woodchip mulch protective ground blanket',
  },
  {
    id: 'tip-03',
    index: '03',
    title: 'Slowing Runoff on Slopes',
    category: 'Erosion Control & Hydrology',
    paragraph:
      'High-velocity rainfall dislodges loose silt and carries nutrient-dense topsoil into drainage gullies. By sculpting contour swales, bunds, and vegetative check dams, water is slowed, spread, and encouraged to sink deep into groundwater aquifers.',
    actions: [
      'Survey precise contour lines with an A-frame before digging swales or planting ridges.',
      'Plant vetiver grass or perennial shrubs along terrace edges to catch silt and bind soil.',
      'Construct rock check dams in active hillside gullies to decelerate monsoon torrents.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Contour swales and terraced hillside landscape engineered for water infiltration',
  },
  {
    id: 'tip-04',
    index: '04',
    title: 'Crop & Canopy Species Rotation',
    category: 'Nutrient Cycling & Pest Break',
    paragraph:
      'Monocultures deplete specific root-zone nutrients and create localized disease reservoirs. Interplanting leguminous nitrogen fixers with deep-taprooted timber trees taps varied soil strata and naturally replenishes atmospheric nitrogen into the root zone.',
    actions: [
      'Pair heavy nitrogen consumers with leguminous nurse species such as Gliricidia or Subabul.',
      'Alternate seasonal shallow-rooted cover crops with deep-rooting native perennials.',
      'Avoid planting trees belonging to the same botanical family consecutively in the same pit.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Diverse interplanted agroforestry field with multiple canopy tiers and cover crops',
  },
  {
    id: 'tip-05',
    index: '05',
    title: 'Keeping Soil Permanently Covered',
    category: 'Armor & Soil Architecture',
    paragraph:
      'Nature never leaves bare soil uncovered. Living roots pump liquid carbon exudates into the soil day and night, sustaining microbes and gluing silt particles into stable aggregates that resist wind deflation and torrential rain impact.',
    actions: [
      'Sow multi-species green manures (sunn hemp, cowpea, millet) during pre-monsoon showers.',
      'Encourage low-growing native clover or creeping ground covers between tree sapling rows.',
      'Never till or blade clear land prior to plantation; practice minimum soil disturbance.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Dense living green cover crop and native grasses protecting soil from rain impact',
  },
  {
    id: 'tip-06',
    index: '06',
    title: 'Testing Soil Before Amending',
    category: 'Precision Agronomy & Balance',
    paragraph:
      'Blindly adding chemical fertilizers or lime can shift soil pH, lock up phosphorus, or induce salinity. Systematic soil testing identifies precise macronutrient deficiencies, cation exchange capacity, and organic carbon percentage before planting.',
    actions: [
      'Sample soil in a zigzag pattern across the parcel at both 0–15 cm and 15–30 cm depths.',
      'Check pH levels: target 6.2–7.2 for general agroforestry; adjust acidic soils with dolomite.',
      'Benchmark soil organic carbon (SOC); aim for >1.0% through perennial green biomass additions.',
    ],
    image_url:
      'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1000&q=80',
    image_alt: 'Agronomist taking soil core sample in the field for nutrient testing',
  },
];
