import THREE from 'three.js';
import * as SLICER from 'src/index';

const settings = new SLICER.Settings();
settings.updateConfig(SLICER.printerSettings['ultimaker2go']);
settings.updateConfig(SLICER.userSettings);

const geometry = new THREE.TorusGeometry(20, 10, 30, 30);

const slicer = new SLICER.Slicer();

slicer.setGeometry(geometry.clone());
slicer.addEventListener('finish', ({ gcode }) => {
	document.getElementById('gcode').innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
});
slicer.slice(settings);
