import Shape from '@doodle3d/clipper-js';
import { PRECISION } from '../constants.js';

const OFFSET_OPTIONS = {
  jointType: 'jtRound',
  miterLimit: 2.0,
  roundPrecision: 0.25,
  endType: 'etClosedPolygon'
};

export default function addBrim(slices, settings) {
  let {
    brim: { size: brimSize },
    nozzleDiameter
  } = settings;

  nozzleDiameter /= PRECISION;
  brimSize /= PRECISION;
  const nozzleRadius = nozzleDiameter / 2;

  const [firstLayer] = slices;

  const brim = firstLayer.parts.reduce((_brim, { shape }) => (
    _brim.join(shape.offset(nozzleRadius, {
      ...OFFSET_OPTIONS,
      endType: shape.closed ? 'etClosedPolygon' : 'etOpenRound'
    }))
  ), new Shape([], true)).simplify('pftNonZero');

  firstLayer.brim = new Shape([], true);

  for (let offset = 0; offset < brimSize; offset += nozzleDiameter) {
    const brimPart = brim.offset(offset, OFFSET_OPTIONS);
    firstLayer.brim = firstLayer.brim.join(brimPart);
  }
}
