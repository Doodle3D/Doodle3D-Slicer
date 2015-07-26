import THREE from 'three.js';
import Settings from './settings.js';

export default class {
	constructor () {
		this.worker = new Worker('./worker.js');

		var scope = this;
		this.worker.addEventListener('message', function (event) {
			switch (event.data['cmd']) {
				case 'PROGRESS':

					if (scope.onprogress !== undefined) {
						var progress = event.data['progress'];

						scope.onprogress(progress);
					}
				break;

				case 'GCODE':
					if (scope.onfinish !== undefined) {
						var reader = new FileReader();
						reader.addEventListener("loadend", function() {
							var gcode = reader.result;
							scope.onfinish(gcode);
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