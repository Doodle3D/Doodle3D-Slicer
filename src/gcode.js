import THREE from 'three.js';

export default class {
	constructor () {
		this.gcode = "";
		this.current = {};

		this.extruder = 0.0;
		this.bottom = true;
		this.isRetracted = false;
		this.isFanOn = false;
		this._nozzlePosition = new THREE.Vector2(0, 0);
	}
	
	_addGCode (command) {
		var str = "";
		var first = true;

		for (var i in command) {
			if (first) {
				str = i + command[i];

				first = false;
			}
			else if (this.current[i] !== command[i]) {
				str += " " + i + command[i];

				this.current[i] = command[i];
			}
		}

		this.gcode += str + "\n";
	}
	
	setSettings (settings) {
		this.settings = settings;

		return this;
	}
	
	turnFanOn (fanSpeed) {
		this.isFanOn = true;

		var gcode = {
			"M": 106
		}

		if (fanSpeed !== undefined) {
			gcode["S"] = fanSpeed;
		}

		this._addGCode(gcode);

		return this;
	}
	
	turnFanOff () {
		this.isFanOn = false;

		this._addGCode({
			"M": 107
		});

		return this;
	}
	
	moveTo (x, y, layer) {
		var layerHeight = this.settings.config["layerHeight"];
		var travelSpeed = this.settings.config["travelSpeed"];
		
		var z = (layer + 1) * layerHeight;
		var speed = travelSpeed * 60;

		this._addGCode({
			"G": 0, 
			"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
			"F": speed.toFixed(3)
		});
		
		this._nozzlePosition.set(x, y);

		return this;
	}
	
	lineTo (x, y, layer, type) {
		var newNozzlePosition = new THREE.Vector2(x, y);

		var layerHeight = this.settings.config["layerHeight"];
		var nozzleDiameter = this.settings.config["nozzleDiameter"];
		var filamentThickness = this.settings.config["filamentThickness"];
		var travelSpeed = this.settings.config["travelSpeed"];

		var profile = this.settings.config[(this.bottom ? "bottom" : type)];

		var speed = profile["speed"] * 60;
		var flowRate = profile["flowRate"];
		var z = (layer + 1) * layerHeight;

		var lineLength = this._nozzlePosition.distanceTo(newNozzlePosition);

		var filamentSurfaceArea = Math.pow((filamentThickness / 2), 2) * Math.PI;
		this.extruder += lineLength * nozzleDiameter * layerHeight / filamentSurfaceArea * flowRate;

		this._addGCode({
			"G": 1,
			"X": x.toFixed(3), "Y": y.toFixed(3), "Z": z.toFixed(3), 
			"F": speed.toFixed(3), 
			"E": this.extruder.toFixed(3)
		});

		this._nozzlePosition.copy(newNozzlePosition);

		return this;
	}
	
	unRetract () {
		var retractionEnabled = this.settings.config["retractionEnabled"];
		var retractionMinDistance = this.settings.config["retractionMinDistance"];
		var retractionSpeed = this.settings.config["retractionSpeed"];

		if (this.isRetracted && retractionEnabled) {
			this.isRetracted = false;

			var speed = retractionSpeed * 60;

			if (this.extruder > retractionMinDistance) {
				this._addGCode({
					"G": 0, 
					"E": this.extruder.toFixed(3), 
					"F": speed.toFixed(3)
				});
			}
		}

		return this;
	}
	
	retract () {
		var retractionAmount = this.settings.config["retractionAmount"];
		var retractionEnabled = this.settings.config["retractionEnabled"];
		var retractionMinDistance = this.settings.config["retractionMinDistance"];
		var retractionSpeed = this.settings.config["retractionSpeed"];

		if (!this.isRetracted && retractionEnabled) {
			this.isRetracted = true;
		
			var speed = retractionSpeed * 60;

			if (this.extruder > retractionMinDistance && retractionEnabled) {
				this._addGCode({
					"G": 0, 
					"E": (this.extruder - retractionAmount).toFixed(3), 
					"F": speed.toFixed(3)
				});
			}
		}

		return this;
	}
	
	getGCode () {
		return this.settings.startCode() + this.gcode + this.settings.endCode();
	}
}