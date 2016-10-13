import THREE from 'three.js';
import slice from './sliceActions/slice.js';
import SlicerWorker from './slicerWorker.js!worker';

export default class {
	setMesh(mesh) {
		mesh.updateMatrix();

		this.setGeometry(mesh.geometry, mesh.matrix);

		return this;
	}
	setGeometry(geometry, matrix) {
		if (geometry instanceof THREE.BufferGeometry) {
			geometry = new THREE.Geometry().fromBufferGeometry(geometry);
		} else if (geometry instanceof THREE.Geometry) {
			geometry = geometry.clone();
		} else {
			throw 'Geometry is not an instance of BufferGeometry or Geometry';
		}

		if (matrix instanceof THREE.Matrix4) {
			geometry.applyMatrix(matrix);
		}

		geometry.mergeVertices();
		geometry.computeFaceNormals();

		this.geometry = geometry;

		return this;
	}
	sliceSync(settings) {
		return slice(this.geometry, settings);
	}
	slice(settings) {
		const slicerWorker = new SlicerWorker();

		const geometry = this.geometry.toJSON();
		const { config } = settings;

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
				}
			});

			slicerWorker.postMessage({
				message: 'SLICE',
				data: { geometry, config }
			});
		});
	}
}
