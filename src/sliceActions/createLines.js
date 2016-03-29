import THREE from 'three.js';

export default function createLines(geometry, settings) {
  console.log('constructing unique lines from geometry');

  var lines = [];
  var lineLookup = {};

  var addLine = (a, b) => {
    var index = lineLookup[`${b}_${a}`];

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

  for (var i = 0; i < geometry.faces.length; i ++) {
    var face = geometry.faces[i];
    if (face.normal.y !== 1 && face.normal.y !== -1) {
      var normal = new THREE.Vector2(face.normal.z, face.normal.x).normalize();

      // check for only adding unique lines
      // returns index of said line
      var a = addLine(face.a, face.b);
      var b = addLine(face.b, face.c);
      var c = addLine(face.c, face.a);

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
