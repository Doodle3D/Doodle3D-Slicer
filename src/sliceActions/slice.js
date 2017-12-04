import * as THREE from 'three';
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
import detectOpenClosed from './detectOpenClosed.js';
import applyPrecision from './applyPrecision.js';
// import removePrecision from './removePrecision.js';

export default function(settings, geometry, constructLinePreview, onProgress) {
  const totalStages = 12;
  let current = -1;
  const updateProgress = (action) => {
    current ++;
    if (typeof onProgress !== 'undefined') {
      onProgress({
        progress: {
          done: current,
          total: totalStages,
          action
        }
      });
    }
  };

  geometry.computeFaceNormals();

  // get unique lines from geometry;
  updateProgress('Constructing unique lines from geometry');
  const lines = createLines(geometry, settings);

  updateProgress('Detecting open vs closed shapes');
  detectOpenClosed(lines);

  updateProgress('Calculating layer intersections');
  const {
    layerIntersectionIndexes,
    layerIntersectionPoints
  } = calculateLayersIntersections(lines, settings);

  updateProgress('Constructing shapes from intersections');
  const shapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);

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

  // removePrecision(slices);

  updateProgress('Constructing gcode');
  const gcode = slicesToGCode(slices, settings);

  updateProgress('Finished');

  if (constructLinePreview) gcode.linePreview = createGcodeGeometry(gcode.gcode);
  gcode.gcode = gcodeToString(gcode.gcode);
  return gcode;
}

function gcodeToString(gcode) {
  const currentValues = {};
  return gcode.reduce((string, command) => {
    let first = true;
    for (const action in command) {
      const value = command[action];
      const currentValue = currentValues[action];
      if (first) {
        string += action + value;
        first = false;
      } else if (currentValue !== value) {
        string += ` ${action}${value}`;
        currentValues[action] = value;
      }
    }
    string += '\n';
    return string;
  }, '');
}

const MAX_SPEED = 100 * 60;
const COLOR = new THREE.Color();
function createGcodeGeometry(gcode) {
  const positions = [];
  const colors = [];

  let lastPoint = [0, 0, 0];
  for (let i = 0; i < gcode.length; i ++) {
    const { G, F, X, Y, Z } = gcode[i];

    if (X || Y || Z) {
      if (G === 1) {
        positions.push(lastPoint.Y, lastPoint.Z, lastPoint.X);
        positions.push(Y, Z, X);

        const color = (G === 0) ? COLOR.setHex(0x00ff00) : COLOR.setHSL(F / MAX_SPEED, 0.5, 0.5);
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }
      lastPoint = { X, Y, Z };
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

  const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
  const linePreview = new THREE.LineSegments(geometry, material);

  return linePreview;
}
