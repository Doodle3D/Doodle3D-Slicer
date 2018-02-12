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
      const shape = shapes[objectIndex].map(lineSegment => lineSegment.map(pointIndex => points[pointIndex]));
      const openShape = openObjectIndexes[objectIndex];

      const connectPoints = [];
      for (let pathIndex = 0; pathIndex < shape.length; pathIndex ++) {
        const path = shape[pathIndex];

        let shapeStartPoint = path[0];
        for (const point of connectPoints) {
          if (almostEquals(point.point, shapeStartPoint)) {
            point.start = pathIndex;
            shapeStartPoint = null;
            break;
          }
        }
        if (shapeStartPoint) connectPoints.push({ point: shapeStartPoint, start: pathIndex, end: null });

        let shapeEndPoint = path[path.length - 1];
        for (const point of connectPoints) {
          if (almostEquals(point.point, shapeEndPoint)) {
            point.end = pathIndex;
            shapeEndPoint = null;
            break;
          }
        }
        if (shapeEndPoint) connectPoints.push({ point: shapeEndPoint, start: null, end: pathIndex });
      }

      const lines = [];
      while (connectPoints.length !== 0) {
        let { start, end } = connectPoints.pop();

        const line = [];
        if (start !== null) line.push(...shape[start]);

        let newPoint;
        while (end !== null && (newPoint = connectPoints.find(point => point.start === end))) {
          line.push(...shape[newPoint.start]);
          connectPoints.splice(connectPoints.indexOf(newPoint), 1);

          if (newPoint.end === start) break;

          end = newPoint.end;
          start = newPoint.start;
        }

        lines.push(line);
      }

      if (openShape) {
        for (const line of lines) {
          const closed = almostEquals(line[0], line[line.length - 1]);
          if (closed) {
            lineShapesClosed.push(line);
          } else {
            lineShapesOpen.push(line);
          }
        }
      } else {
        fillShapes.push(...lines);
      }
    }

    layers.push({ fillShapes, lineShapesOpen, lineShapesClosed });
  }

  return layers;
}
