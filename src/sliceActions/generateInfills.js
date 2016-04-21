import getFillTemplate from './getFillTemplate.js';
import Shape from 'Doodle3D/clipper-js';

const scale = 100;

export default function generateInfills(slices, settings) {
  console.log("generating infills");

  // need to scale up everything because of clipper rounding errors

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

  var bottomSkinCount = Math.ceil(bottomThickness/layerHeight);
  var topSkinCount = Math.ceil(topThickness/layerHeight);
  var nozzleRadius = nozzleDiameter / 2;
  var hightemplateSize = Math.sqrt(2 * Math.pow(nozzleDiameter, 2));

  for (var layer = 0; layer < slices.length; layer ++) {
    var slice = slices[layer];

    if (layer - bottomSkinCount >= 0 && layer + topSkinCount < slices.length) {
      var downSkin =  slices[layer - bottomSkinCount].getOutline();
      var upSkin = slices[layer + topSkinCount].getOutline();
      var surroundingLayer = upSkin.intersect(downSkin);
    }
    else {
      var surroundingLayer = false;
    }

    for (var i = 0; i < slice.parts.length; i ++) {
      var part = slice.parts[i];

      if (!part.shape.closed) {
        continue;
      }

      var outerLine = part.outerLine;

      if (outerLine.length > 0) {
        var inset = (part.innerLines.length > 0) ? part.innerLines[part.innerLines.length - 1] : outerLine;

        var fillArea = inset.offset(-nozzleRadius);
        var lowFillArea = false;
        if (surroundingLayer) {
          var highFillArea = fillArea.difference(surroundingLayer);

          if (infillOverlap > 0) {
            highFillArea = highFillArea.offset(infillOverlap);
          }

          highFillArea = highFillArea.intersect(fillArea);

          var lowFillArea = fillArea.difference(highFillArea);
        }
        else {
          var highFillArea = fillArea;
        }

        var fill = new Shape([], false);

        if (lowFillArea && lowFillArea.length > 0) {
          var bounds = lowFillArea.bounds();
          var lowFillTemplate = getFillTemplate(bounds, fillGridSize, true, true);

          part.fill.join(lowFillTemplate.intersect(lowFillArea));
        }

        if (highFillArea.length > 0) {
          var bounds = highFillArea.bounds();
          var even = (layer % 2 === 0);
          var highFillTemplate = getFillTemplate(bounds, hightemplateSize, even, !even);

          part.fill.join(highFillTemplate.intersect(highFillArea));
        }
      }
    }
  }
}
