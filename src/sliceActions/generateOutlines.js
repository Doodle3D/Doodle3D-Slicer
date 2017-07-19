import Shape from 'Doodle3D/clipper-js';

export default function calculateOutlines(slices, settings) {
  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    slice.outline = slice.parts.reduce((shape, part) => {
      if (part.outerLine) shape.join(part.outerLine);
      return shape;
    }, new Shape([], true));
  }
}
