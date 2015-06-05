/******************************************************
*
* GCode
* 
* Manages the gcode
*
******************************************************/

D3D.GCode = function () {
	"use strict";

	this.extruder = 0.0;
	this.bottom = true;
	this.isRetracted = false;
	this.gcode = [];
	this.nozzlePosition = new THREE.Vector2(0, 0);
};
D3D.GCode.prototype.setSettings = function (printer) {
	"use strict";

	this.settings = printer;

	return this;
};
D3D.GCode.prototype.turnOnFan = function () {
	"use strict";

	this.gcode.push("M106");
};
D3D.GCode.prototype.moveTo = function (extrude, x, y, layer) {
	"use strict";

	var layerHeight = this.settings.config["printer.layerHeight"];
	var firstLayerSlow = this.settings.config["printer.firstLayerSlow"];
	var normalSpeed = this.settings.config["printer.speed"];
	var bottomSpeed = this.settings.config["printer.bottomLayerSpeed"];
	var normalSpeed = this.settings.config["printer.speed"];
	var bottomSpeed = this.settings.config["printer.bottomLayerSpeed"];
	var nozzleDiameter = this.settings.config["printer.nozzleDiameter"];
	var filamentThickness = this.settings.config["printer.filamentThickness"];
	var bottomFlowRate = this.settings.config["printer.bottomFlowRate"];
	var normalFlowRate = this.settings.config["printer.normalFlowRate"];
	var travelSpeed = this.settings.config["printer.travelSpeed"];

	if (this.bottom) {
		var speed = bottomSpeed * 60;
		var flowRate = bottomFlowRate;
	}
	else {
		var speed = normalSpeed * 60;
		var flowRate = normalFlowRate;
	}
	var z = (layer + 1) * layerHeight;

	if (extrude) {
		var lineLength = this.nozzlePosition.distanceTo(new THREE.Vector2(x, y));

		var filamentSurfaceArea = Math.pow((filamentThickness/2), 2) * Math.PI;
		this.extruder += lineLength * nozzleDiameter * layerHeight / filamentSurfaceArea * flowRate;

		this.gcode.push(
			"G1" + 
			" X" + x.toFixed(3) + 
			" Y" + y.toFixed(3) + 
			((z !== this.lastZ) ? (" Z" + z.toFixed(3)) : "") + 
			((speed !== this.lastSpeed) ? (" F" + speed.toFixed(3)) : "") + 
			" E" + this.extruder.toFixed(3)
		);
	}
	else {
		var speed = travelSpeed * 60;

		this.gcode.push(
			"G0" + 
			" X" + x.toFixed(3) + " Y" + y.toFixed(3) + " Z" + z + 
			" F" + speed.toFixed(3)
		);

	}

	this.lastSpeed = speed;
	this.lastZ = z;

	this.nozzlePosition = new THREE.Vector2(x, y);
};
D3D.GCode.prototype.unRetract = function () {
	"use strict";

	this.isRetracted = false;

	var retractionAmount = this.settings.config["printer.retraction.amount"];
	var retractionEnabled = this.settings.config["printer.retraction.enabled"];
	var retractionMinDistance = this.settings.config["printer.retraction.minDistance"];
	var retractionSpeed = this.settings.config["printer.retraction.speed"];

	var speed = retractionSpeed * 60;

	if (this.extruder > retractionMinDistance && retractionEnabled) {
		this.gcode.push(
			"G0" + 
			" E" + this.extruder.toFixed(3) + 
			" F" + (speed * 60).toFixed(3)
		);
	}
};
D3D.GCode.prototype.retract = function () {
	"use strict";

	this.isRetracted = true;

	var retractionAmount = this.settings.config["printer.retraction.amount"];
	var retractionEnabled = this.settings.config["printer.retraction.enabled"];
	var retractionMinDistance = this.settings.config["printer.retraction.minDistance"];
	var retractionSpeed = this.settings.config["printer.retraction.speed"];

	var speed = retractionSpeed * 60;

	if (this.extruder > retractionMinDistance && retractionEnabled) {
		this.gcode.push(
			"G0" +
			" E" + (this.extruder - retractionAmount).toFixed(3) + 
			" F" + speed.toFixed(3)
		);
	}

	this.lastSpeed = speed;
};
D3D.GCode.prototype.getFinal = function () {
	"use strict";

	return this.settings.getStartCode().concat(this.gcode, this.settings.getEndCode());
};