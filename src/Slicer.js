import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicerWorker.js!worker';
import ProgressPromise from 'progress-promise';

export default class {
  setMesh(mesh) {
    mesh.updateMatrix();

    this.setGeometry(mesh.geometry, mesh.matrix);

    return this;
  }
  setGeometry(geometry, matrix) {
    if (geometry.isBufferGeometry) {
      geometry = new THREE.Geometry().fromBufferGeometry(geometry);
    } else if (geometry.isGeometry) {
      geometry = geometry.clone();
    } else {
      throw new Error('Geometry is not an instance of BufferGeometry or Geometry');
    }

    if (matrix) {
      geometry.applyMatrix(matrix);
    }

    this.geometry = geometry;

    return this;
  }
  sliceSync(settings, onprogress) {
    return slice(this.geometry, settings, onprogress);
  }
  slice(settings) {
    const slicerWorker = new SlicerWorker();

    const geometry = this.geometry.toJSON();

    return new ProgressPromise((resolve, reject, progress) => {
      slicerWorker.onerror = reject;

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

      slicerWorker.postMessage({
        message: 'SLICE',
        data: { geometry, settings }
      });
    });
  }
}
