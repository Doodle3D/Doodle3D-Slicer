import { PRECISION } from '../constants.js';
import { divide } from './helpers/vector2.js';

export default function applyPrecision(layers) {
  for (let layer = 0; layer < layers.length; layer ++) {
    const { fillShapes, lineShapesOpen, lineShapesClosed } = layers[layer];

    scaleUpShape(fillShapes);
    scaleUpShape(lineShapesOpen);
    scaleUpShape(lineShapesClosed);
  }
}

function scaleUpShape(shape) {
  for (let i = 0; i < shape.length; i ++) {
    const path = shape[i];

    for (let i = 0; i < path.length; i ++) {
      path[i] = divide(path[i], PRECISION);
    }
  }
}
