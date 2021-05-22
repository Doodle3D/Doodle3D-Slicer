import Shape from '@doodle3d/clipper-js';

export default function getFillTemplate(bounds, gridSize, even, uneven) {
  const paths = [];

  const size = Math.sqrt(2 * Math.pow(gridSize, 2));

  const left = Math.floor(bounds.left / size) * size;
  const right = Math.ceil(bounds.right / size) * size;
  const top = Math.floor(bounds.top / size) * size;
  const bottom = Math.ceil(bounds.bottom / size) * size;

  const width = right - left;

  if (even) {
    for (let y = top; y <= bottom + width; y += size) {
      paths.push([
        { x: left, y },
        { x: right, y: y - width }
      ]);
    }
  }
  if (uneven) {
    for (let y = top - width; y <= bottom; y += size) {
      paths.push([
        { x: left, y },
        { x: right, y: y + width }
      ]);
    }
  }

  return new Shape(paths, false, true, true);
}
