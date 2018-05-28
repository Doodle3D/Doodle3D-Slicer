import { angle, subtract, distanceTo } from './vector2.js';

const graphs = new WeakMap();
export default function comb(polygons, start, end) {
  if (!graphs.has(polygons)) graphs.set(polygons, createGraph(polygons));
  let { edges, graph, points } = graphs.get(polygons);

  points = [...points, start, end];
  graph = [...graph];

  const startNode = createNode(graph, points, edges, start);
  const endNode = createNode(graph, points, edges, end);

  let result;
  if (graph[startNode].some(node => node.to === endNode)) {
    result = [start, end];
  } else {
    const path = shortestPath(graph, startNode, endNode);
    if (path) {
      result = path.map(index => points[index]);
    } else {
      result = [start, end];
    }
  }

  return result;
}

function createGraph(polygons) {
  const points = [];
  const edges = [];
  const nextPoints = new WeakMap();
  const previousPoints = new WeakMap();
  for (let i = 0; i < polygons.length; i ++) {
    const polygon = polygons[i];
    for (let j = 0; j < polygon.length; j ++) {
      const point = polygon[j];
      const nextPoint = polygon[(j + 1) % polygon.length];
      const previousPoint = polygon[(j - 1 + polygon.length) % polygon.length];

      points.push(point);
      edges.push([point, nextPoint]);
      nextPoints.set(point, nextPoint);
      previousPoints.set(point, previousPoint);
    }
  }

  const graph = points.map(() => ([]));
  for (let i = 0; i < points.length; i ++) {
    const a = points[i];

    for (let j = i + 1; j < points.length; j ++) {
      const b = points[j];
      const nextPoint = nextPoints.get(a);
      const previousPoint = previousPoints.get(a);

      if (!lineIsVisible(previousPoint, nextPoint, edges, a, b)) continue;

      const distance = distanceTo(a, b);

      const connectNodeA = graph[i];
      connectNodeA.push({ to: j, distance });

      const connectNodeB = graph[j];
      connectNodeB.push({ to: i, distance });
    }
  }
  return { graph, edges, points };
}

function createNode(graph, points, edges, point) {
  const node = [];
  const to = graph.length;
  graph.push(node);

  let previousPoint;
  let nextPoint;
  for (let j = 0; j < edges.length; j ++) {
    const edge = edges[j];
    if (pointOnLine(edge, point)) [previousPoint, nextPoint] = edge;
  }

  for (let i = 0; i < graph.length; i ++) {
    const b = points[i];

    if (!lineIsVisible(previousPoint, nextPoint, edges, point, b)) continue;

    const distance = distanceTo(point, b);

    node.push({ to: i, distance });
    graph[i] = [...graph[i], { to, distance }];
  }

  return to;
}

function lineIsVisible(previousPoint, nextPoint, edges, a, b) {
  if (b === nextPoint || b === previousPoint) return true;

  if (previousPoint && nextPoint) {
    const angleLine = angle(subtract(b, a));
    const anglePrevious = angle(subtract(previousPoint, a));
    const angleNext = angle(subtract(nextPoint, a));

    if (betweenAngles(angleLine, anglePrevious, angleNext)) return false;
  }

  if (lineCrossesEdges(edges, a, b)) return false;

  return true;
}

function lineCrossesEdges(edges, a, b) {
  for (let i = 0; i < edges.length; i ++) {
    const [c, d] = edges[i];
    if (lineSegmentsCross(a, b, c, d)) return true;
  }
  return false;
}

function lineSegmentsCross(a, b, c, d) {
  const denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));

  if (denominator === 0.0) return false;

  const numerator1 = ((a.y - c.y) * (d.x - c.x)) - ((a.x - c.x) * (d.y - c.y));
  const numerator2 = ((a.y - c.y) * (b.x - a.x)) - ((a.x - c.x) * (b.y - a.y));
  if (numerator1 === 0.0 || numerator2 === 0.0) return false;

  const r = numerator1 / denominator;
  const s = numerator2 / denominator;
  return (r > 0.0 && r < 1.0) && (s >= 0.0 && s <= 1.0);
}

const TAU = Math.PI * 2.0;
function normalizeAngle(a) {
  a %= TAU;
  return a > 0.0 ? a : a + TAU;
}

function betweenAngles(n, a, b) {
  n = normalizeAngle(n);
  a = normalizeAngle(a);
  b = normalizeAngle(b);
  return a < b ? a <= n && n <= b : a <= n || n <= b;
}

// dijkstra's algorithm
function shortestPath(graph, start, end) {
  const distances = graph.map(() => Infinity);
  distances[start] = 0;
  const traverse = [];
  const queue = [];
  for (let i = 0; i < distances.length; i ++) {
    queue.push(i);
  }

  while (queue.length > 0) {
    let queueIndex;
    let minDistance = Infinity;
    for (let index = 0; index < queue.length; index ++) {
      const nodeIndex = queue[index];
      const distance = distances[nodeIndex];
      if (distances[nodeIndex] < minDistance) {
        queueIndex = index;
        minDistance = distance;
      }
    }

    const [nodeIndex] = queue.splice(queueIndex, 1);
    const node = graph[nodeIndex];

    for (let i = 0; i < node.length; i ++) {
      const child = node[i];
      const distance = distances[nodeIndex] + child.distance;
      if (distance < distances[child.to]) {
        distances[child.to] = distance;
        traverse[child.to] = nodeIndex;
      }
    }
  }

  if (!traverse.hasOwnProperty(end)) return null;

  const path = [end];
  let nodeIndex = end;
  do {
    nodeIndex = traverse[nodeIndex];
    path.push(nodeIndex);
  } while (nodeIndex !== start);

  return path.reverse();
}

function pointOnLine([a, b], point) {
  return (a.x - point.x) * (a.y - point.y) === (b.x - point.x) * (b.y - point.y);
}
