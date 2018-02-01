import { subtract, normal, normalize, dot, distanceTo, clone } from './helpers/VectorUtils.js';

export default function intersectionsToShapes(intersectionLayers, faces, openObjectIndexes, settings) {
  const layers = [];

  for (let layer = 0; layer < intersectionLayers.length; layer ++) {
    const fillShapes = [];
    const lineShapesOpen = [];
    const lineShapesClosed = [];

    const { points, faceIndexes } = intersectionLayers[layer];

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
        lineSegment.push(points[pointB]);
        delete endConnects[pointA];
        endConnects[pointB] = lineSegment;
      } else if (startConnects[pointB]) {
        const lineSegment = startConnects[pointB];
        lineSegment.unshift(points[pointA]);
        delete startConnects[pointB];
        startConnects[pointA] = lineSegment;
      } else {
        const lineSegment = [points[pointA], points[pointB]];
        startConnects[pointA] = lineSegment;
        endConnects[pointB] = lineSegment;

        if (!shapes[objectIndex]) shapes[objectIndex] = { lineSegments: [] };
        const shape = shapes[objectIndex];

        shape.lineSegments.push(lineSegment)
      }
    }

    for (const objectIndex in shapes) {
      const shape = shapes[objectIndex];
      const openShape = openObjectIndexes[objectIndex];

      const lines = [shape.lineSegments.pop()];

      loop: while (shape.lineSegments.length !== 0) {
        for (let i = 0; i < lines.length; i ++) {
          const line = lines[i];

          const lastPoint = line[line.length - 1];

          let closestSegmentEnd;
          let endHit = false;
          const distanceEnd = new WeakMap();
          for (let i = 0; i < shape.lineSegments.length; i ++) {
            const lineSegment = shape.lineSegments[i];
            if (lastPoint === lineSegment[0]) {
              closestSegmentEnd = lineSegment;
              endHit = true;
              break;
            }
            const distance = distanceTo(lastPoint, lineSegment[0]);
            distanceEnd.set(lineSegment, distance);
          }

          if (!endHit) {
            closestSegmentEnd = shape.lineSegments.sort((a, b) => {
              const distanceA = distanceEnd.get(a);
              const distanceB = distanceEnd.get(b);
              if (distanceA === distanceB) return distanceTo(a[0], a[1]) - distanceTo(b[0], b[1]);
              return distanceA - distanceB;
            })[0];

            if (distanceTo(closestSegmentEnd[0], lastPoint) < .001) endHit = true;
          }

          if (endHit) {
            shape.lineSegments.splice(shape.lineSegments.indexOf(closestSegmentEnd), 1);
            line.splice(line.length, 0, closestSegmentEnd[1]);
            continue loop;
          }

          const firstPoint = line[0];

          let closestSegmentStart;
          let hitStart = false;
          const distanceStart = new WeakMap();
          for (let i = 0; i < shape.lineSegments.length; i ++) {
            const lineSegment = shape.lineSegments[i];
            if (firstPoint === lineSegment[1]) {
              closestSegmentStart = lineSegment;
              hitStart = true;
              break;
            }
            const distance = distanceTo(firstPoint, lineSegment[1]);
            distanceStart.set(lineSegment, distance);
          }

          if (!hitStart) {
            closestSegmentStart = shape.lineSegments.sort((a, b) => {
              const distanceA = distanceStart.get(a);
              const distanceB = distanceStart.get(b);
              if (distanceA === distanceB) return distanceTo(a[0], a[1]) - distanceTo(b[0], b[1]);
              return distanceA - distanceB;
            })[0];

            if (distanceTo(closestSegmentStart[1], firstPoint) < .001) hitStart = true;
          }

          if (hitStart) {
            shape.lineSegments.splice(shape.lineSegments.indexOf(closestSegmentStart), 1);
            line.splice(0, 0, closestSegmentStart[0]);
            continue loop;
          }
        }
        lines.push(shape.lineSegments.pop());
      }

      if (openShape) {
        for (const line of lines) {
          const closed = distanceTo(line[0], line[line.length - 1]) < .001;
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
