import 'core-js'; // polyfills
import slice from './sliceActions/slice.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { JSONLoader } from 'three/src/loaders/JSONLoader.js';

const onProgress = progress => {
  self.postMessage({
    message: 'PROGRESS',
    data: progress
  });
}

const loader = new JSONLoader();

self.addEventListener('message', async (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const { settings, geometry: JSONGeometry, constructLinePreview, openObjectIndexes } = data;
      const { geometry } = loader.parse(JSONGeometry.data);

      const gcode = slice(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);

      const buffers = [];
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
