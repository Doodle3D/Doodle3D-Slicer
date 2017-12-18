import { generateExportMesh } from 'doodle3d-core/utils/exportUtils.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { Geometry } from 'three/src/core/Geometry.js';
import { FrontSide, DoubleSide } from 'three/src/constants.js';
import { BoxGeometry } from 'three/src/geometries/BoxGeometry.js';

export default function generateGeometry(sketch, matrix) {
  const { geometry, material } = generateExportMesh(sketch, {
    unionGeometry: false,
    offsetSingleWalls: false,
    matrix
  });

  const open = material.map(({ side }) => {
    switch (side) {
      case FrontSide:
        return false;
      case DoubleSide:
        return true;
      default:
        return false;
    }
  });

  geometry.computeFaceNormals();
  return { geometry, open };
}
