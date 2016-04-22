import getFillTemplate from './getFillTemplate.js';
import Shape from 'Doodle3D/clipper-js';

const scale = 100;

export default function generateInfills(slices, settings) {
  console.log("generating infills");

  let {
    layerHeight,
    fillGridSize,
    bottomThickness,
    topThickness,
    nozzleDiameter,
    infillOverlap
  } = settings.config;

  fillGridSize *= scale;
  nozzleDiameter *= scale;
  infillOverlap *= scale;

  const bottomSkinCount = Math.ceil(bottomThickness/layerHeight);
  const topSkinCount = Math.ceil(topThickness/layerHeight);
  const nozzleRadius = nozzleDiameter / 2;
  const hightemplateSize = Math.sqrt(2 * Math.pow(nozzleDiameter, 2));

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    let surroundingLayer;
    if (layer - bottomSkinCount >= 0 && layer + topSkinCount < slices.length) {
      const downSkin = slices[layer - bottomSkinCount].getOutline();
      const upSkin = slices[layer + topSkinCount].getOutline();
      surroundingLayer = upSkin.intersect(downSkin);
    }

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (!part.shape.closed) {
        continue;
      }

      const outerLine = part.outerLine;

      if (outerLine.paths.length > 0) {
        const inset = (part.innerLines.length > 0) ? part.innerLines[part.innerLines.length - 1] : outerLine;

        const fillArea = inset.offset(-nozzleRadius);
        let lowFillArea;
        let highFillArea;
        if (surroundingLayer) {
          highFillArea = fillArea.difference(surroundingLayer);

          if (infillOverlap > 0) {
            highFillArea = highFillArea.offset(infillOverlap);
          }

          highFillArea = highFillArea.intersect(fillArea);

          lowFillArea = fillArea.difference(highFillArea);
        }
        else {
          highFillArea = fillArea;
        }

        if (lowFillArea && lowFillArea.paths.length > 0) {
          const bounds = lowFillArea.shapeBounds();
          const lowFillTemplate = getFillTemplate(bounds, fillGridSize, true, true);

          part.fill.join(lowFillTemplate.intersect(lowFillArea));
        }

        if (highFillArea.paths.length > 0) {
          const bounds = highFillArea.shapeBounds();
          const even = (layer % 2 === 0);
          const highFillTemplate = getFillTemplate(bounds, hightemplateSize, even, !even);

          part.fill.join(highFillTemplate.intersect(highFillArea));
        }
      }
    }
  }
}
