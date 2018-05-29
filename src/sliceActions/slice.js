import calculateLayersIntersections from './calculateLayersIntersections.js';
import createLines from './createLines.js';
import generateInfills from './generateInfills.js';
import generateInnerLines from './generateInnerLines.js';
import generateOutlines from './generateOutlines.js';
import generateSupport from './generateSupport.js';
import intersectionsToShapes from './intersectionsToShapes.js';
import addBrim from './addBrim.js';
import optimizePaths from './optimizePaths.js';
import shapesToSlices from './shapesToSlices.js';
import slicesToGCode from './slicesToGCode.js';
import applyPrecision from './applyPrecision.js';
import { hslToRgb } from './helpers/color.js';
import removePrecision from './removePrecision.js';

export default function slice(settings, geometry, openObjectIndexes, constructLinePreview, onProgress) {
  const total = 11;
  let done = -1;
  const updateProgress = action => {
    done ++;
    if (onProgress) onProgress({ progress: { done, total, action } });
  };

  updateProgress('Constructing unique lines from geometry');
  const { lines, faces } = createLines(geometry, settings);

  updateProgress('Calculating layer intersections');
  const { layerPoints, layerFaceIndexes } = calculateLayersIntersections(lines, settings);

  updateProgress('Constructing shapes from intersections');
  const shapes = intersectionsToShapes(layerPoints, layerFaceIndexes, faces, openObjectIndexes, settings);

  applyPrecision(shapes);

  updateProgress('Constructing slices from shapes');
  const slices = shapesToSlices(shapes, settings);

  updateProgress('Generating inner lines');
  generateInnerLines(slices, settings);
  updateProgress('Generating out lines');
  generateOutlines(slices, settings);
  updateProgress('Generating infills');
  generateInfills(slices, settings);
  updateProgress('Generating support');
  generateSupport(slices, settings);
  updateProgress('Adding brim');
  addBrim(slices, settings);
  updateProgress('Optimizing paths');
  optimizePaths(slices, settings);

  removePrecision(slices);

  updateProgress('Constructing gcode');
  const gcode = slicesToGCode(slices, settings);

  updateProgress('Finished');

  if (constructLinePreview) gcode.linePreview = createGcodeGeometry(gcode.gcode);

  gcode.gcode = new Blob([gcodeToString(gcode.gcode)], { type: 'text/plain' });

  return gcode;
}

const PRECISION = 1000;
function toFixedTrimmed(value) {
  return (Math.round(value * PRECISION) / PRECISION).toString();
}

function gcodeToString(gcode) {
  const currentValues = {};
  return gcode.reduce((string, command) => {
    if (typeof command === 'string') {
      string += command;
    } else {
      let first = true;
      for (const action in command) {
        const value = toFixedTrimmed(command[action]);
        const currentValue = currentValues[action];
        if (first) {
          string += `${action}${value}`;
          first = false;
        } else if (currentValue !== value) {
          string += ` ${action}${value}`;
          currentValues[action] = value;
        }
      }
    }
    string += '\n';
    return string;
  }, '');
}

const MAX_SPEED = 100 * 60;
function createGcodeGeometry(gcode) {
  const positions = [];
  const colors = [];

  let lastPoint = [0, 0, 0];
  for (let i = 0; i < gcode.length; i ++) {
    const command = gcode[i];
    if (typeof command === 'string') continue;

    const { G, F, X, Y, Z } = command;

    if (X || Y || Z) {
      if (G === 1) {
        positions.push(lastPoint.Y, lastPoint.Z, lastPoint.X);
        positions.push(Y, Z, X);

        const color = (G === 0) ? [0, 1, 0] : hslToRgb(F / MAX_SPEED, 0.5, 0.5);
        colors.push(...color, ...color);
      }
      lastPoint = { X, Y, Z };
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors)
  };
}
