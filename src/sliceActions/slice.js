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

export default function(geometry, settings) {
  geometry.mergeVertices();
  geometry.computeFaceNormals();

  // get unique lines from geometry;
  const openClosed = detectOpenClosed(geometry);
  const lines = createLines(geometry, settings, openClosed);

  const {
    layerIntersectionIndexes,
    layerIntersectionPoints
  } = calculateLayersIntersections(lines, settings);

  const shapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);

  applyPrecision(shapes);

  const slices = shapesToSlices(shapes, settings);

  generateInnerLines(slices, settings);
  generateInfills(slices, settings);
  generateSupport(slices, settings);
  addBrim(slices, settings);
  optimizePaths(slices, settings);
  removePrecision(slices);

  const gcode = slicesToGCode(slices, settings);

  return gcode;
}
