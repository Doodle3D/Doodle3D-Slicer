import 'core-js'; // polyfills
import slice from './sliceActions/slice.js';
import { stringToTypedArray } from './sliceActions/helpers/binary.js';

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
      const { settings, geometry, constructLinePreview, openObjectIndexes } = data;

      const gcode = slice(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);
      gcode.gcode = stringToTypedArray(gcode.gcode);

      const buffers = [gcode.gcode.buffer];
      if (gcode.linePreview) {
        buffers.push(gcode.linePreview.positions.buffer);
        buffers.push(gcode.linePreview.colors.buffer);
      }

      self.postMessage({
        message: 'SLICE',
        data: { gcode }
      }, buffers);
      break;
    }
  }
}, false);
