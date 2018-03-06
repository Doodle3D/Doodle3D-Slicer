import { subtract, normal, normalize, dot, almostEquals } from './helpers/vector2.js';

export default function intersectionsToShapes(layerPoints, layerFaceIndexes, faces, openObjectIndexes, settings) {
  const layers = [];

  for (let layer = 0; layer < layerPoints.length; layer ++) {
    const fillShapes = [];
    const lineShapesOpen = [];
    const lineShapesClosed = [];

    const points = layerPoints[layer];
    const faceIndexes = layerFaceIndexes[layer];

    if (faceIndexes.length === 0) continue;

    const shapes = {};

    const startConnects = {};
    const endConnects = {};

    for (let i = 0; i < faceIndexes.length; i ++) {
      const faceIndex = faceIndexes[i];
      const { lineIndexes, flatNormal, objectIndex } = faces[faceIndex];

      const a = lineIndexes[0];
      const b = lineIndexes[1];
      const c = lineIndexes[2];

      let pointA;
      let pointB;
      if (points[a] && points[b]) {
        pointA = a;
        pointB = b;
      } else if (points[b] && points[c]) {
        pointA = b;
        pointB = c;
      } else if (points[c] && points[a]) {
        pointA = c;
        pointB = a;
      } else {
        // should never happen
        continue;
      }

      const segmentNormal = normalize(normal(subtract(points[pointA], points[pointB])));
      if (dot(segmentNormal, flatNormal) < 0) {
        const temp = pointB;
        pointB = pointA;
        pointA = temp;
      }

      if (endConnects[pointA]) {
        const lineSegment = endConnects[pointA];
        delete endConnects[pointA];
        if (startConnects[pointB]) {
          if (startConnects[pointB] === lineSegment) {
            delete startConnects[pointB];
            lineSegment.push(pointB);
          } else {
            lineSegment.push(...startConnects[pointB]);
            endConnects[lineSegment[lineSegment.length - 1]] = lineSegment;
          }
        } else {
          lineSegment.push(pointB);
          endConnects[pointB] = lineSegment;
        }
      } else if (startConnects[pointB]) {
        const lineSegment = startConnects[pointB];
        delete startConnects[pointB];
        if (endConnects[pointA]) {
          lineSegment.unshift(...endConnects[pointA]);
          startConnects[lineSegment[0]] = lineSegment;
        } else {
          lineSegment.unshift(pointA);
          startConnects[pointA] = lineSegment;
        }
      } else {
        const lineSegment = [pointA, pointB];
        startConnects[pointA] = lineSegment;
        endConnects[pointB] = lineSegment;

        if (!shapes[objectIndex]) shapes[objectIndex] = [];
        shapes[objectIndex].push(lineSegment);
      }
    }

    for (const objectIndex in shapes) {
      const shape = shapes[objectIndex]
        .map(lineSegment => lineSegment.map(pointIndex => points[pointIndex]))
        .filter(lineSegment => lineSegment.some(i => !almostEquals(lineSegment[0], lineSegment[1])));
      const openShape = openObjectIndexes[objectIndex];

      const connectPoints = [];
      for (let pathIndex = 0; pathIndex < shape.length; pathIndex ++) {
        const path = shape[pathIndex];

        if (almostEquals(path[0], path[path.length - 1])) {
          if (openShape) {
            lineShapesClosed.push(path);
          } else {
            fillShapes.push(path);
          }
          continue;
        }

        let shapeStartPoint = path[0];
        const connectNext = connectPoints.find(({ point }) => almostEquals(point, shapeStartPoint));
        if (connectNext) {
          connectNext.next = pathIndex;
        } else {
          connectPoints.push({ point: shapeStartPoint, next: pathIndex, previous: -1 });
        }

        let shapeEndPoint = path[path.length - 1];
        const connectPrevious = connectPoints.find(({ point }) => almostEquals(point, shapeEndPoint));
        if (connectPrevious) {
          connectPrevious.previous = pathIndex;
        } else {
          connectPoints.push({ point: shapeEndPoint, next: -1, previous: pathIndex });
        }
      }

      connectPoints.sort(({ previous }) => -previous);

      while (connectPoints.length !== 0) {
        let { next, previous } = connectPoints.pop();

        const line = [];
        if (previous !== -1) line.push(...shape[previous]);

        while (true) {
          const pointIndex = connectPoints.findIndex(point => point.previous === next);
          if (pointIndex === -1) break;

          const point = connectPoints[pointIndex];
          line.push(...shape[point.previous]);

          connectPoints.splice(pointIndex, 1);

          if (point.next === -1) break;
          if (point.next === previous) break;

          next = point.next;
        }

        if (openShape) {
          if (almostEquals(line[0], line[line.length - 1])) {
            lineShapesClosed.push(line);
          } else {
            lineShapesOpen.push(line);
          }
        } else {
          fillShapes.push(line);
        }
      }
    }

    layers.push({ fillShapes, lineShapesOpen, lineShapesClosed });
  }

  return layers;
}
