import THREE from 'three.js';
import { PRECISION } from '../constants.js';

const offsetOptions = {
  jointType: 'jtSquare',
  endType: 'etClosedPolygon',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function optimizePaths(slices, settings) {
  console.log("opimize paths");

  const brimOffset = settings.config["brimOffset"] / PRECISION;

  const start = new THREE.Vector2(0, 0);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    if (layer === 0) {
      slice.brim = slice.getOutline().offset(brimOffset, offsetOptions);
    }

    // start = slice.optimizePaths(start);

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
