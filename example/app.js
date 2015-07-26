import THREE from 'three.js';
import PRINTER_SETTINGS from 'settings/printer_settings.json!';
import USER_SETTINGS from 'settings/user_settings.json!';
import * as SLICER from 'src/index';

setTimeout(() => {
	var settings = new SLICER.Settings();
	settings.updateConfig(PRINTER_SETTINGS["ultimaker2go"]);
	settings.updateConfig(USER_SETTINGS);

	var geometry = new THREE.TorusGeometry(20, 10, 30, 30);

	var slicer = new SLICER.Slicer();
	//var slicer = new SLICER.SlicerWorker();

	slicer.setGeometry(geometry);
	slicer.onfinish = function (gCode) {
		document.getElementById('gcode').innerHTML = gCode.replace(/(?:\r\n|\r|\n)/g, '<br />');
	};
	slicer.slice(settings);
});