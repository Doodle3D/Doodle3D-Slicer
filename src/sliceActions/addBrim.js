import Shape from 'Doodle3D/clipper-js';
import { PRECISION } from '../constants.js';

const offsetOptions = {
  jointType: 'jtRound',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function addBrim(slices, settings) {
  let {
    brim: { offset: brimOffset }
  } = settings;
  brimOffset /= PRECISION;

  const [firstLayer] = slices;

  firstLayer.brim = firstLayer.parts.reduce((brim, { shape }) => (
    brim.join(shape.offset(brimOffset, {
      ...offsetOptions,
      endType: shape.closed ? 'etClosedPolygon' : 'etOpenRound'
    }))
  ), new Shape([], true)).simplify('pftNonZero');
}
