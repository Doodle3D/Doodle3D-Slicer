import Shape from '@doodle3d/clipper-js';

export default function calculateOutlines(slices) {
  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    slice.outline = slice.parts.reduce((shape, part) => {
      if (part.closed) {
        const [outerLine] = part.shell;
        shape.join(outerLine);
      }
      return shape;
    }, new Shape([], true));
  }
}
