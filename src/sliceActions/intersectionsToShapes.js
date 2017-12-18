import { subtract, normal, normalize, dot, distanceTo, clone } from './helpers/VectorUtils.js';

export default function intersectionsToShapes(intersectionLayers, faces, open, settings) {
  const layers = [];

  for (let layer = 1; layer < intersectionLayers.length; layer ++) {
    const fillShapes = [];
    const lineShapesOpen = [];
    const lineShapesClosed = [];

    const { points, faceIndexes } = intersectionLayers[layer];

    if (faceIndexes.length === 0) continue;

    const shapes = {};

    for (let i = 0; i < faceIndexes.length; i ++) {
      const { lineIndexes, objectIndex, flatNormal } = faces[faceIndexes[i]];

      const a = points[lineIndexes[0]];
      const b = points[lineIndexes[1]];
      const c = points[lineIndexes[2]];

      const lineSegment = [];
      if (a && b) {
        lineSegment.push(a, b);
      } else if (b && c) {
        lineSegment.push(b, c);
      } else if (c && a) {
        lineSegment.push(c, a);
      } else {
        continue;
      }

      const segmentNormal = normalize(normal(subtract(lineSegment[1], lineSegment[0])));
      if (dot(segmentNormal, flatNormal) < 0) lineSegment.reverse();

      if (!shapes[objectIndex]) shapes[objectIndex] = { lineSegments: [] };
      const shape = shapes[objectIndex];

      shape.lineSegments.push(lineSegment)
    }

    for (const objectIndex in shapes) {
      const shape = shapes[objectIndex];
      const openShape = open[objectIndex];

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
