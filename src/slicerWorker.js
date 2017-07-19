import slice from './sliceActions/slice.js';
import * as THREE from 'three';

const loader = new THREE.JSONLoader();

const onProgress = progress => {
  self.postMessage({
    message: 'PROGRESS',
    data: { progress }
  });
}

self.addEventListener('message', (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const { geometry: JSONGeometry, settings } = data;

      const { geometry } = new loader.parse(JSONGeometry.data);

      const gcode = slice(geometry, settings, onProgress);

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      });
      break;
    }
  }
}, false);
