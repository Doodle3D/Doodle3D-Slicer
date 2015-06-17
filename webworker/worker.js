importScripts('../library/three.js');
importScripts('../library/clipper.js');
importScripts('../src/utils.js');
importScripts('../src/printer.js');
importScripts('../src/paths.js');
importScripts('../src/slicer.js');
importScripts('../src/gcode.js');
importScripts('../src/slice.js');

var printer = new D3D.Printer();
var slicer = new D3D.Slicer();
slicer.onProgress = function (progress) {
	'use strict';

	self.postMessage({
		'cmd': 'PROGRESS', 
		'progress': progress
	});
};

self.addEventListener('message', function (event) {
	'use strict';

	switch (event.data['cmd']) {
		case 'SET_MESH': 
			//hack...
			//because boundings loses prototype functions when converting
			event.data['geometry'].boundingBox = event.data['geometry'].boundingSphere = null;
			
			var geometry = new THREE.Geometry().fromBufferGeometry(event.data['geometry']);
			var matrix = new THREE.Matrix4().fromArray(event.data['matrix']);

			slicer.setMesh(geometry, matrix);
		break;

		case 'SET_SETTINGS':
			printer.updateConfig(event.data['USER_SETTINGS']);
			printer.updateConfig(event.data['PRINTER_SETTINGS']);
		break;

		case 'SLICE':
			var gcode = slicer.getGCode(printer);
			var blob = new Blob([gcode], {type: 'text/plain'});

			//need to send the buffer of blob sepperatly;
			//not sure how to send that

			self.postMessage({
				'cmd': 'GCODE', 
				'gcode': blob
			});
		break;

		case 'CLOSE': 
			self.close();
		break;
	}
});