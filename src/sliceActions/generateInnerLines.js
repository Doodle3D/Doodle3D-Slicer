import { PRECISION } from '../constants.js'

const offsetOptions = {
  jointType: 'jtSquare',
  endType: 'etClosedPolygon',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function generateInnerLines(slices, settings) {
  // need to scale up everything because of clipper rounding errors
  let {
    layerHeight,
    nozzleDiameter,
    shell: { thickness: shellThickness }
  } = settings;
  nozzleDiameter /= PRECISION;
  shellThickness /= PRECISION;
  const nozzleRadius = nozzleDiameter / 2;
  const shells = Math.round(shellThickness / nozzleDiameter);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (!part.shape.closed) continue;

      const outerLine = part.shape.offset(-nozzleRadius, offsetOptions);

      if (outerLine.paths.length > 0) {
        part.outerLine.join(outerLine);

        for (let shell = 1; shell <= shells; shell += 1) {
          const offset = shell * nozzleDiameter;

          const innerLine = outerLine.offset(-offset, offsetOptions);

          if (innerLine.paths.length > 0) {
            part.innerLines.push(innerLine);
          } else {
            break;
          }
        }
      }
    }
  }
}
