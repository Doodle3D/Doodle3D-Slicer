import THREE from 'three.js';
import * as SLICER from 'src/index';

const settings = new SLICER.Settings({
	...SLICER.printerSettings['ultimaker2go'],
	...SLICER.userSettings
});

const geometry = new THREE.TorusGeometry(20, 10, 30, 30);

const slicer = new SLICER.Slicer();

slicer.setGeometry(geometry);
slicer.slice(settings, true).then(gcode => {
	document.getElementById('gcode').innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
});
