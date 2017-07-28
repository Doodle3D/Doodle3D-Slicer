import { PRECISION } from '../constants.js';

const inversePrecision = 1 / PRECISION;

export default function removePrecision(slices) {
  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.closed) {
        for (let i = 0; i < part.shell.length; i ++) {
          const innerLine = part.shell[i];
          innerLine.scaleDown(inversePrecision);
        }
        part.innerFill.scaleDown(inversePrecision);
        part.outerFill.scaleDown(inversePrecision);
      } else {
        part.shape.scaleDown(inversePrecision);
      }
    }

    if (typeof slice.support !== 'undefined') {
      slice.support.scaleDown(inversePrecision);
    }
    if (typeof slice.brim !== 'undefined') {
      slice.brim.scaleDown(inversePrecision);
    }
  }
}
