importScripts("../library/three.js");
importScripts("../library/clipper.js");
importScripts("../src/utils.js");
importScripts("../src/printer.js");
importScripts("../src/paths.js");
importScripts("../src/slicer.js");

var printer = new D3D.Printer();
var slicer = new D3D.Slicer();

self.addEventListener("message", function (event) {
	"use strict";

	switch (event.data["cmd"]) {
		case "SET_MESH": 

			var geometry = new THREE.Geometry().fromBufferGeometry(event.data["geometry"]);
			var matrix = new THREE.Matrix4().fromArray(event.data["matrix"]);

			slicer.setMesh(geometry, matrix);

		break;

		case "SET_SETTINGS":
			printer.updateConfig(event.data["USER_SETTINGS"]);
			printer.updateConfig(event.data["PRINTER_SETTINGS"]);
		break;

		case "SLICE":
			var gcode = slicer.getGcode(printer);

			self.postMessage(gcode);
		break;

		case "CLOSE": 			
			self.close();
		break;

		default: 

			//console.log(event);

		break;
	}
});