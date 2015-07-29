import THREE from 'three.js';
import Settings from './settings.js';

export default class {
	constructor () {
		this.worker = new Worker('./worker.js');

		this.worker.addEventListener('message', (event) => {
			switch (event.data['cmd']) {
				case 'PROGRESS':

					if (this.onprogress !== undefined) {
						var progress = event.data['progress'];

						this.onprogress(progress);
					}
				break;

				case 'GCODE':
					if (this.onfinish !== undefined) {
						var reader = new FileReader();
						reader.addEventListener("loadend", () => {
							var gcode = reader.result;
							this.onfinish(gcode);
						});
						reader.readAsBinaryString(event.data['gcode']);
					}
				break;
			}
		}, false);

		this.worker.onerror = function (error) {
			console.warn(error);
		};
	}

	setMesh (mesh) {
		mesh.updateMatrix();

		this.setGeometry(mesh.geometry, mesh.matrix);

		return this;
	}

	setGeometry (geometry, matrix) {
		if (geometry.type === 'Geometry') {
			geometry = new THREE.BufferGeometry().fromGeometry(geometry);
		}
		else if (geometry.type === 'BufferGeometry') {
			geometry = geometry.clone();
		}
		else {
			console.warn('Geometry is not an instance of BufferGeometry or Geometry');
			return;
		}

		if (!(matrix instanceof THREE.Matrix4)) {
			matrix = new THREE.Matrix4();
		}

		var buffers = [];
		for (var i = 0; i < geometry.attributesKeys.length; i ++) {
			var key = geometry.attributesKeys[i];
			buffers.push(geometry.attributes[key].array.buffer);
		}

		delete geometry.boundingBox;
		delete geometry.boundingSphere;

		this.worker.postMessage({
			'cmd': 'SET_MESH', 
			'geometry': {
				'attributes': geometry.attributes, 
				'attributesKeys': geometry.attributesKeys
			}, 
			'matrix': matrix.toArray()
		}, buffers);

		return this;
	}

	slice (settings) {
		this.worker.postMessage({
			'cmd': 'SLICE', 
			'settings': settings.config
		});

		return this;
	}

	close () {
		this.worker.postMessage({
			'cmd': 'CLOSE'
		});

		return this;
	}
}