import { subtract, add, normalize, dot, distanceTo, divide, normal } from './vector2.js';
import earcut from 'earcut';

const TRIANGULATED_OUTLINES = new WeakMap();

export default function comb(outline, start, end) {
  if (distanceTo(start, end) < 3) return [start, end];

  if (!TRIANGULATED_OUTLINES.has(outline)) TRIANGULATED_OUTLINES.set(outline, decompose(outline));
  const { convexPolygons, vertices } = TRIANGULATED_OUTLINES.get(outline);

  const startPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(start, face, vertices));
  const endPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(end, face, vertices));
  if (startPolygon === -1 || endPolygon === -1) return [start, end];
  if (startPolygon === endPolygon) return [start, end];

  const path = findClosestPath(convexPolygons, startPolygon, endPolygon);
  if (!path) return [start, end];

  const line = containLineInPath(path, start, end, vertices);
  return line;
}

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
