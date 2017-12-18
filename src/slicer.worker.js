import slice from './sliceActions/slice.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import JSONToSketchData from 'doodle3d-core/shape/JSONToSketchData';
import createSceneData from 'doodle3d-core/d3/createSceneData.js';

const onProgress = progress => {
  self.postMessage({
    message: 'PROGRESS',
    data: progress
  });
}

self.addEventListener('message', async (event) => {
  const { message, data } = event.data;
  switch (message) {
    case 'SLICE': {
      const buffers = [];
      const { settings, sketch: sketchData, matrix: matrixArray, constructLinePreview } = data;
      const sketch = createSceneData(await JSONToSketchData(sketchData));
      const matrix = new Matrix4().fromArray(matrixArray);

      const gcode = slice(settings, sketch, matrix, constructLinePreview, onProgress);

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
