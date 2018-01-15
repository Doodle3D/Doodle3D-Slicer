import { Vector2 } from 'three/src/math/Vector2.js';
import Shape from 'clipper-js';

export default function optimizePaths(slices, settings) {
  const start = new Vector2(0, 0);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (typeof slice.brim !== 'undefined') {
      for (let i = 0; i < slice.brim.length; i ++) {
        if (slice.brim[i].paths.length > 0) {
          slice.brim[i] = optimizeShape(slice.brim[i], start);
          start.copy(slice.brim[i].lastPoint(true));
        }
      }
    }

    const parts = [];
    const boundingBoxes = new WeakMap();
    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      const shape = part.closed ? part.shell[0] : part.shape;
      const bounds = shape.shapeBounds();

      boundingBoxes.set(part, bounds);
    }

    while (slice.parts.length > 0) {
      let closestDistance = Infinity;
      let closestPart;

      for (let i = 0; i < slice.parts.length; i ++) {
        const part = slice.parts[i];
        const bounds = boundingBoxes.get(part);

        const topDistance = bounds.top - start.y;
        const bottomDistance = start.y - bounds.bottom;
        const leftDistance = bounds.left - start.x;
        const rightDistance = start.x - bounds.right;

        const distance = Math.max(topDistance, bottomDistance, leftDistance, rightDistance);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPart = i;
        }
      }

      const [part] = slice.parts.splice(closestPart, 1);
      parts.push(part);

      if (part.closed) {
        for (let i = 0; i < part.shell.length; i ++) {
          const shell = part.shell[i];

          if (shell.paths.length === 0) continue;

          part.shell[i] = optimizeShape(shell, start);
          start.copy(part.shell[i].lastPoint(true));
        }

        if (part.outerFill.paths.length > 0) {
          part.outerFill = optimizeShape(part.outerFill, start);
          start.copy(part.outerFill.lastPoint(true));
        }

        if (part.innerFill.paths.length > 0) {
          part.innerFill = optimizeShape(part.innerFill, start);
          start.copy(part.innerFill.lastPoint(true));
        }
      } else {
        part.shape = optimizeShape(part.shape, start);
        start.copy(part.shape.lastPoint(true));
      }
    }

    slice.parts = parts;

    if (typeof slice.support !== 'undefined' && slice.support.length > 0) {
      slice.support = optimizeShape(slice.support, start);
      start.copy(slice.support.lastPoint(true));
    }
  }
}

function optimizeShape(shape, start) {
  start = start.clone();

  const inputPaths = shape.mapToLower();
  const optimizedPaths = [];
  const donePaths = [];

  while (optimizedPaths.length !== inputPaths.length) {
    let minLength = false;
    let reverse;
    let minPath;
    let offset;
    let pathIndex;

    for (let i = 0; i < inputPaths.length; i ++) {
      if (donePaths.includes(i)) continue;

      const path = inputPaths[i];

      if (shape.closed) {
        for (let j = 0; j < path.length; j += 1) {
          const point = new Vector2().copy(path[j]);
          const length = point.sub(start).length();
          if (minLength === false || length < minLength) {
            minPath = path;
            minLength = length;
            offset = j;
            pathIndex = i;
          }
        }
      } else {
        const startPoint = new Vector2().copy(path[0]);
        const lengthToStart = startPoint.sub(start).length();
        if (minLength === false || lengthToStart < minLength) {
          minPath = path;
          minLength = lengthToStart;
          reverse = false;
          pathIndex = i;
        }

        const endPoint = new Vector2().copy(path[path.length - 1]);
        const lengthToEnd = endPoint.sub(start).length();
        if (lengthToEnd < minLength) {
          minPath = path;
          minLength = lengthToEnd;
          reverse = true;
          pathIndex = i;
        }
      }
    }

    let point;
    if (shape.closed) {
      minPath = minPath.concat(minPath.splice(0, offset));
      point = minPath[0];
    } else {
      if (reverse) {
        minPath.reverse();
      }
      point = minPath[minPath.length - 1];
    }

    donePaths.push(pathIndex);
    start.copy(point);

    optimizedPaths.push(minPath);
  }

  return new Shape(optimizedPaths, shape.closed, true, false);
}
