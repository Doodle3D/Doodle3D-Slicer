import GCode from './helpers/GCode.js';

const PROFILE_TYPES = ['support', 'innerShell', 'outerShell', 'innerInfill', 'outerInfill', 'brim'];

export default function slicesToGCode(slices, settings) {
  const {
    layerHeight,
    filamentThickness,
    nozzleDiameter,
    travelSpeed,
    retraction,
    travel
  } = settings;

  const filamentSurfaceArea = Math.pow((filamentThickness / 2), 2) * Math.PI;
  const lineSurfaceArea = nozzleDiameter * layerHeight;
  const nozzleToFilamentRatio = lineSurfaceArea / filamentSurfaceArea;

  const gcode = new GCode(nozzleToFilamentRatio);

  const defaultProfile = {
    travelProfile: travel,
    retractionProfile: retraction
  };

  let isFirstLayer = true;
  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];
    const z = layer * layerHeight + 0.2;

    if (layer === 1) {
      gcode.turnFanOn();
      isFirstLayer = false;
    }

    const profiles = PROFILE_TYPES.reduce((profiles, profileType) => {
      profiles[profileType] = {
        ...defaultProfile,
        lineProfile: isFirstLayer ? settings.firstLayer : settings[profileType]
      };
      return profiles;
    }, {});

    if (typeof slice.brim !== 'undefined') {
      pathToGCode(gcode, slice.brim, true, true, z, profiles.brim);
    }

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.closed) {
        for (let i = 0; i < part.shell.length; i ++) {
          const shell = part.shell[i];
          const isOuterShell = i === 0;

          const unRetract = isOuterShell;
          const profile = isOuterShell ? profiles.outerShell : profiles.innerShell;
          pathToGCode(gcode, shell, false, unRetract, z, profile);
        }

        pathToGCode(gcode, part.outerFill, false, false, z, profiles.outerInfill);
        pathToGCode(gcode, part.innerFill, true, false, z, profiles.innerInfill);
      } else {
        const retract = !(slice.parts.length === 1 && typeof slice.support === 'undefined');
        pathToGCode(gcode, part.shape, retract, retract, z, profiles.outerShell);
      }
    }

    if (typeof slice.support !== 'undefined') {
      pathToGCode(gcode, slice.support, true, true, z, profiles.support);
    }
  }

  return gcode.getGCode();
}

function pathToGCode(gcode, shape, retract, unRetract, z, { lineProfile, travelProfile, retractionProfile }) {
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
        gcode.moveTo(point.x, point.y, z, travelProfile);

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
