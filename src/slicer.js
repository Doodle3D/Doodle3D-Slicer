import { VertexColors } from 'three/src/constants.js';
import { BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
import { LineSegments } from 'three/src/objects/LineSegments.js';
import _slice from './sliceActions/slice.js';
import SlicerWorker from './slicer.worker.js';
import sketchDataToJSON from 'doodle3d-core/shape/sketchDataToJSON';

export function slice(settings, sketch, matrix, sync = false, constructLinePreview = false, onProgress) {
  if (sync) {
    return sliceSync(settings, sketch, matrix, constructLinePreview, onProgress);
  } else {
    return sliceAsync(settings, sketch, matrix, constructLinePreview, onProgress);
  }
}

export function sliceSync(settings, sketch, matrix, constructLinePreview, onProgress) {
  return _slice(settings, sketch, matrix, constructLinePreview, onProgress);
}

export function sliceAsync(settings, sketch, matrix, constructLinePreview, onProgress) {
  return new Promise((resolve, reject) => {
    // create the slicer worker
    const slicerWorker = new SlicerWorker();

    slicerWorker.onerror = error => {
      slicerWorker.terminate();
      reject(error);
    };

    // listen to messages send from worker
    slicerWorker.addEventListener('message', (event) => {
      const { message, data } = event.data;
      switch (message) {
        case 'SLICE': {
          slicerWorker.terminate();

          if (data.gcode.linePreview) {
            const geometry = new BufferGeometry();

            const { position, color } = data.gcode.linePreview;
            geometry.addAttribute('position', new BufferAttribute(new Float32Array(position), 3));
            geometry.addAttribute('color', new BufferAttribute(new Float32Array(color), 3));

            const material = new LineBasicMaterial({ vertexColors: VertexColors });
            const linePreview = new LineSegments(geometry, material);

            data.gcode.linePreview = linePreview;
          }

          resolve(data.gcode);
          break;
        }
        case 'PROGRESS': {
          if (typeof onProgress !== 'undefined') {
            onProgress(data);
          }
          break;
        }
      }
    });

    // send geometry and settings to worker to start the slicing progress
    matrix = matrix.toArray();
    sketch = sketchDataToJSON(sketch);
    slicerWorker.postMessage({
      message: 'SLICE',
      data: { settings, sketch, matrix, constructLinePreview }
    });
  });
}
