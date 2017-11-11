import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicer.worker.js';

export function sliceMesh(settings, mesh, sync = false, onProgress) {
  if (!mesh || !mesh.isMesh) {
    throw new Error('Provided mesh is not intance of THREE.Mesh');
  }

  mesh.updateMatrix();
  const { geometry, matrix } = mesh;
  return sliceGeometry(settings, geometry, matrix, sync, onProgress);
}

export function sliceGeometry(settings, geometry, matrix, sync = false, onProgress) {
  if (!geometry) {
    throw new Error('Missing required geometry argument');
  } else if (geometry.isBufferGeometry) {
    geometry = new THREE.Geometry().fromBufferGeometry(geometry);
  } else if (geometry.isGeometry) {
    geometry = geometry.clone();
  } else {
    throw new Error('Geometry is not an instance of BufferGeometry or Geometry');
  }

  if (geometry.faces.length === 0) {
    throw new Error('Geometry does not contain any data');
  }

  if (matrix && matrix.isMatrix4) {
    geometry.applyMatrix(matrix);
  }

  if (sync) {
    return sliceSync(settings, geometry, onProgress);
  } else {
    return sliceAsync(settings, geometry, onProgress);
  }
}

function sliceSync(settings, geometry, onProgress) {
  return slice(settings, geometry, onProgress);
}

function sliceAsync(settings, geometry, onProgress) {
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
    geometry = geometry.toJSON();
    slicerWorker.postMessage({
      message: 'SLICE',
      data: {
        settings,
        geometry
      }
    });
  });
}
