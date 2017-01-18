import Settings from './Settings.js';
import slice from './sliceActions/slice.js';
import 'three.js';

const loader = new THREE.JSONLoader();

self.addEventListener('message', (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const { geometry: JSONGeometry, config } = data;

      const { geometry } = new loader.parse(JSONGeometry.data);
      const settings = new Settings(config);

      const gcode = slice(geometry, settings);

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      });
      break;
    }
  }
}, false);
