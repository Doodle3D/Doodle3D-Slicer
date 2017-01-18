import 'three.js';
import { PRECISION } from '../constants.js';

export default function removePrecision(slices) {
  console.log('remove precision');

  const start = new THREE.Vector2(0, 0);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (part.shape.closed) {
        part.outerLine.scaleDown(1 / PRECISION);
        for (let i = 0; i < part.innerLines.length; i ++) {
          const innerLine = part.innerLines[i];
          innerLine.scaleDown(1 / PRECISION);
        }
        part.fill.scaleDown(1 / PRECISION);
      }
    }

    if (slice.support !== undefined) {
      slice.support.scaleDown(1 / PRECISION);
    }
    if (slice.brim !== undefined) {
      slice.brim.scaleDown(1 / PRECISION);
    }
  }
}
