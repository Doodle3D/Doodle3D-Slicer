importScripts('../jspm_packages/system.js');
importScripts('../config.js');

var Slicer, Settings, THREE;

function init () {
	var slicer = new Slicer();
	slicer.onProgress = function (progress) {
		self.postMessage({
			'cmd': 'PROGRESS', 
			'progress': progress
		});
	};

	self.addEventListener('message', function (event) {
		switch (event.data['cmd']) {
			case 'SET_MESH': 				
				var geometry = new THREE.Geometry().fromBufferGeometry(event.data['geometry']);
				var matrix = new THREE.Matrix4().fromArray(event.data['matrix']);

				slicer.setGeometry(geometry, matrix);
			break;

			case 'SLICE':
				var settings = new Settings().updateConfig(event.data['settings']);

				var gcode = slicer.slice(settings);
				var blob = new Blob([gcode], {type: 'text/plain'});

				self.postMessage({
					'cmd': 'GCODE', 
					'gcode': blob
				});

				//self.close();
			break;

			case 'CLOSE': 
				self.close();
			break;
		}
	});
}

Promise.all([
	System.import('./slicer'),
	System.import('./settings'),
	System.import('three.js')
]).then(function(modules) {
	Slicer = modules[0].default;
	Settings = modules[1].default;
	THREE = modules[2];

	init();
});
