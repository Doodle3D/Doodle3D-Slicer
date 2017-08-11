export default function comb(outline, start, end) {
  const [path] = outline.mapToLower();
  const combPath = [];

  const { closestPoint: closestPointStart, lineIndex: lineIndexStart } = findClosestPointOnPath(path, start);
  const { closestPoint: closestPointEnd, lineIndex: lineIndexEnd } = findClosestPointOnPath(path, end);

  combPath.push(start, closestPointStart);

  if (lineIndexEnd > lineIndexStart) {
    if (lineIndexStart + path.length - lineIndexEnd < lineIndexEnd - lineIndexStart) {
      for (let i = lineIndexStart + path.length; i > lineIndexEnd; i --) {
        combPath.push(path[i % path.length]);
      }
    } else {
      for (let i = lineIndexStart; i < lineIndexEnd; i ++) {
        combPath.push(path[i + 1]);
      }
    }
  } else {
    if (lineIndexEnd + path.length - lineIndexStart < lineIndexStart - lineIndexEnd) {
      for (let i = lineIndexStart; i < lineIndexEnd + path.length; i ++) {
        combPath.push(path[(i + 1) % path.length]);
      }
    } else {
      for (let i = lineIndexStart; i > lineIndexEnd; i --) {
        combPath.push(path[i]);
      }
    }
  }

  combPath.push(closestPointEnd, end);

  return combPath;
}

function findClosestPointOnPath(path, point) {
  let distance = Infinity;
  let lineIndex;
  let closestPoint;

  for (let i = 0; i < path.length; i ++) {
    const pointA = path[i];
    const pointB = path[(i + 1) % path.length];

    const tempClosestPoint = findClosestPointOnLine(pointA, pointB, point);
    const tempDistance = distanceTo(tempClosestPoint, point);

    if (tempDistance < distance) {
      distance = tempDistance;
      lineIndex = i;
      closestPoint = tempClosestPoint;
    }
  }

  return { closestPoint, lineIndex };
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
