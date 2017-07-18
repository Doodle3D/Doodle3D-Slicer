import calculateLayersIntersections from 'src/sliceActions/calculateLayersIntersections.js';
import createLines from 'src/sliceActions/createLines.js';
import generateInfills from 'src/sliceActions/generateInfills.js';
import generateInnerLines from 'src/sliceActions/generateInnerLines.js';
import generateSupport from 'src/sliceActions/generateSupport.js';
import intersectionsToShapes from 'src/sliceActions/intersectionsToShapes.js';
import addBrim from 'src/sliceActions/addBrim.js';
import optimizePaths from 'src/sliceActions/optimizePaths.js';
import shapesToSlices from 'src/sliceActions/shapesToSlices.js';
import slicesToGCode from 'src/sliceActions/slicesToGCode.js';
import applyPrecision from 'src/sliceActions/applyPrecision.js';
import removePrecision from 'src/sliceActions/removePrecision.js';

export default function generateRawData(geometry, settings) {
  const rawData = {};

  const lines = createLines(geometry, settings);

  const {
    layerIntersectionIndexes,
    layerIntersectionPoints
  } = calculateLayersIntersections(lines, settings);

  rawData.layerIntersectionPoints = layerIntersectionPoints
    .map(intersectionPoints => intersectionPoints.map(intersectionPoint => intersectionPoint.clone()));

  const layerShapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);

  rawData.layerShapes = layerShapes
    .map(({ closedShapes, openShapes }) => ({
      closedShapes: closedShapes.map(closedShape => closedShape.map(vector => vector.clone())),
      openShapes: openShapes.map(openShape => openShape.map(vector => vector.clone()))
    }));


  applyPrecision(layerShapes);

  const slices = shapesToSlices(layerShapes, settings);

  generateInnerLines(slices, settings);
  generateInfills(slices, settings);
  generateSupport(slices, settings);
  addBrim(slices, settings);
  optimizePaths(slices, settings);
  removePrecision(slices);

  rawData.slices = slices;

  const gcode = slicesToGCode(slices, settings);

  rawData.gcode = gcode;

  return rawData;
}
