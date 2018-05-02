import earcut from 'earcut';
import { add, divide, distanceTo, normalize, subtract, normal, dot } from './src/sliceActions/helpers/vector2.js';


function lineIntersection(a1, a2, b1, b2) {
  // source: http://mathworld.wolfram.com/Line-LineIntersection.html
  const intersection = {
    x: ((a1.x * a2.y - a1.y * a2.x) * (b1.x - b2.x) - (a1.x - a2.x) * (b1.x * b2.y - b1.y * b2.x)) / ((a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)),
    y: ((a1.x * a2.y - a1.y * a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x * b2.y - b1.y * b2.x)) / ((a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x))
  };

  const intersectionA = subtract(intersection, a1);
  const directionA = subtract(a2, a1);
  const normalA = normalize(directionA);
  const distanceA = dot(normalA, intersectionA);
  if (distanceA < 0 || distanceA > dot(normalA, directionA)) return false;

  const intersectionB = subtract(intersection, b1);
  const directionB = subtract(b2, b1);
  const normalB = normalize(directionB);
  const distanceB = dot(normalB, intersectionB);
  if (distanceB < 0 || distanceB > dot(normalB, directionB)) return false;

  return intersection;
}

function pointIsInsideConvex(point, convex, vertices) {
  for (let i = 0; i < convex.length; i ++) {
    const vertexA = vertices[convex[i]];
    const vertexB = vertices[convex[(i + 1) % convex.length]];

    const n = normalize(normal(subtract(vertexB, vertexA)));
    const p = subtract(point, vertexA);

    if (dot(p, n) < 0) return false;
  }
  return true;
}

function decompose(polygon) {
  const vertices = polygon.reduce((points, path) => {
    points.push(...path);
    return points;
  }, []);
  const flatVertices = vertices.reduce((points, { x, y }) => {
    points.push(x, y);
    return points;
  }, []);
  let offset = 0;
  const holes = polygon
    .map(path => offset += path.length)
    .slice(0, -1);

  const flatTrainglesIndexed = earcut(flatVertices, holes);
  const convexPolygons = [];
  for (let i = 0; i < flatTrainglesIndexed.length; i += 3) {
    const face = [
      flatTrainglesIndexed[i],
      flatTrainglesIndexed[i + 1],
      flatTrainglesIndexed[i + 2]
    ];
    const center = divide(face.reduce((total, point) => {
      if (!total) {
        return vertices[point];
      } else {
        return add(total, vertices[point]);
      }
    }, null), face.length);
    convexPolygons.push({
      center,
      face,
      connects: []
    });
  }

  for (let i = 0; i < convexPolygons.length; i ++) {
    for (let j = i + 1; j < convexPolygons.length; j ++) {
      const triangleIndexedA = convexPolygons[i];
      const triangleIndexedB = convexPolygons[j];

      const overlap = [];
      triangleIndexedA.face.map(index => {
        if (triangleIndexedB.face.includes(index)) overlap.push(index);
      });

      if (overlap.length === 2) {
        const distance = distanceTo(convexPolygons[i].center, convexPolygons[j].center);
        triangleIndexedA.connects.push({ to: j, edge: overlap, distance });
        triangleIndexedB.connects.push({ to: i, edge: overlap, distance });
      }
    }
  }

  return { vertices, convexPolygons };
}

// const distanceMap = new WeakMap();
// function findClosestPath(convexPolygons, start, end, visited = [], path = [], distance = 0) {
//   if (start === end) return [];
//
//   visited = [...visited, start];
//
//   const { connects } = convexPolygons[start];
//
//   const finish = connects.find(({ to }) => to === end);
//   if (finish) return [...path, finish];
//
//   const posibilities = [];
//   for (let i = 0; i < connects.length; i ++) {
//     const connect = connects[i];
//     if (visited.includes(connect.to)) continue;
//
//     const positibiltyDistance = distance + connect.distance;
//     const posibility = findClosestPath(convexPolygons, connect.to, end, visited, [...path, connect], positibiltyDistance);
//     if (posibility) {
//       posibilities.push(posibility);
//       distanceMap.set(posibility, positibiltyDistance);
//     }
//   }
//
//   if (posibilities.length === 0) {
//     return null;
//   } else if (posibilities.length === 1) {
//     return posibilities[0];
//   } else if (posibilities.length > 1) {
//     return posibilities.sort((a, b) => distanceMap.get(a) - distanceMap.get(b))[0];
//   }
// }

