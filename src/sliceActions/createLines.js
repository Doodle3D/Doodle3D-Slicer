import { normalize } from './helpers/vector2.js';

function addLine(vertices, lineLookup, lines, a, b, faceIndex) {
  let index;
  if (typeof lineLookup[`${b}_${a}`] !== 'undefined') {
    index = lineLookup[`${b}_${a}`];
  } else {
    index = lines.length;
    lineLookup[`${a}_${b}`] = index;

    const start = { x: vertices[a * 3], y: vertices[a * 3 + 1], z: vertices[a * 3 + 2] };
    const end = { x: vertices[b * 3], y: vertices[b * 3 + 1], z: vertices[b * 3 + 2] };

    const line = { start, end };
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

  for (let i = 0; i < geometry.objectIndexes.length; i ++) {
    const i3 = i * 3;
    const objectIndex = geometry.objectIndexes[i];
    const normal = {
      x: geometry.faceNormals[i3],
      y: geometry.faceNormals[i3 + 1],
      z: geometry.faceNormals[i3 + 2]
    };
    const a = geometry.faces[i3];
    const b = geometry.faces[i3 + 1];
    const c = geometry.faces[i3 + 2];

    // skip faces that point up or down
    if (normal.y > .999 || normal.y < -.999) {
      faces.push(null);
      continue;
    }

    const indexA = addLine(geometry.vertices, lineLookup, lines, a, b, i);
    const indexB = addLine(geometry.vertices, lineLookup, lines, b, c, i);
    const indexC = addLine(geometry.vertices, lineLookup, lines, c, a, i);

    const flatNormal = normalize({ x: normal.z, y: normal.x });
    const lineIndexes = [indexA, indexB, indexC];

    faces.push({ lineIndexes, flatNormal, objectIndex });
  }

  return { lines, faces };
}
