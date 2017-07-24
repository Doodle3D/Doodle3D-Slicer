import slice from './sliceActions/slice.js';
import * as THREE from 'three';

const loader = new THREE.JSONLoader();

const onProgress = progress => {
  self.postMessage({
    message: 'PROGRESS',
    data: progress
  });
}

self.addEventListener('message', (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const { settings, geometry: JSONGeometry } = data;
      const { geometry } = loader.parse(JSONGeometry.data);

      const gcode = slice(settings, geometry, onProgress);

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      });
      break;
    }
  }
}, false);
