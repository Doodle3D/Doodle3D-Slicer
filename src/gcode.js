/******************************************************
*
* GCode
* 
* Manages the gcode
* Also handles different flavours of gcode
* TODO
* calculate extrusion length and total time
*
******************************************************/

D3D.GCode = function () {
	"use strict";

	this.gcode = [];
	this.current = {};

	this.extruder = 0.0;
	this.bottom = true;
	this.isRetracted = false;
	this.isFanOn = false;
	this.nozzlePosition = new THREE.Vector2(0, 0);
};
D3D.GCode.prototype.addGCode = function (command) {
	"use strict";

	var str = [];

	for (var i in command) {
		if (i === "G") {
			str.push(i + command[i]);
		}
		else if (this.current[i] !== command[i]) {
			str.push(i + command[i]);
			this.current[i] = command[i];
		}
	}

	str = str.join(" ");
	if (str.length > 0) {
		this.gcode.push(str);
	}
};
D3D.GCode.prototype.setSettings = function (printer) {
	"use strict";

	this.settings = printer;

	return this;
};
D3D.GCode.prototype.turnFanOn = function (fanSpeed) {
	"use strict";

	this.isFanOn = true;

	var gcode = {
		"M": 106
	};

	if (fanSpeed !== undefined) {
		gcode["S"] = fanSpeed;
	}

	this.addGCode(gcode);

	return this;
};
D3D.GCode.prototype.turnFanOff = function () {
	"use strict";

	this.isFanOn = false;

	this.addGCode({
		"M": 107
	});

	return this;
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

		this.addGCode({
			"G": 1,
			"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
			"F": speed.toFixed(3), 
			"E": this.extruder.toFixed(3)
		});
	}
	else {
		var speed = travelSpeed * 60;

		this.addGCode({
			"G": 0, 
			"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
			"F": speed.toFixed(3)
		});

	}

	this.nozzlePosition = new THREE.Vector2(x, y);

	return this;
};
D3D.GCode.prototype.unRetract = function () {
	"use strict";

	if (this.isRetracted) {
		this.isRetracted = false;

		var retractionAmount = this.settings.config["printer.retraction.amount"];
		var retractionEnabled = this.settings.config["printer.retraction.enabled"];
		var retractionMinDistance = this.settings.config["printer.retraction.minDistance"];
		var retractionSpeed = this.settings.config["printer.retraction.speed"];

		var speed = retractionSpeed * 60;

		if (this.extruder > retractionMinDistance && retractionEnabled) {
			this.addGCode({
				"G": 0, 
				"E": this.extruder.toFixed(3), 
				"F": speed.toFixed(3)
			});
		}

		return this;
	}
};
D3D.GCode.prototype.retract = function () {
	"use strict";

	if (!this.isRetracted) {
		this.isRetracted = true;

		var retractionAmount = this.settings.config["printer.retraction.amount"];
		var retractionEnabled = this.settings.config["printer.retraction.enabled"];
		var retractionMinDistance = this.settings.config["printer.retraction.minDistance"];
		var retractionSpeed = this.settings.config["printer.retraction.speed"];

		var speed = retractionSpeed * 60;

		if (this.extruder > retractionMinDistance && retractionEnabled) {
			this.addGCode({
				"G": 0, 
				"E": (this.extruder - retractionAmount).toFixed(3), 
				"F": speed.toFixed(3)
			});
		}

		return this;
	}
};
D3D.GCode.prototype.getGCode = function () {
	"use strict";

	return this.settings.getStartCode().concat(this.gcode, this.settings.getEndCode());
};