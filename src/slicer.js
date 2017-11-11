import * as THREE from 'three';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicer.worker.js';

export function sliceMesh(settings, mesh, sync = false, constructLinePreview = false, onProgress) {
  if (!mesh || !mesh.isMesh) {
    throw new Error('Provided mesh is not intance of THREE.Mesh');
  }

  mesh.updateMatrix();
  const { geometry, matrix } = mesh;
  return sliceGeometry(settings, geometry, matrix, sync, onProgress);
}

export async function sliceGeometry(settings, geometry, matrix, sync = false, constructLinePreview = false, onProgress) {
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

  let gcode;
  if (sync) {
    gcode = sliceSync(settings, geometry, onProgress);
  } else {
    gcode = await sliceAsync(settings, geometry, onProgress);
  }

  if (constructLinePreview) gcode.linePreview = createGcodeGeometry(gcode.gcode);

  gcode.gcode = gcodeToString(gcode.gcode);
  return gcode;
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

function gcodeToString(gcode) {
  const currentValues = {};
  return gcode.reduce((string, command) => {
    let first = true;
    for (const action in command) {
      const value = command[action];
      const currentValue = currentValues[action];
      if (first) {
        string = action + value;
        first = false;
      } else if (currentValue !== value) {
        string += ` ${action}${value}`;
        currentValues[action] = value;
      }
    }
    string += '\n';
  }, '');
}

const MAX_SPEED = 100 * 60;
function createGcodeGeometry(gcode) {
  const geometry = new THREE.Geometry();

  let lastPoint
  for (let i = 0; i < gcode.length; i ++) {
    const { G, F, X, Y, Z } = gcode[i];

    if (X || Y || Z) {
      const point = new THREE.Vector3(Y, Z, X);

      let color;
      if (G === 0) {
        color = new THREE.Color(0x00ff00);
      } else if (G === 1) {
        color = new THREE.Color().setHSL(F / MAX_SPEED, 0.5, 0.5);
      }

      if (G === 1) {
        if (lastPoint) geometry.vertices.push(lastPoint);
        geometry.vertices.push(new THREE.Vector3(Y, Z, X));
        geometry.colors.push(color);
        geometry.colors.push(color);
      }

      lastPoint = point;
    }
  }

  const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
  const line = new THREE.LineSegments(geometry, material);

  return line;
}
