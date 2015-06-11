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

	this.gcode = "";
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
		this.gcode += str + "\n";
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
D3D.GCode.prototype.moveTo = function (x, y, layer) {
	"use strict";

	var layerHeight = this.settings.config["layerHeight"];
	var travelSpeed = this.settings.config["travelSpeed"];
	
	var z = (layer + 1) * layerHeight;
	var speed = travelSpeed * 60;

	this.addGCode({
		"G": 0, 
		"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
		"F": speed.toFixed(3)
	});
	
	this.nozzlePosition.set(x, y);

	return this;
};
D3D.GCode.prototype.lineTo = function (x, y, layer, type) {
	"use strict";

	var newNozzlePosition = new THREE.Vector2(x, y);

	var layerHeight = this.settings.config["layerHeight"];
	var nozzleDiameter = this.settings.config["nozzleDiameter"];
	var filamentThickness = this.settings.config["filamentThickness"];
	var travelSpeed = this.settings.config["travelSpeed"];

	var profile = this.settings.config[(this.bottom ? "bottom" : type)];

	var speed = profile["speed"] * 60;
	var flowRate = profile["flowRate"];
	var z = (layer + 1) * layerHeight;

	var lineLength = this.nozzlePosition.distanceTo(newNozzlePosition);

	var filamentSurfaceArea = Math.pow((filamentThickness/2), 2) * Math.PI;
	this.extruder += lineLength * nozzleDiameter * layerHeight / filamentSurfaceArea * flowRate;

	this.addGCode({
		"G": 1,
		"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
		"F": speed.toFixed(3), 
		"E": this.extruder.toFixed(3)
	});

	this.nozzlePosition.copy(newNozzlePosition);

	return this;
};
D3D.GCode.prototype.unRetract = function () {
	"use strict";

	var retractionEnabled = this.settings.config["retractionEnabled"];
	var retractionMinDistance = this.settings.config["retractionMinDistance"];
	var retractionSpeed = this.settings.config["retractionSpeed"];

	if (this.isRetracted && retractionEnabled) {
		this.isRetracted = false;

		var speed = retractionSpeed * 60;

		if (this.extruder > retractionMinDistance) {
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

	var retractionAmount = this.settings.config["retractionAmount"];
	var retractionEnabled = this.settings.config["retractionEnabled"];
	var retractionMinDistance = this.settings.config["retractionMinDistance"];
	var retractionSpeed = this.settings.config["retractionSpeed"];

	if (!this.isRetracted && retractionEnabled) {
		this.isRetracted = true;
	
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

	return this.settings.getStartCode() + this.gcode + this.settings.getEndCode();
};