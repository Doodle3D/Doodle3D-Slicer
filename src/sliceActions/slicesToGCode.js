import GCode from './helpers/GCode.js';
import comb from './helpers/comb.js';
import { Z_OFFSET } from '../constants.js';

const PROFILE_TYPES = ['support', 'innerShell', 'outerShell', 'innerInfill', 'outerInfill', 'brim'];

export default function slicesToGCode(slices, settings) {
  const {
    layerHeight,
    filamentThickness,
    nozzleDiameter,
    retraction,
    travel,
    combing
  } = settings;

  const gcode = new GCode(settings);
  gcode.updateLayerHeight(Z_OFFSET, nozzleDiameter, filamentThickness);

  if (settings.startCode) gcode.addGCode(settings.startCode, settings);

  const defaultProfile = {
    travelProfile: travel,
    retractionProfile: retraction
  };

  let isFirstLayer = true;
  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];
    const z = layer * layerHeight + Z_OFFSET;

    if (layer === 1) {
      gcode.updateLayerHeight(layerHeight, nozzleDiameter, filamentThickness);
      gcode.turnFanOn();
      isFirstLayer = false;
    }

    const profiles = PROFILE_TYPES.reduce((_profiles, profileType) => {
      _profiles[profileType] = {
        ...defaultProfile,
        lineProfile: isFirstLayer ? settings.firstLayer : settings[profileType]
      };
      return _profiles;
    }, {});

    if (typeof slice.brim !== 'undefined') {
      pathToGCode(null, false, gcode, slice.brim, true, true, z, profiles.brim);
    }

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.closed) {
        const outline = part.shell[0].mapToLower();

        for (let i = 0; i < part.shell.length; i ++) {
          const shell = part.shell[i];
          const isOuterShell = i === 0;

          const unRetract = isOuterShell;
          const profile = isOuterShell ? profiles.outerShell : profiles.innerShell;
          pathToGCode(outline, combing, gcode, shell, false, unRetract, z, profile);
        }

        pathToGCode(outline, combing, gcode, part.outerFill, false, false, z, profiles.outerInfill);
        pathToGCode(outline, combing, gcode, part.innerFill, true, false, z, profiles.innerInfill);
      } else {
        const retract = !(slice.parts.length === 1 && typeof slice.support === 'undefined');
        pathToGCode(null, false, gcode, part.shape, retract, retract, z, profiles.outerShell);
      }
    }

    if (typeof slice.support !== 'undefined') {
      const supportOutline = slice.supportOutline.mapToLower();
      pathToGCode(supportOutline, combing, gcode, slice.support, true, true, z, profiles.support);
    }
  }

  if (settings.endCode) gcode.addGCode(settings.endCode, settings);

  return gcode.getGCode();
}

function pathToGCode(outline, combing, gcode, shape, retract, unRetract, z, profiles) {
  const { lineProfile, travelProfile, retractionProfile } = profiles;
  const { closed } = shape;
  const paths = shape.mapToLower();

  for (let i = 0; i < paths.length; i ++) {
    const line = paths[i];

    const length = closed ? (line.length + 1) : line.length;
    for (let i = 0; i < length; i ++) {
      const point = line[i % line.length];

      if (i === 0) {
        if (combing) {
          const combPath = comb(outline, gcode._nozzlePosition, point);
          for (let i = 0; i < combPath.length; i ++) {
            const combPoint = combPath[i];
            gcode.moveTo(combPoint.x, combPoint.y, z, travelProfile);
          }
        } else {
          gcode.moveTo(point.x, point.y, z, travelProfile);
        }

        if (unRetract) {
          gcode.unRetract(retractionProfile);
        }
      } else {
        gcode.lineTo(point.x, point.y, z, lineProfile);
      }
    }
  }

  if (retract) {
    gcode.retract(retractionProfile);
  }
}
