import GCode from '../gcode.js';

export default function slicesToGCode(slices, settings) {
  const gcode = new GCode().setSettings(settings);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (layer === 1) {
      gcode.turnFanOn();
      gcode.bottom = false;
    }

    if (slice.brim !== undefined) {
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
        const retract = !(slice.parts.length === 1 && slice.support === undefined);
        pathToGCode(gcode, part.shape, retract, retract, layer, 'outerLine');
      }
    }

    if (slice.support !== undefined) {
      pathToGCode(gcode, slice.support, true, true, layer, 'support');
    }
  }

  return gcode.getGCode();
}

function pathToGCode(gcode, shape, retract, unRetract, layer, type) {
  for (let i = 0; i < shape.paths.length; i ++) {
    const line = shape.paths[i];

    const length = shape.closed ? (line.length + 1) : line.length;
    for (let i = 0; i < length; i ++) {
      const point = line[i % line.length];

      if (i === 0) {
        // TODO
        // moveTo should impliment combing
        gcode.moveTo(point.X, point.Y, layer);

        if (unRetract) {
          gcode.unRetract();
        }
      } else {
        gcode.lineTo(point.X, point.Y, layer, type);
      }
    }
  }

  if (retract) {
    gcode.retract();
  }
}
