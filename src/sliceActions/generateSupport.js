import getFillTemplate from './getFillTemplate.js';
import Paths from '../paths.js';

export default function generateSupport(slices, settings) {
  console.log("generating support");

  // need to scale up everything because of clipper rounding errors
  var scale = 100;

  var layerHeight = settings.config["layerHeight"];
  var supportGridSize = settings.config["supportGridSize"] * scale;
  var supportAcceptanceMargin = settings.config["supportAcceptanceMargin"] * scale;
  var supportMargin = settings.config["supportMargin"] * scale;
  var plateSize = settings.config["supportPlateSize"] * scale;
  var supportDistanceY = settings.config["supportDistanceY"];
  var supportDistanceLayers = Math.max(Math.ceil(supportDistanceY / layerHeight), 1);
  var nozzleDiameter = settings.config["nozzleDiameter"] * scale;

  var supportAreas = new Paths([], true);

  for (var layer = slices.length - 1 - supportDistanceLayers; layer >= 0; layer --) {
    var currentSlice = slices[layer];

    if (supportAreas.length > 0) {

      if (layer >= supportDistanceLayers) {
        var sliceSkin = slices[layer - supportDistanceLayers].getOutline();
        sliceSkin = sliceSkin;

        var supportAreasSlimmed = supportAreas.difference(sliceSkin.offset(supportMargin));
        if (supportAreasSlimmed.area() < 100.0) {
          supportAreas = supportAreas.difference(sliceSkin);
        }
        else {
          supportAreas = supportAreasSlimmed;
        }
      }


      var supportTemplate = getFillTemplate(supportAreas.bounds(), supportGridSize, true, true);
      var supportFill = supportTemplate.intersect(supportAreas);
      if (supportFill.length === 0) {
        currentSlice.support = supportAreas.clone();
      }
      else {
        currentSlice.support = supportFill;
      }
    }

    var supportSkin = slices[layer + supportDistanceLayers - 1].getOutline();

    var slice = slices[layer + supportDistanceLayers];
    for (var i = 0; i < slice.parts.length; i ++) {
      var slicePart = slice.parts[i];

      if (slicePart.intersect.closed) {
        var outerLine = slicePart.outerLine;
      }
      else {
        var outerLine = slicePart.intersect.offset(supportAcceptanceMargin);
      }

      var overlap = supportSkin.offset(supportAcceptanceMargin).intersect(outerLine);
      var overhang = outerLine.difference(overlap);

      if (overlap.length === 0 || overhang.length > 0) {
        supportAreas = supportAreas.join(overhang);
      }
    }
  }
}
