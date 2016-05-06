import THREE from 'three.js';

export default function optimizePaths(slices, settings) {
  console.log('optimize paths');

  const start = new THREE.Vector2(0, 0);

  for (let layer = 0; layer < slices.length; layer ++) {
    const slice = slices[layer];

    const end = slice.optimizePaths(start);

    start.copy(end);
  }
}
