import Shape from 'clipper-js';
import { PRECISION } from '../constants.js';

const offsetOptions = {
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

  const brim = firstLayer.parts.reduce((brim, { shape }) => (
    brim.join(shape.offset(nozzleRadius, {
      ...offsetOptions,
      endType: shape.closed ? 'etClosedPolygon' : 'etOpenRound'
    }))
  ), new Shape([], true)).simplify('pftNonZero');

  firstLayer.brim = new Shape([], true);

  for (let offset = 0; offset < brimSize; offset += nozzleDiameter) {
    const brimPart = brim.offset(offset, offsetOptions);
    firstLayer.brim = firstLayer.brim.join(brimPart);
  }
}
