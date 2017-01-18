import 'three.js';
import { PRECISION } from '../constants.js';

const offsetOptions = {
  jointType: 'jtSquare',
  endType: 'etClosedPolygon',
  miterLimit: 2.0,
  roundPrecision: 0.25
};

export default function addBrim(slices, settings) {
  console.log('add brim');

  let { brimOffset } = settings.config;
  brimOffset /= PRECISION;

  const fistLayer = slices[0];
  fistLayer.brim = fistLayer
    .getOutline()
    .offset(brimOffset, offsetOptions);
}
