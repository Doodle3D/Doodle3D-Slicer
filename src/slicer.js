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

  if (matrix && matrix.isMatrix4) geometry.applyMatrix(matrix);

  const vertices = geometry.vertices.reduce((array, { x, y, z }, i) => {
    const i3 = i * 3;
    array[i3] = x;
    array[i3 + 1] = y;
    array[i3 + 2] = z;
    return array;
  }, new Float32Array(geometry.vertices.length * 3));
  const faces = geometry.faces.reduce((array, { a, b, c }, i) => {
    const i3 = i * 3;
    array[i3] = a;
    array[i3 + 1] = b;
    array[i3 + 2] = c;
    return array;
  }, new Uint32Array(geometry.faces.length * 3));
  const objectIndexes = geometry.faces.reduce((array, { materialIndex }, i) => {
    array[i] = materialIndex;
    return array;
  }, new Uint8Array(geometry.faces.length));

  if (faces.length === 0) throw new Error('Geometry does not contain any data');

  geometry = { vertices, faces, objectIndexes };

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
  const gcode = slice(settings, geometry, openObjectIndexes, constructLinePreview, onProgress);
  if (gcode.linePreview) gcode.linePreview = constructLineGeometry(gcode.linePreview);
  return gcode;
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

          const { gcode } = data;
          if (gcode.linePreview) gcode.linePreview = constructLineGeometry(gcode.linePreview);

          resolve(gcode);
          break;
        }
        case 'PROGRESS': {
          if (typeof onProgress !== 'undefined') onProgress(data);
          break;
        }

        default:
          break;
      }
    });

    const { vertices, faces, objectIndexes } = geometry;
    const buffers = [vertices.buffer, faces.buffer, objectIndexes.buffer];

    slicerWorker.postMessage({
      message: 'SLICE',
      data: { settings, geometry, openObjectIndexes, constructLinePreview }
    }, buffers);
  });
}

function constructLineGeometry(linePreview) {
  const geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(linePreview.positions), 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(linePreview.colors), 3));

  const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
  const mesh = new THREE.LineSegments(geometry, material);
  return mesh;
}
