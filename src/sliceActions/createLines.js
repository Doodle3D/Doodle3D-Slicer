import * as THREE from 'three';
import { normalize } from './helpers/VectorUtils.js';

function addLine(geometry, lineLookup, lines, a, b, faceIndex) {
  let index;
  if (typeof lineLookup[`${b}_${a}`] !== 'undefined') {
    index = lineLookup[`${b}_${a}`];
  } else {
    index = lines.length;
    lineLookup[`${a}_${b}`] = index;

    const line = new THREE.Line3(geometry.vertices[a], geometry.vertices[b]);
    const faces = [];
    lines.push({ line, faces });
  }
  lines[index].faces.push(faceIndex);

  return index;
}

export default function createLines(geometry, settings) {
  const faces = [];
  const lines = [];
  const lineLookup = {};

  for (let i = 0; i < geometry.faces.length; i ++) {
    const { normal, materialIndex: objectIndex, a, b, c } = geometry.faces[i];

    // skip faces that point up or down
    if (normal.y > .999 || normal.y < -.999) {
      faces.push(null);
      continue;
    }

    const indexA = addLine(geometry, lineLookup, lines, a, b, i);
    const indexB = addLine(geometry, lineLookup, lines, b, c, i);
    const indexC = addLine(geometry, lineLookup, lines, c, a, i);

    const flatNormal = normalize({ x: normal.z, y: normal.x });
    const lineIndexes = [indexA, indexB, indexC];

    faces.push({ lineIndexes, flatNormal, objectIndex });
  }

  return { lines, faces };
}
