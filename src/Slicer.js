import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicer.worker.js';

export default class {
  setMesh(mesh) {
    mesh.updateMatrix();

    return this.setGeometry(mesh.geometry, mesh.matrix);
  }
  setGeometry(geometry, matrix) {
    if (geometry.isBufferGeometry) {
      geometry = new THREE.Geometry().fromBufferGeometry(geometry);
    } else if (geometry.isGeometry) {
      geometry = geometry.clone();
    } else {
      throw new Error('Geometry is not an instance of BufferGeometry or Geometry');
    }

    if (typeof matrix !== 'undefined') {
      geometry.applyMatrix(matrix);
    }

    this.geometry = geometry;

    return this;
  }
  sliceSync(settings, onProgress) {
    return slice(this.geometry, settings, onProgress);
  }
  slice(settings, onProgress) {
    if (!this.geometry) {
      throw new Error('Geometry is not set, use Slicer.setGeometry or Slicer.setMesh first');
    }

    return new Promise((resolve, reject) => {
      // create the slicer worker
      const slicerWorker = new SlicerWorker();
      slicerWorker.onerror = reject;

      // listen to messages send from worker
      slicerWorker.addEventListener('message', (event) => {
        const { message, data } = event.data;
        switch (message) {
          case 'SLICE': {
            slicerWorker.terminate();
            resolve(data.gcode);
            break;
          }
          case 'PROGRESS': {
            onProgress(data);
            break;
          }
        }
      });

      // send geometry and settings to worker to start the slicing progress
      const geometry = this.geometry.toJSON();
      slicerWorker.postMessage({
        message: 'SLICE',
        data: { geometry, settings }
      });
    });
  }
}
