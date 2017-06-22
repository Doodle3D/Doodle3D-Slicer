import * as THREE from 'three.js';

function addLine(geometry, lineLookup, lines, a, b) {
  const index = lines.length;
  lineLookup[`${a}_${b}`] = index;

  lines.push({
    line: new THREE.Line3(geometry.vertices[a], geometry.vertices[b]),
    connects: [],
    normals: [],
    open: false
  });

  return index;
}

export default function createLines(geometry, settings, openClosed) {
  console.log('constructing unique lines from geometry');

  const lines = [];
  const lineLookup = {};

  for (let i = 0; i < geometry.faces.length; i ++) {
    const face = geometry.faces[i];
    const open = openClosed[i];

    if (face.normal.y !== 1 && face.normal.y !== -1) {
      const normal = new THREE.Vector2(face.normal.z, face.normal.x).normalize();

      const lookupA = lineLookup[`${face.b}_${face.a}`];
      const lookupB = lineLookup[`${face.c}_${face.b}`];
      const lookupC = lineLookup[`${face.a}_${face.c}`];

      // only add unique lines
      // returns index of said line
      const indexA = typeof lookupA !== 'undefined' ? lookupA : addLine(geometry, lineLookup, lines, face.a, face.b);
      const indexB = typeof lookupB !== 'undefined' ? lookupB : addLine(geometry, lineLookup, lines, face.b, face.c);
      const indexC = typeof lookupC !== 'undefined' ? lookupC : addLine(geometry, lineLookup, lines, face.c, face.a);

      // set connecting lines (based on face)
      lines[indexA].connects.push(indexB, indexC);
      lines[indexB].connects.push(indexC, indexA);
      lines[indexC].connects.push(indexA, indexB);

      lines[indexA].normals.push(normal);
      lines[indexB].normals.push(normal);
      lines[indexC].normals.push(normal);

      lines[indexA].open = open;
      lines[indexB].open = open;
      lines[indexC].open = open;
    }
  }

  return lines;
}
