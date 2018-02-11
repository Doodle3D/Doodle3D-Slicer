import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicer.worker.js';

export function sliceMesh(settings, mesh, sync = false, constructLinePreview = false, onProgress) {
  if (!mesh || !mesh.isMesh) {
    throw new Error('Provided mesh is not intance of THREE.Mesh');
  }

  mesh.updateMatrix();
  const { geometry, matrix, material } = mesh;
  return sliceGeometry(settings, geometry, material, matrix, sync, constructLinePreview, onProgress);
}

export function sliceGeometry(settings, geometry, materials, matrix, sync = false, constructLinePreview = false, onProgress) {
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

  const openObjectIndexes = materials instanceof Array ? materials.map(({ side }) => {
    switch (side) {
      case THREE.FrontSide:
        return false;
      case THREE.DoubleSide:
        return true;
      default:
        return false;
    }
  }) : [false];

  if (sync) {
    return sliceSync(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);
  } else {
    return sliceAsync(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);
  }
}

function sliceSync(settings, geometry, openObjectIndexes, constructLinePreview, onProgress) {
  return slice(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);
}

function sliceAsync(settings, geometry, openObjectIndexes, constructLinePreview, onProgress) {
  return new Promise((resolve, reject) => {
    // create the slicer worker
    const slicerWorker = new SlicerWorker();

    slicerWorker.addEventListener('error', event => {
      slicerWorker.terminate();
      reject(event);
    });

    // listen to messages send from worker
    slicerWorker.addEventListener('message', (event) => {
      const { message, data } = event.data;
      switch (message) {
        case 'SLICE': {
          slicerWorker.terminate();

          // if (data.gcode.linePreview) {
          //   const geometry = new THREE.BufferGeometry();
          //
          //   const { position, color } = data.gcode.linePreview;
          //   geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
          //   geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(color), 3));
          //
          //   const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
          //   const linePreview = new THREE.LineSegments(geometry, material);
          //
          //   data.gcode.linePreview = linePreview;
          // }

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
      data: { settings, geometry, openObjectIndexes, constructLinePreview }
    });
  });
}
