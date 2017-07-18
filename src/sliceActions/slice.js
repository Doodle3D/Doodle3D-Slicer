import calculateLayersIntersections from './calculateLayersIntersections.js';
import createLines from './createLines.js';
import generateInfills from './generateInfills.js';
import generateInnerLines from './generateInnerLines.js';
import generateSupport from './generateSupport.js';
import intersectionsToShapes from './intersectionsToShapes.js';
import addBrim from './addBrim.js';
import optimizePaths from './optimizePaths.js';
import shapesToSlices from './shapesToSlices.js';
import slicesToGCode from './slicesToGCode.js';
import detectOpenClosed from './detectOpenClosed.js';
import applyPrecision from './applyPrecision.js';
import removePrecision from './removePrecision.js';

export default function(geometry, settings, onProgress) {
  const totalStages = 12;
  let current = 0;
  const progressMessage = () => {
    current ++;
    postMessage({ message: 'PROGRESS', data: { done: current, total: totalStages } });
  };

  geometry.computeFaceNormals();

  // get unique lines from geometry;
  const lines = createLines(geometry, settings);
  progressMessage();

  const openClosed = detectOpenClosed(lines);
  progressMessage();

  const {
    layerIntersectionIndexes,
    layerIntersectionPoints
  } = calculateLayersIntersections(lines, settings);
  progressMessage();

  const shapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);
  progressMessage();

  applyPrecision(shapes);

  const slices = shapesToSlices(shapes, settings);
  progressMessage();

  generateInnerLines(slices, settings);
  progressMessage();
  generateInfills(slices, settings);
  progressMessage();
  generateSupport(slices, settings);
  progressMessage();
  addBrim(slices, settings);
  progressMessage();
  optimizePaths(slices, settings);
  progressMessage();
  removePrecision(slices);
  progressMessage();

  const gcode = slicesToGCode(slices, settings);
  progressMessage();

  return gcode;
}
