import Shape from 'Doodle3D/clipper-js';
import Slice from '../Slice.js';

import { CLEAN_DELTA } from '../constants.js';

export default function shapesToSlices(shapes, settings) {
  const sliceLayers = [];

  for (let layer = 0; layer < shapes.length; layer ++) {
    let { closedShapes, openShapes } = shapes[layer];

    closedShapes = new Shape(closedShapes, true, true)
      .clean(CLEAN_DELTA)
      .fixOrientation()
      .removeOverlap()
      .seperateShapes();

    openShapes = new Shape(openShapes, false, true)
      .clean(CLEAN_DELTA);

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
