D3D.SlicerWorker = function () {
	'use strict';

	this.worker = new Worker('webworker/worker.js');

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
}
D3D.SlicerWorker.prototype.setSettings = function (USER_SETTINGS, PRINTER_SETTINGS) {
	'use strict';

	this.worker.postMessage({
		'cmd': 'SET_SETTINGS', 
		'USER_SETTINGS': USER_SETTINGS, 
		'PRINTER_SETTINGS': PRINTER_SETTINGS
	});
};
D3D.SlicerWorker.prototype.setMesh = function (mesh) {
	'use strict';

	if (mesh.geometry instanceof THREE.Geometry) {
		var geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry);
	}
	else {
		var geometry = mesh.geometry.clone();
	}

	var buffers = [];

	for (var i = 0; i < geometry.attributesKeys.length; i ++) {
		var key = geometry.attributesKeys[i];
		buffers.push(geometry.attributes[key].array.buffer);
	}

	mesh.updateMatrix();

	this.worker.postMessage({
		'cmd': 'SET_MESH', 
		'geometry': {
			'attributes': geometry.attributes, 
			'attributesKeys': geometry.attributesKeys
		}, 
		'matrix': mesh.matrix.toArray()
	}, buffers);
};
D3D.SlicerWorker.prototype.slice = function () {
	'use strict';

	this.worker.postMessage({
		'cmd': 'SLICE'
	});
};
D3D.SlicerWorker.prototype.close = function () {
	'use strict';

	this.worker.postMessage({
		'cmd': 'CLOSE'
	});
};