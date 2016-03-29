import THREE from 'three.js';

function addLine(geometry, lineLookup, lines, a, b) {
  let index = lineLookup[`${b}_${a}`];

  if (index === undefined) {
    index = lines.length;
    lineLookup[`${a}_${b}`] = index;

    lines.push({
      line: new THREE.Line3(geometry.vertices[a], geometry.vertices[b]),
      connects: [],
      normals: []
    });
  }

  return index;
}

export default function createLines(geometry, settings) {
  console.log('constructing unique lines from geometry');

  const lines = [];
  const lineLookup = {};

  for (let i = 0; i < geometry.faces.length; i ++) {
    const face = geometry.faces[i];
    if (face.normal.y !== 1 && face.normal.y !== -1) {
      const normal = new THREE.Vector2(face.normal.z, face.normal.x).normalize();

      // check for only adding unique lines
      // returns index of said line
      const a = addLine(geometry, lineLookup, lines, face.a, face.b);
      const b = addLine(geometry, lineLookup, lines, face.b, face.c);
      const c = addLine(geometry, lineLookup, lines, face.c, face.a);

      // set connecting lines (based on face)
      lines[a].connects.push(b, c);
      lines[b].connects.push(c, a);
      lines[c].connects.push(a, b);

      lines[a].normals.push(normal);
      lines[b].normals.push(normal);
      lines[c].normals.push(normal);
    }
  }

  return lines;
}