const findKey = _key => ({ key }) => _key === key;
function findClosestPath(map, start, end) {
  // dijkstra's algorithm
  const distances = { [start]: 0 };
  const open = [{ key: 0, nodes: [start] }];
  const predecessors = {};

  while (open.length !== 0) {
    const key = Math.min(...open.map(n => n.key).sort());
    const bucket = open.find(findKey(key));
    const node = bucket.nodes.shift();
    const currentDistance = key;
    const { connects } = map[node];

    if (bucket.nodes.length === 0) open.splice(open.indexOf(bucket), 1);

    for (let i = 0; i < connects.length; i ++) {
      const { distance, to } = connects[i];
      const totalDistance = distance + currentDistance;
      const vertexDistance = distances[to];

      if ((typeof vertexDistance === 'undefined') || (vertexDistance > totalDistance)) {
        distances[to] = totalDistance;

        let openNode = open.find(findKey(totalDistance));
        if (!openNode) {
          openNode = { key: totalDistance, nodes: [] };
          open.push(openNode);
        }
        openNode.nodes.push(to);

        predecessors[to] = node;
      }
    }
  }

  if (typeof distances[end] === 'undefined') return null;

  const nodes = [];
  let node = end;
  while (typeof node !== 'undefined') {
    nodes.push(node);
    node = predecessors[node];
  }
  nodes.reverse();

  const path = [];
  for (let i = 1; i < nodes.length; i ++) {
    const from = nodes[i - 1];
    const to = nodes[i];

    const connection = map[from].connects.find(connect => connect.to === to);
    path.push(connection);
  }

  return path;
}

function containLineInPath(path, start, end, vertices) {
  const line = [start];

  for (let i = 0; i < path.length; i ++) {
    const { edge: [indexA, indexB] } = path[i];
    const vertexA = vertices[indexA];
    const vertexB = vertices[indexB];

    const intersection = lineIntersection(start, end, vertexA, vertexB);
    if (!intersection) {
      const lastPoint = line[line.length - 1];
      const distanceA = distanceTo(lastPoint, vertexA) + distanceTo(vertexA, end);
      const distanceB = distanceTo(lastPoint, vertexB) + distanceTo(vertexB, end);

      line.push(distanceA < distanceB ? vertexA : vertexB);
    }
  }

  line.push(end);
  return line;
}


const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 610;
canvas.height = 610;
const context = canvas.getContext('2d');
context.lineJoin = 'bevel';

function circle(radius = 10, x = 0, y = 0, clockWise = true, segments = 40) {
  const shape = [];

  for (let rad = 0; rad < Math.PI * 2; rad += Math.PI * 2 / segments) {
    if (clockWise) {
      shape.push({ x: Math.cos(rad) * radius + x, y: Math.sin(rad) * radius + y });
    } else {
      shape.push({ x: Math.cos(rad) * radius + x, y: -Math.sin(rad) * radius + y });
    }
  }

  return shape;
}

const START = { x: 300, y: 300 };
const END = { x: 300, y: 20 };
// const CONCAVE_POLYGON = [[
//   { x: 10, y: 10 },
//   { x: 600, y: 10 },
//   { x: 500, y: 200 },
//   { x: 600, y: 600 },
//   { x: 10, y: 600 }
// ], [
//   { x: 160, y: 120 },
//   { x: 120, y: 400 },
//   { x: 400, y: 400 }
// ], circle(50, 300, 100, false)];
const CONCAVE_POLYGON = [circle(300, 305, 305, true, 100), circle(50, 300, 100, false)];

canvas.onmousedown = (event) => {
  START.x = event.offsetX;
  START.y = event.offsetY;
  compute();
};
canvas.onmousemove = (event) => {
  END.x = event.offsetX;
  END.y = event.offsetY;
  compute();
};
compute();

function compute() {
  const { convexPolygons, vertices } = decompose(CONCAVE_POLYGON);
  const startPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(START, face, vertices));
  const endPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(END, face, vertices));
  if (startPolygon === -1 || endPolygon === -1) return;

  const path = findClosestPath(convexPolygons, startPolygon, endPolygon);
  if (!path) return;
  const line = containLineInPath(path, START, END, vertices);

  // draw
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  for (const shape of CONCAVE_POLYGON) {
    let first = true;
    for (const { x, y } of shape) {
      if (first) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
      first = false;
    }
  }
  context.closePath();
  context.fillStyle = 'lightgray';
  context.fill();

  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 1;
  context.font = '14px arial';
  for (let i = 0; i < convexPolygons.length; i ++) {
    const { face, center } = convexPolygons[i];

    context.beginPath();
    for (const index of face) {
      const vertex = vertices[index];
      context.lineTo(vertex.x, vertex.y);
    }
    context.closePath();
    context.stroke();

    context.fillText(i, center.x, center.y);
  }

  if (path) {
    context.beginPath();
    for (const { edge: [indexA, indexB] } of path) {
      const pointA = vertices[indexA];
      const pointB = vertices[indexB];
      context.moveTo(pointA.x, pointA.y);
      context.lineTo(pointB.x, pointB.y);
    }
    context.strokeStyle = 'blue';
    context.lineWidth = 3;
    context.stroke();
  }

  if (line) {
    context.beginPath();
    for (const point of line) {
      context.lineTo(point.x, point.y);
    }
    context.strokeStyle = 'green';
    context.lineWidth = 2;
    context.stroke();
  }

  context.beginPath();
  context.arc(START.x, START.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'blue';
  context.fill();

  context.beginPath();
  context.arc(END.x, END.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'red';
  context.fill();
}
