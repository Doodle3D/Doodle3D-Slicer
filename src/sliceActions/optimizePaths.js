import THREE from 'three.js';

export default function optimizePaths(slices, settings) {
  console.log("opimize paths");

  // need to scale up everything because of clipper rounding errors
  var scale = 100;

  var brimOffset = settings.config["brimOffset"] * scale;

  var start = new THREE.Vector2(0, 0);

  for (var layer = 0; layer < slices.length; layer ++) {
    var slice = slices[layer];

    if (layer === 0) {
      slice.brim = slice.getOutline().offset(brimOffset);
    }

    start = slice.optimizePaths(start);

    for (var i = 0; i < slice.parts.length; i ++) {
      var part = slice.parts[i];

      if (part.intersect.closed) {
        part.outerLine.scaleDown(scale);
        for (var j = 0; j < part.innerLines.length; j ++) {
          var innerLine = part.innerLines[j];
          innerLine.scaleDown(scale);
        }
        part.fill.scaleDown(scale);
      }
    }

    if (slice.support !== undefined) {
      slice.support.scaleDown(scale);
    }
    if (slice.brim !== undefined) {
      slice.brim.scaleDown(scale);
    }
  }
}
