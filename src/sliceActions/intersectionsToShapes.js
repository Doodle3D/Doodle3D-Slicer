import * as THREE from 'three';
import Shape from 'clipper-js';

export default function intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings) {
  const layers = [];

  for (let layer = 1; layer < layerIntersectionIndexes.length; layer ++) {
    const intersectionIndexes = layerIntersectionIndexes[layer];
    const intersectionPoints = layerIntersectionPoints[layer];

    if (intersectionIndexes.length === 0) continue;

    const closedShapes = [];
    const openShapes = [];
    for (let i = 0; i < intersectionIndexes.length; i ++) {
      let index = intersectionIndexes[i];

      if (typeof intersectionPoints[index] === 'undefined') continue;

      const shape = [];

      const firstPoints = [index];
      const { openGeometry } = lines[index];
      let isFirstPoint = true;
      let openShape = true;

      while (index !== -1) {
        const intersection = intersectionPoints[index];
        // uppercase X and Y because clipper vector
        shape.push(intersection);

        delete intersectionPoints[index];

        const connects = lines[index].connects;
        const faceNormals = lines[index].normals;

        for (let i = 0; i < connects.length; i ++) {
          index = connects[i];

          if (firstPoints.includes(index) && shape.length > 2) {
            openShape = false;
            index = -1;
            break;
          }

          // Check if index has an intersection or is already used
          if (typeof intersectionPoints[index] !== 'undefined') {
            const faceNormal = faceNormals[Math.floor(i / 2)];

            const a = new THREE.Vector2(intersection.x, intersection.y);
            const b = new THREE.Vector2(intersectionPoints[index].x, intersectionPoints[index].y);

            // can't calculate normal between points if distance is smaller as 0.0001
            if ((faceNormal.x === 0 && faceNormal.y === 0) || a.distanceTo(b) < 0.0001) {
              if (isFirstPoint) {
                firstPoints.push(index);
              }

              delete intersectionPoints[index];

              connects.push(...lines[index].connects);
              faceNormals.push(...lines[index].normals);
              index = -1;
            } else {
              // make sure the path goes the right direction
              // THREE.Vector2.normal is not yet implimented
              // const normal = a.sub(b).normal().normalize();
              const normal = a.sub(b);
              normal.set(-normal.y, normal.x).normalize();

              if (normal.dot(faceNormal) > 0) {
                break;
              } else {
                index = -1;
              }
            }
          } else {
            index = -1;
          }
        }
        isFirstPoint = false;
      }

      if (openShape) {
        index = firstPoints[0];

        while (index !== -1) {
          if (!firstPoints.includes(index)) {
            const intersection = intersectionPoints[index];
            shape.unshift(intersection);

            delete intersectionPoints[index];
          }

          const connects = lines[index].connects;

          for (let i = 0; i < connects.length; i ++) {
            index = connects[i];

            if (typeof intersectionPoints[index] !== 'undefined') {
              break;
            } else {
              index = -1;
            }
          }
        }
      }

      if (openGeometry) {
        if (!openShape) shape.push(shape[0].clone());
        openShapes.push(shape);
      } else {
        closedShapes.push(shape);
      }
    }

    layers.push({ closedShapes, openShapes });
  }

  return layers;
}
