import Shape from 'Doodle3D/clipper-js';
import * as THREE from 'three.js';
import { PRECISION } from '../constants.js';

const offsetOptions = {
  jointType: 'jtRound',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function addBrim(slices, settings) {
  console.log('add brim');

  let { brimOffset } = settings.config;
  brimOffset /= PRECISION;

  const [fistLayer] = slices;

  fistLayer.brim = fistLayer.parts.reduce((brim, { shape }) => {
    brim.join(shape.offset(brimOffset, {
      ...offsetOptions,
      endType: shape.closed ? 'etClosedPolygon' : 'etOpenRound'
    }));
    return brim;
  }, new Shape([], true)).simplify('pftNonZero');
}
