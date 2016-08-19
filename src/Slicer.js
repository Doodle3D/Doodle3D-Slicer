import THREE from 'three.js';
import slice from './sliceActions/index.js';

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
	async slice(settings) {
		return slice(this.geometry, settings);
	}
}
