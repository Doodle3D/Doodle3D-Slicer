export default function generateInnerLines(slices, settings) {
  console.log("generating outer lines and inner lines");

  // need to scale up everything because of clipper rounding errors
  var scale = 100;

  var layerHeight = settings.config["layerHeight"];
  var nozzleDiameter = settings.config["nozzleDiameter"] * scale;
  var shellThickness = settings.config["shellThickness"] * scale;
  var nozzleRadius = nozzleDiameter / 2;
  var shells = Math.round(shellThickness / nozzleDiameter);

  for (var layer = 0; layer < slices.length; layer ++) {
    var slice = slices[layer];

    for (var i = 0; i < slice.parts.length; i ++) {
      var part = slice.parts[i];

      if (!part.intersect.closed) {
        continue;
      }

      // var outerLine = part.intersect.clone().scaleUp(scale).offset(-nozzleRadius);
      var outerLine = part.intersect.scaleUp(scale).offset(-nozzleRadius);

      if (outerLine.length > 0) {
        part.outerLine = outerLine;

        for (var shell = 1; shell < shells; shell += 1) {
          var offset = shell * nozzleDiameter;

          var innerLine = outerLine.offset(-offset);

          if (innerLine.length > 0) {
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
