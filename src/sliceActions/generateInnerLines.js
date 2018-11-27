import { PRECISION } from '../constants.js';

const OFFSET_OPTIONS = {
  jointType: 'jtSquare',
  endType: 'etClosedPolygon',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function generateInnerLines(slices, settings) {
  // need to scale up everything because of clipper rounding errors
  let {
    nozzleDiameter,
    thickness: { shell: shellThickness }
  } = settings;

  nozzleDiameter /= PRECISION;
  shellThickness /= PRECISION;

  const nozzleRadius = nozzleDiameter / 2;
  const numShells = Math.round(shellThickness / nozzleDiameter);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    for (let i = 0; i < slice.parts.length; i ++) {
      const part = slice.parts[i];

      if (!part.closed) continue;

      const outerLine = part.shape.offset(-nozzleRadius, OFFSET_OPTIONS);

      if (outerLine.paths.length === 0) continue;

      part.shell.push(outerLine);

      // start with 1 because outerLine is the 1st (0) shell
      for (let inset = 1; inset < numShells; inset += 1) {
        const offset = inset * nozzleDiameter;

        const shell = outerLine.offset(-offset, OFFSET_OPTIONS);

        if (shell.paths.length === 0) {
          break;
        } else {
          part.shell.push(shell);
        }
      }
    }

    slice.parts = slice.parts.filter(part => !part.closed || part.shell.length !== 0);
  }
}
