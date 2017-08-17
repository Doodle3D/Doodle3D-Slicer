import Shape from 'clipper-js';

export default function comb(outline, start, end) {
  if (distanceTo(start, end) < 5) {
    return [start, end];
  }

  let combPath = new Shape([[start, end]], false, true, false);

  for (let i = 0; i < outline.paths.length; i ++) {
    let outlinePart = new Shape([outline.paths[i]], true, false, false);
    let snappedCombPaths = i === 0 ? combPath.intersect(outlinePart) : combPath.difference(outlinePart);

    if (snappedCombPaths.paths.length <= 1) continue;

    snappedCombPaths = snappedCombPaths.mapToLower();
    outlinePart = outlinePart.mapToLower()[0];

    const distanceMap = new WeakMap();

    for (let i = 0; i < snappedCombPaths.length; i ++) {
      const snappedCombPath = snappedCombPaths[i];
      const distanceStart = distanceTo(start, snappedCombPath[0]);
      const distanceEnd = distanceTo(start, snappedCombPath[snappedCombPath.length - 1]);

      if (distanceStart < distanceEnd) {
        distanceMap.set(snappedCombPath, distanceStart);
      } else {
        snappedCombPath.reverse();
        distanceMap.set(snappedCombPath, distanceEnd);
      }
    }

    snappedCombPaths.sort((a, b) => distanceMap.get(a) - distanceMap.get(b));

    const startPath = snappedCombPaths[0];
    const startPoint = startPath[startPath.length - 1];

    const endPath = snappedCombPaths[snappedCombPaths.length - 1];
    const endPoint = endPath[0];

    const lineIndexStart = findClosestLineOnPath(outlinePart, startPoint);
    const lineIndexEnd = findClosestLineOnPath(outlinePart, endPoint);

    const path = [];
    if (lineIndexEnd > lineIndexStart) {
      if (lineIndexStart + outlinePart.length - lineIndexEnd < lineIndexEnd - lineIndexStart) {
        for (let i = lineIndexStart + outlinePart.length; i > lineIndexEnd; i --) {
          path.push(outlinePart[i % outlinePart.length]);
        }
      } else {
        for (let i = lineIndexStart; i < lineIndexEnd; i ++) {
          path.push(outlinePart[i + 1]);
        }
      }
    } else {
      if (lineIndexEnd + outlinePart.length - lineIndexStart < lineIndexStart - lineIndexEnd) {
        for (let i = lineIndexStart; i < lineIndexEnd + outlinePart.length; i ++) {
          path.push(outlinePart[(i + 1) % outlinePart.length]);
        }
      } else {
        for (let i = lineIndexStart; i > lineIndexEnd; i --) {
          path.push(outlinePart[i]);
        }
      }
    }

    combPath = new Shape([[...startPath, ...path, ...endPath]], false, true, false);
  }

  return combPath.mapToLower()[0];
}

function findClosestLineOnPath(path, point) {
  let distance = Infinity;
  let lineIndex;

  for (let i = 0; i < path.length; i ++) {
    const pointA = path[i];
    const pointB = path[(i + 1) % path.length];

    const tempClosestPoint = findClosestPointOnLine(pointA, pointB, point);
    const tempDistance = distanceTo(tempClosestPoint, point);

    if (tempDistance < distance) {
      distance = tempDistance;
      lineIndex = i;
    }
  }

  return lineIndex;
}

function findClosestPointOnLine(a, b, c) {
  const b_ = subtract(b, a);
  const c_ = subtract(c, a);

  const lambda = dot(normalize(b_), c_) / length(b_);

  if (lambda >= 1) {
    return b;
  } else if (lambda > 0) {
    return add(a, scale(b_, lambda));
  } else {
    return a;
  }
}

function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

function add(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

function scale(a, factor) {
  return {
    x: a.x * factor,
    y: a.y * factor
  }
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function normalize(a) {
  const l = length(a);

  return {
    x: a.x / l,
    y: a.y / l
  };
}

function length(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

function distanceTo(a, b) {
  return length(subtract(a, b));
}
