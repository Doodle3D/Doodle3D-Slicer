import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicerWorker.js!worker';
import ProgressPromise from 'progress-promise';

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
  sliceSync(settings, onprogress) {
    return slice(this.geometry, settings, onprogress);
  }
  slice(settings) {
    if (!this.geometry) {
      throw new Error('Geometry is not set, use Slicer.setGeometry or Slicer.setMesh first');
    }

    return new ProgressPromise((resolve, reject, progress) => {
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
            progress(data);
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
