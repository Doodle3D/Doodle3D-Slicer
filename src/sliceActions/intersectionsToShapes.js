import THREE from 'three.js';
import Shape from 'Doodle3D/clipper-js';

export default function intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings) {
  console.log("generating slices");

  var layers = [];

  for (var layer = 1; layer < layerIntersectionIndexes.length; layer ++) {
    var intersectionIndexes = layerIntersectionIndexes[layer];
    var intersectionPoints = layerIntersectionPoints[layer];

    if (intersectionIndexes.length === 0) {
      continue;
    }

    var closedShapes = [];
    var openShapes = [];
    for (var i = 0; i < intersectionIndexes.length; i ++) {
      var index = intersectionIndexes[i];

      if (intersectionPoints[index] === undefined) {
        continue;
      }

      var firstPoints = [index];
      var isFirstPoint = true;
      var closed = false;

      var shape = [];

      while (index !== -1) {
        var intersection = intersectionPoints[index];
        // uppercase X and Y because clipper vector
        shape.push(intersection);

        delete intersectionPoints[index];

        var connects = lines[index].connects;
        var faceNormals = lines[index].normals;

        for (var j = 0; j < connects.length; j ++) {
          var index = connects[j];

          if (firstPoints.indexOf(index) !== -1 && shape.length > 2) {
            closed = true;
            index = -1;
            break;
          }

          // Check if index has an intersection or is already used
          if (intersectionPoints[index] !== undefined) {
            var faceNormal = faceNormals[Math.floor(j / 2)];

            var a = new THREE.Vector2(intersection.x, intersection.y);
            var b = new THREE.Vector2(intersectionPoints[index].x, intersectionPoints[index].y);

            // can't calculate normal between points if distance is smaller as 0.0001
            if ((faceNormal.x === 0 && faceNormal.y === 0) || a.distanceTo(b) < 0.0001) {
              if (isFirstPoint) {
                firstPoints.push(index);
              }

              delete intersectionPoints[index];

              connects = connects.concat(lines[index].connects);
              faceNormals = faceNormals.concat(lines[index].normals);
              index = -1;
            }
            else {
              // make sure the path goes the right direction
              // THREE.Vector2.normal is not yet implimented
              // var normal = a.sub(b).normal().normalize();
              var normal = a.sub(b);
              normal.set(-normal.y, normal.x).normalize();

              if (normal.dot(faceNormal) > 0) {
                break;
              }
              else {
                index = -1;
              }
            }
          }
          else {
            index = -1;
          }
        }
        isFirstPoint = false;
      }

      if (!closed) {
        var index = firstPoints[0];

        while (index !== -1) {
          if (firstPoints.indexOf(index) === -1) {
            var intersection = intersectionPoints[index];
            shape.unshift(intersection);

            delete intersectionPoints[index];
          }

          var connects = lines[index].connects;

          for (var i = 0; i < connects.length; i ++) {
            var index = connects[i];

            if (intersectionPoints[index] !== undefined) {
              break;
            }
            else {
              index = -1;
            }
          }
        }
      }

      if (closed) {
        closedShapes.push(shape);
      }
      else {
        openShapes.push(shape);
      }
    }

    layers.push({ closedShapes, openShapes });
  }

  return layers;
}
