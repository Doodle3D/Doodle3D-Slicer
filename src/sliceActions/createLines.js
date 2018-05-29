import * as vector2 from './helpers/vector2.js';
import * as vector3 from './helpers/vector3.js';

export default function createLines(geometry) {
  const faces = [];
  const lines = [];
  const lineLookup = {};

  for (let i = 0; i < geometry.objectIndexes.length; i ++) {
    const objectIndex = geometry.objectIndexes[i];
    const { x: a, y: b, z: c } = getVertex(geometry.faces, i);
    const normal = calculateNormal(geometry.vertices, a, b, c);

    // skip faces that point up or down
    if (normal.y > 0.999 || normal.y < -0.999) {
      faces.push(null);
      continue;
    }

    const indexA = addLine(geometry.vertices, lineLookup, lines, a, b, i);
    const indexB = addLine(geometry.vertices, lineLookup, lines, b, c, i);
    const indexC = addLine(geometry.vertices, lineLookup, lines, c, a, i);

    const flatNormal = vector2.normalize({ x: normal.z, y: normal.x });
    const lineIndexes = [indexA, indexB, indexC];

    faces.push({ lineIndexes, flatNormal, objectIndex });
  }

  return { lines, faces };
}

function addLine(vertices, lineLookup, lines, a, b, faceIndex) {
  let index;
  if (typeof lineLookup[`${b}_${a}`] !== 'undefined') {
    index = lineLookup[`${b}_${a}`];
  } else {
    const start = getVertex(vertices, a);
    const end = getVertex(vertices, b);
    const line = { start, end };
    const faces = [];

    index = lines.length;
    lineLookup[`${a}_${b}`] = index;
    lines.push({ line, faces });
  }
  lines[index].faces.push(faceIndex);
  return index;
}

function calculateNormal(vertices, a, b, c) {
  a = getVertex(vertices, a);
  b = getVertex(vertices, b);
  c = getVertex(vertices, c);

  const cb = vector3.subtract(c, b);
  const ab = vector3.subtract(a, b);
  const normal = vector3.normalize(vector3.cross(cb, ab));

  return normal;
}

function getVertex(vertices, i) {
  const i3 = i * 3;
  return {
    x: vertices[i3],
    y: vertices[i3 + 1],
    z: vertices[i3 + 2]
  };
}
