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
import removePrecision from './removePrecision.js';

export default function(geometry, settings, onProgress) {
  const totalStages = 11;
  let current = -1;
  const updateProgress = (action) => {
    current ++;
    if (onProgress) onProgress({ done: current, total: totalStages, action });
  };

  geometry.computeFaceNormals();

  // get unique lines from geometry;
  updateProgress('Constructing unique lines from geometry');
  const lines = createLines(geometry, settings);

  updateProgress('Detecting open vs closed shapes');
  const openClosed = detectOpenClosed(lines);

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

  removePrecision(slices);

  updateProgress('Constructing gcode');
  const gcode = slicesToGCode(slices, settings);

  updateProgress('Finished');

  return gcode;
}
