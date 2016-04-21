import Shape from 'Doodle3D/clipper-js';
import Slice from '../slice.js';

export default function shapesToSlices(shapes, settings) {
  const sliceLayers = [];

  for (var layer = 0; layer < shapes.length; layer ++) {
    var { closedShapes, openShapes } = shapes[layer];

    closedShapes = new Shape(closedShapes, true, true)
      .clean(0.01)
      .fixOrientation()
      .removeOverlap()
      .seperateShapes();

    openShapes = new Shape(openShapes, false, true)
      .clean(0.01);

    var slice = new Slice();

    for (var i = 0; i < closedShapes.length; i ++) {
      var closedShape = closedShapes[i];
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
