D3D.SlicerWorker = function () {
	'use strict';

	this.worker = new Worker(window.location.origin + '/webworker/worker.js');

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
		console.warn("Error in webworker", error);
	};
}
D3D.SlicerWorker.prototype.setSettings = function (USER_SETTINGS, PRINTER_SETTINGS) {
	'use strict';

	this.worker.postMessage({
		'cmd': 'SET_SETTINGS', 
		'USER_SETTINGS': USER_SETTINGS, 
		'PRINTER_SETTINGS': PRINTER_SETTINGS
	});

	return this;
};
D3D.SlicerWorker.prototype.setMesh = function (mesh) {
	'use strict';

	mesh.updateMatrix();

	this.setGeometry(mesh.geometry, mesh.matrix);

	return this;
};
D3D.SlicerWorker.prototype.setGeometry = function (geometry, matrix) {
	'use strict';

	if (geometry instanceof THREE.Geometry) {
		geometry = new THREE.BufferGeometry().fromGeometry(geometry);
	}
	else {
		geometry = geometry.clone();
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
};
D3D.SlicerWorker.prototype.slice = function () {
	'use strict';

	this.worker.postMessage({
		'cmd': 'SLICE'
	});

	return this;
};
D3D.SlicerWorker.prototype.close = function () {
	'use strict';

	this.worker.postMessage({
		'cmd': 'CLOSE'
	});

	return this;
};