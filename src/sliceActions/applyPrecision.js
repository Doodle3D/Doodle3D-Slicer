import { PRECISION } from '../constants.js'

export default function applyPrecision(shapes) {
  for (let i = 0; i < shapes.length; i ++) {
    const { fillShapes, lineShapesOpen, lineShapesClosed } = shapes[i];

    scaleUpShape(fillShapes);
    scaleUpShape(lineShapesOpen);
    scaleUpShape(lineShapesClosed);
  }
}

function scaleUpShape(shape) {
  for (let i = 0; i < shape.length; i ++) {
    const path = shape[i];

    for (let i = 0; i < path.length; i ++) {
      const point = path[i];

      point.copy(point.divideScalar(PRECISION));
    }
  }
}
