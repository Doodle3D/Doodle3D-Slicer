import 'core-js'; // polyfills
import slice from './sliceActions/slice.js';
import { JSONLoader } from 'three/src/loaders/JSONLoader.js';

const loader = new JSONLoader();

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
      const buffers = [];
      const { settings, geometry: JSONGeometry, constructLinePreview } = data;
      const { geometry } = loader.parse(JSONGeometry.data);

      const gcode = slice(settings, geometry, constructLinePreview, onProgress);

      if (gcode.linePreview) {
        const position = gcode.linePreview.geometry.getAttribute('position').array;
        const color = gcode.linePreview.geometry.getAttribute('color').array;
        buffers.push(position.buffer, color.buffer);
        gcode.linePreview = { position, color };
      }

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      }, buffers);
      break;
    }
  }
}, false);
