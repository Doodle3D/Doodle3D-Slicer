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
    lines.push({ line, faces: [] });
  }

  const { faces } = lines[index];
  faces.push(faceIndex);

  return index;
}

export default function createLines(geometry, settings) {
  const lines = [];
  const lineLookup = {};

  const faces = geometry.faces.map((face, i) => {
    const { normal, materialIndex: objectIndex, a, b, c } = geometry.faces[i];

    // skip faces that point up or down
    if (normal.y > .999 || normal.y < -.999) return;

    const indexA = addLine(geometry, lineLookup, lines, a, b, i);
    const indexB = addLine(geometry, lineLookup, lines, b, c, i);
    const indexC = addLine(geometry, lineLookup, lines, c, a, i);

    const flatNormal = normalize({ x: normal.z, y: normal.x });
    const lineIndexes = [indexA, indexB, indexC];
    return { lineIndexes, flatNormal, objectIndex };
  });

  return { lines, faces };
}
