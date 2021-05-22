import { distanceTo } from './helpers/vector2.js';
import Shape from '@doodle3d/clipper-js';

export default function optimizePaths(slices) {
  let start = { x: 0, y: 0 };

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (typeof slice.brim !== 'undefined' && slice.brim.paths.length > 0) {
      slice.brim = optimizeShape(slice.brim, start);
      start = slice.brim.lastPoint(true);
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
          start = part.shell[i].lastPoint(true);
        }

        if (part.outerFill.paths.length > 0) {
          part.outerFill = optimizeShape(part.outerFill, start);
          start = part.outerFill.lastPoint(true);
        }

        if (part.innerFill.paths.length > 0) {
          part.innerFill = optimizeShape(part.innerFill, start);
          start = part.innerFill.lastPoint(true);
        }
      } else {
        part.shape = optimizeShape(part.shape, start);
        start = part.shape.lastPoint(true);
      }
    }

    slice.parts = parts;

    if (typeof slice.support !== 'undefined' && slice.support.paths.length > 0) {
      slice.support = optimizeShape(slice.support, start);
      start = slice.support.lastPoint(true);
    }
  }
}

function optimizeShape(shape, start) {
  const inputPaths = shape.mapToLower().filter(path => path.length > 0);
  const optimizedPaths = [];
  const donePaths = [];

  while (optimizedPaths.length !== inputPaths.length) {
    let minLength = Infinity;
    let reverse;
    let minPath;
    let offset;
    let pathIndex;

    for (let i = 0; i < inputPaths.length; i ++) {
      if (donePaths.includes(i)) continue;

      const path = inputPaths[i];

      if (shape.closed) {
        for (let j = 0; j < path.length; j += 1) {
          const length = distanceTo(path[j], start);
          if (length < minLength) {
            minPath = path;
            minLength = length;
            offset = j;
            pathIndex = i;
          }
        }
      } else {
        const lengthToStart = distanceTo(path[0], start);
        if (lengthToStart < minLength) {
          minPath = path;
          minLength = lengthToStart;
          reverse = false;
          pathIndex = i;
        }

        const lengthToEnd = distanceTo(path[path.length - 1], start);
        if (lengthToEnd < minLength) {
          minPath = path;
          minLength = lengthToEnd;
          reverse = true;
          pathIndex = i;
        }
      }
    }

    if (shape.closed) {
      minPath = minPath.concat(minPath.splice(0, offset));
      start = minPath[0];
    } else {
      if (reverse) minPath.reverse();
      start = minPath[minPath.length - 1];
    }

    donePaths.push(pathIndex);
    optimizedPaths.push(minPath);
  }

  return new Shape(optimizedPaths, shape.closed, true, false);
}
