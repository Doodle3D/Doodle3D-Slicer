import Shape from 'Doodle3D/clipper-js';

export default function getFillTemplate(bounds, size, even, uneven) {
  var shape = new Shape([], false);

  var left = Math.floor(bounds.left / size) * size;
  var right = Math.ceil(bounds.right / size) * size;
  var top = Math.floor(bounds.top / size) * size;
  var bottom = Math.ceil(bounds.bottom / size) * size;

  var width = right - left;

  if (even) {
    for (var y = top; y <= bottom + width; y += size) {
      shape.paths.push([
        {X: left, Y: y},
        {X: right, Y: y - width}
      ]);
    }
  }
  if (uneven) {
    for (var y = top - width; y <= bottom; y += size) {
      shape.paths.push([
        {X: left, Y: y},
        {X: right, Y: y + width}
      ]);
    }
  }

  return shape;
}
