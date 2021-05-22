import getFillTemplate from './getFillTemplate.js';
import Shape from '@doodle3d/clipper-js';
import { PRECISION } from '../constants.js';

const PRECISION_SQUARED = Math.pow(PRECISION, 2);

export default function generateSupport(slices, settings) {
  if (!settings.support.enabled) return;

  let {
    layerHeight,
    support: { density, margin, minArea, distanceY },
    nozzleDiameter
  } = settings;

  density /= 100;
  margin /= PRECISION;
  nozzleDiameter /= PRECISION;

  const infillGridSize = nozzleDiameter * 2 / density;
  const supportDistanceLayers = Math.max(Math.ceil(distanceY / layerHeight), 1);

  let supportArea = new Shape([], true);

  for (let layer = slices.length - 1 - supportDistanceLayers; layer >= 0; layer --) {
    const currentLayer = slices[layer + supportDistanceLayers - 1];
    const upSkin = slices[layer + supportDistanceLayers];
    const downSkin = slices[layer - supportDistanceLayers];

    const neededSupportArea = upSkin.outline.difference(currentLayer.outline.offset(margin));

    if (neededSupportArea.totalArea() * PRECISION_SQUARED > minArea) supportArea = supportArea.union(neededSupportArea);
    if (downSkin) supportArea = supportArea.difference(downSkin.outline.offset(margin));

    const bounds = supportArea.shapeBounds();
    const innerFillTemplate = getFillTemplate(bounds, infillGridSize, true, true);

    slices[layer].support = supportArea.clone().join(supportArea.intersect(innerFillTemplate));
    slices[layer].supportOutline = supportArea;
  }
}
