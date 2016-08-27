import THREE from 'three.js';
import Shape from 'Doodle3D/clipper-js';

export default function optimizePaths(slices, settings) {
  console.log('optimize paths');

  const start = new THREE.Vector2(0, 0);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (slice.brim !== undefined && slice.brim.paths.length > 0) {
    	slice.brim = optimizeShape(slice.brim, start);
    	start.copy(slice.brim.lastPoint(true));
    }

    const parts = [];

    while (slice.parts.length > 0) {
    	let closestDistance = Infinity;
    	let closestPart;

    	for (let i = 0; i < slice.parts.length; i ++) {
    		const part = slice.parts[i];

        let bounds;
    		if (part.shape.closed) {
    			bounds = part.outerLine.shapeBounds();
    		} else {
    			bounds = part.shape.shapeBounds();
    		}

    		const top = bounds.top - start.y;
    		const bottom = start.y - bounds.bottom;
    		const left = bounds.left - start.x;
    		const right = start.x - bounds.right;

    		const distance = Math.max(top, bottom, left, right);

    		if (distance < closestDistance) {
    			closestDistance = distance;
    			closestPart = i;
    		}
    	}

    	const part = slice.parts.splice(closestPart, 1)[0];
    	parts.push(part);

    	if (part.shape.closed) {
    		if (part.outerLine.paths.length > 0) {
    			part.outerLine = optimizeShape(part.outerLine, start);
    			start.copy(part.outerLine.lastPoint(true));
    		}

    		for (let i = 0; i < part.innerLines.length; i ++) {
    			const innerLine = part.innerLines[i];

    			if (innerLine.paths.length > 0) {
    				part.innerLines[i] = optimizeShape(innerLine, start);
    				start.copy(part.innerLines[i].lastPoint(true));
    			}
    		}

    		if (part.fill.paths.length > 0) {
    			part.fill = optimizeShape(part.fill, start);
    			start.copy(part.fill.lastPoint(true));
    		}
    	} else {
    		part.shape = optimizeShape(part.shape, start);
    		start.copy(part.shape.lastPoint(true));
    	}
    }

    slice.parts = parts;

    if (slice.support !== undefined && slice.support.length > 0) {
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
      if (donePaths.indexOf(i) !== -1) continue;

      const path = inputPaths[i];

      if (shape.closed) {
        for (let j = 0; j < path.length; j += 1) {
          const point = new THREE.Vector2().copy(path[j]);
          const length = point.sub(start).length();
          if (minLength === false || length < minLength) {
            minPath = path;
            minLength = length;
            offset = j;
            pathIndex = i;
          }
        }
      } else {
        const startPoint = new THREE.Vector2().copy(path[0]);
        const lengthToStart = startPoint.sub(start).length();
        if (minLength === false || lengthToStart < minLength) {
          minPath = path;
          minLength = lengthToStart;
          reverse = false;
          pathIndex = i;
        }

        const endPoint = new THREE.Vector2().copy(path[path.length - 1]);
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
