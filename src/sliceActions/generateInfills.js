import { PRECISION } from '../constants.js';
import getFillTemplate from './getFillTemplate.js';

export default function generateInfills(slices, settings) {
  let {
    layerHeight,
    innerInfill: { density },
    thickness: {
      top: topThickness,
      bottom: bottomThickness
    },
    nozzleDiameter
  } = settings;

  density /= 100;
  nozzleDiameter /= PRECISION;

  const bidirectionalInfill = density < 0.8;
  const infillGridSize = nozzleDiameter * (bidirectionalInfill ? 2 : 1) / density;

  const bottomSkinCount = Math.ceil(bottomThickness / layerHeight);
  const topSkinCount = Math.ceil(topThickness / layerHeight);
  const nozzleRadius = nozzleDiameter / 2;
  const outerFillTemplateSize = nozzleDiameter;

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    let surroundingLayer;
    if (layer - bottomSkinCount >= 0 && layer + topSkinCount < slices.length) {
      const downSkin = slices[layer - bottomSkinCount].outline;
      const upSkin = slices[layer + topSkinCount].outline;
      surroundingLayer = upSkin.intersect(downSkin);
    }

    for (let i = 0; i < slice.parts.length; i ++) {
      const even = (layer % 2 === 0);
      const part = slice.parts[i];

      if (!part.closed) continue;

      const innerShell = part.shell[part.shell.length - 1];

      if (innerShell.paths.length === 0) continue;

      const fillArea = innerShell.offset(-nozzleRadius);
      let innerFillArea;
      let outerFillArea;
      if (surroundingLayer) {
        outerFillArea = fillArea.difference(surroundingLayer).intersect(fillArea);
        innerFillArea = fillArea.difference(outerFillArea);
      } else {
        outerFillArea = fillArea;
      }

      if (innerFillArea && innerFillArea.paths.length > 0) {
        const bounds = innerFillArea.shapeBounds();
        const innerFillTemplate = getFillTemplate(bounds, infillGridSize, bidirectionalInfill || even, bidirectionalInfill || !even);

        part.innerFill.join(innerFillTemplate.intersect(innerFillArea));
      }

      if (outerFillArea.paths.length > 0) {
        const bounds = outerFillArea.shapeBounds();
        const outerFillTemplate = getFillTemplate(bounds, outerFillTemplateSize, even, !even);

        part.outerFill.join(outerFillTemplate.intersect(outerFillArea));
      }
    }
  }
}
