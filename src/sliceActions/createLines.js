import * as THREE from 'three';

function addLine(geometry, lineLookup, lines, a, b, isFlat) {
  const index = lines.length;
  lineLookup[`${a}_${b}`] = index;

  lines.push({
    line: new THREE.Line3(geometry.vertices[a], geometry.vertices[b]),
    connects: [],
    normals: [],
    isFlat
  });

  return index;
}

export default function createLines(geometry, settings) {
  const lines = [];
  const lineLookup = {};

  for (let i = 0; i < geometry.faces.length; i ++) {
    const face = geometry.faces[i];

    const lookupA = lineLookup[`${face.b}_${face.a}`];
    const lookupB = lineLookup[`${face.c}_${face.b}`];
    const lookupC = lineLookup[`${face.a}_${face.c}`];

    const isFlat = face.normal.y !== 1 && face.normal.y !== -1;

    // only add unique lines
    // returns index of said line
    const lineIndexA = typeof lookupA !== 'undefined' ? lookupA : addLine(geometry, lineLookup, lines, face.a, face.b, isFlat);
    const lineIndexB = typeof lookupB !== 'undefined' ? lookupB : addLine(geometry, lineLookup, lines, face.b, face.c, isFlat);
    const lineIndexC = typeof lookupC !== 'undefined' ? lookupC : addLine(geometry, lineLookup, lines, face.c, face.a, isFlat);

    // set connecting lines (based on face)
    lines[lineIndexA].connects.push(lineIndexB, lineIndexC);
    lines[lineIndexB].connects.push(lineIndexC, lineIndexA);
    lines[lineIndexC].connects.push(lineIndexA, lineIndexB);

    const normal = new THREE.Vector2(face.normal.z, face.normal.x).normalize();
    lines[lineIndexA].normals.push(normal);
    lines[lineIndexB].normals.push(normal);
    lines[lineIndexC].normals.push(normal);
  }

  return lines;
}
