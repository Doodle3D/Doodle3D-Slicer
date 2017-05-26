import * as THREE from 'three.js';
import { PRECISION } from '../constants.js';

const inversePrecision = 1 / PRECISION;

export default function removePrecision(slices) {
  console.log('remove precision');

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.shape.closed) {
        part.outerLine.scaleDown(inversePrecision);
        for (let i = 0; i < part.innerLines.length; i ++) {
          const innerLine = part.innerLines[i];
          innerLine.scaleDown(inversePrecision);
        }
        part.fill.scaleDown(inversePrecision);
      } else {
        part.shape.scaleDown(inversePrecision);
      }
    }

    if (slice.support !== undefined) {
      slice.support.scaleDown(inversePrecision);
    }
    if (slice.brim !== undefined) {
      slice.brim.scaleDown(inversePrecision);
    }
  }
}
