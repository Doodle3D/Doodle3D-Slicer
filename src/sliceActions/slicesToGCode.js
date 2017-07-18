import GCode from '../GCode.js';

export default function slicesToGCode(slices, settings) {
  const gcode = new GCode(settings);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (layer === 1) {
      gcode.turnFanOn();
      gcode.bottom = false;
    }

    if (typeof slice.brim !== 'undefined') {
      pathToGCode(gcode, slice.brim, true, true, layer, 'brim');
    }

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.shape.closed) {
        pathToGCode(gcode, part.outerLine, false, true, layer, 'outerLine');

        for (let i = 0; i < part.innerLines.length; i ++) {
          const innerLine = part.innerLines[i];
          pathToGCode(gcode, innerLine, false, false, layer, 'innerLine');
        }

        pathToGCode(gcode, part.fill, true, false, layer, 'fill');
      } else {
        const retract = !(slice.parts.length === 1 && typeof slice.support === 'undefined');
        pathToGCode(gcode, part.shape, retract, retract, layer, 'outerLine');
      }
    }

    if (typeof slice.support !== 'undefined') {
      pathToGCode(gcode, slice.support, true, true, layer, 'support');
    }
  }

  return gcode.getGCode();
}

function pathToGCode(gcode, shape, retract, unRetract, layer, type) {
  const { closed } = shape;
  const paths = shape.mapToLower();

  for (let i = 0; i < paths.length; i ++) {
    const line = paths[i];

    const length = closed ? (line.length + 1) : line.length;
    for (let i = 0; i < length; i ++) {
      const point = line[i % line.length];

      if (i === 0) {
        // TODO
        // moveTo should impliment combing
        gcode.moveTo(point.x, point.y, layer);

        if (unRetract) {
          gcode.unRetract();
        }
      } else {
        gcode.lineTo(point.x, point.y, layer, type);
      }
    }
  }

  if (retract) {
    gcode.retract();
  }
}
