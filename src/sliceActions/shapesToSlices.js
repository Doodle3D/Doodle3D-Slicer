import Shape from '@doodle3d/clipper-js';
import Slice from './helpers/Slice.js';

import { PRECISION, MIN_AREA } from '../constants.js';

export default function shapesToSlices(shapes) {
  const sliceLayers = [];

  for (let layer = 0; layer < shapes.length; layer ++) {
    let { fillShapes, lineShapesOpen, lineShapesClosed } = shapes[layer];

    fillShapes = new Shape(fillShapes, true, true, true, true)
      .fixOrientation()
      .simplify('pftNonZero')
      .clean(1)
      .thresholdArea(MIN_AREA / Math.pow(PRECISION, 2))
      .separateShapes();

    lineShapesClosed = new Shape(lineShapesClosed, true, true, true, true)
      .clean(1);

    lineShapesOpen = new Shape(lineShapesOpen, false, true, true, true);
      // .clean(1);
    // TODO
    // Enable cleaning when https://sourceforge.net/p/jsclipper/tickets/24/ is fixed

    const slice = new Slice();

    for (let i = 0; i < fillShapes.length; i ++) {
      const fillShape = fillShapes[i];
      if (fillShape.paths.length === 0) continue;

      slice.add(fillShape, true);

      if (lineShapesClosed.paths.length > 0) lineShapesClosed = lineShapesClosed.difference(fillShape);
      if (lineShapesOpen.paths.length > 0) lineShapesOpen = lineShapesOpen.difference(fillShape);
    }

    if (lineShapesClosed.paths.length > 0) slice.add(lineShapesClosed, false);
    if (lineShapesOpen.paths.length > 0) slice.add(lineShapesOpen, false);

    sliceLayers.push(slice);
  }

  return sliceLayers;
}
