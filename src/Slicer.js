import * as THREE from 'three.js';
import Settings from './Settings.js';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicerWorker.js!worker';

export default class {
  setMesh(mesh) {
    mesh.updateMatrix();

    this.setGeometry(mesh.geometry, mesh.matrix);

    return this;
  }
  setGeometry(geometry, matrix) {
    if (geometry.type === 'BufferGeometry') {
      geometry = new THREE.Geometry().fromBufferGeometry(geometry);
    } else if (geometry.type === 'Geometry') {
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
  sliceSync(settings) {
    return slice(this.geometry, new Settings(settings));
  }
  slice(settings) {
    const slicerWorker = new SlicerWorker();

    const geometry = this.geometry.toJSON();
    const { config } = new Settings(settings);

    return new Promise((resolve, reject) => {
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
            if (this.onprogress) {
              this.onprogress(data);
            }
          }
        }
      });

      slicerWorker.postMessage({
        message: 'SLICE',
        data: { geometry, config }
      });
    });
  }
}
