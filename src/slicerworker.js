D3D.SlicerWorker = function () {
	"use strict";

	this.worker = new Worker('webworker/worker.js');

	this.worker.addEventListener('message', function (event) {
		console.log(event);
	}, false);
}
D3D.SlicerWorker.prototype.setSettings = function (USER_SETTINGS, PRINTER_SETTINGS) {
	"use strict";

	this.worker.postMessage({
		"cmd": "SET_SETTINGS", 
		"USER_SETTINGS": USER_SETTINGS, 
		"PRINTER_SETTINGS": PRINTER_SETTINGS
	});
};
D3D.SlicerWorker.prototype.setMesh = function (mesh) {
	"use strict";

	if (mesh.geometry instanceof THREE.Geometry) {
		var geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry);
	}
	else {
		var geometry = mesh.geometry;
	}

	mesh.updateMatrix();

	this.worker.postMessage({
		"cmd": "SET_MESH", 
		"geometry": geometry.toJSON().data, 
		"matrix": mesh.matrix.toArray()
	});
};
D3D.SlicerWorker.prototype.slice = function () {
	"use strict";

	this.worker.postMessage({
		"cmd": "SLICE"
	});
};
D3D.SlicerWorker.prototype.close = function () {
	"use strict";

	this.worker.postMessage({
		"cmd": "CLOSE"
	});
};