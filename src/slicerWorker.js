import slice from './sliceActions/slice.js';
import * as THREE from 'three.js';

const loader = new THREE.JSONLoader();

self.addEventListener('message', (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const { geometry: JSONGeometry, settings } = data;

      const { geometry } = new loader.parse(JSONGeometry.data);

      const gcode = slice(geometry, settings);

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      });
      break;
    }
  }
}, false);
