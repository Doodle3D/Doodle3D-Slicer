const scale = 100;
const offsetOptions = {
  jointType: 'jtSquare',
  endType: 'etClosedPolygon',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function generateInnerLines(slices, settings) {
  console.log("generating outer lines and inner lines");

  // need to scale up everything because of clipper rounding errors
  let { layerHeight, nozzleDiameter, shellThickness } = settings.config;
  nozzleDiameter *= scale;
  shellThickness *= scale;
  var nozzleRadius = nozzleDiameter / 2;
  var shells = Math.round(shellThickness / nozzleDiameter);

  for (var layer = 0; layer < slices.length; layer ++) {
    var slice = slices[layer];

    for (var i = 0; i < slice.parts.length; i ++) {
      var part = slice.parts[i];

      if (!part.shape.closed) continue;

      // var outerLine = part.shape.clone().scaleUp(scale).offset(-nozzleRadius);
      var outerLine = part.shape.scaleUp(scale).offset(-nozzleRadius, offsetOptions);


      if (outerLine.paths.length > 0) {
        part.outerLine.join(outerLine);

        for (var shell = 1; shell < shells; shell += 1) {
          var offset = shell * nozzleDiameter;

          var innerLine = outerLine.offset(-offset, offsetOptions);

          if (innerLine.paths.length > 0) {
            part.innerLines.push(innerLine);
          }
          else {
            break;
          }
        }
      }
    }
  }
}
