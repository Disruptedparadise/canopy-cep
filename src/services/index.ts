export * from './treeService';
export * from './speciesService';
export * from './soilService';

import * as treeService from './treeService';
import * as speciesService from './speciesService';
import * as soilService from './soilService';

export const api = {
  trees: treeService,
  species: speciesService,
  soil: soilService,
};

export default api;
