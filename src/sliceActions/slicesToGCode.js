import GCode from '../gcode.js';

export default function slicesToGCode(slices, settings) {
  var gcode = new GCode().setSettings(settings);

  function pathToGCode (path, retract, unRetract, type) {

    for (var i = 0; i < path.length; i ++) {
      var shape = path[i];

      var length = path.closed ? (shape.length + 1) : shape.length;

      for (var j = 0; j < length; j ++) {
        var point = shape[j % shape.length];

        if (j === 0) {
          // TODO
          // moveTo should impliment combing
          gcode.moveTo(point.X, point.Y, layer);

          if (unRetract) {
            gcode.unRetract();
          }
        }
        else {
          gcode.lineTo(point.X, point.Y, layer, type);
        }
      }
    }

    if (retract) {
      gcode.retract();
    }
  }

  for (var layer = 0; layer < slices.length; layer ++) {
    var slice = slices[layer];

    if (layer === 1) {
      gcode.turnFanOn();
      gcode.bottom = false;
    }

    if (slice.brim !== undefined) {
      pathToGCode(slice.brim, true, true, "brim");
    }

    for (var i = 0; i < slice.parts.length; i ++) {
      var part = slice.parts[i];

      if (part.intersect.closed) {
        pathToGCode(part.outerLine, false, true, "outerLine");

        for (var j = 0; j < part.innerLines.length; j ++) {
          var innerLine = part.innerLines[j];
          pathToGCode(innerLine, false, false, "innerLine");
        }

        pathToGCode(part.fill, true, false, "fill");
      }
      else {
        var retract = !(slice.parts.length === 1 && slice.support === undefined);
        pathToGCode(part.intersect, retract, retract, "outerLine");
      }
    }

    if (slice.support !== undefined) {
      pathToGCode(slice.support, true, true, "support");
    }
  }

  return gcode.getGCode();
}
