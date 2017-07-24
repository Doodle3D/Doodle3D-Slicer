import Shape from 'clipper-js';
import Slice from './helpers/Slice.js';

import { CLEAN_DELTA, PRECISION } from '../constants.js';

const cleanDelta = CLEAN_DELTA / PRECISION;

export default function shapesToSlices(shapes, settings) {
  const sliceLayers = [];

  for (let layer = 0; layer < shapes.length; layer ++) {
    let { closedShapes, openShapes } = shapes[layer];

    closedShapes = new Shape(closedShapes, true, true, true, true)
      .fixOrientation()
      .simplify('pftNonZero')
      .clean(cleanDelta)
      .seperateShapes();

    openShapes = new Shape(openShapes, false, true, true, true);
    //   .clean(cleanDelta);
    // TODO
    // Cleaning is actually wanted here but there is a bug in the clean function
    // https://sourceforge.net/p/jsclipper/tickets/16/

    const slice = new Slice();

    for (let i = 0; i < closedShapes.length; i ++) {
      const closedShape = closedShapes[i];
      slice.add(closedShape);

      // if (openShapes.path.length > 0) {
      //   openShapes = openShapes.difference(closedShape);
      // }
    }

    if (openShapes.paths.length > 0) {
      slice.add(openShapes);
    }

    sliceLayers.push(slice);
  }

  return sliceLayers;
}
