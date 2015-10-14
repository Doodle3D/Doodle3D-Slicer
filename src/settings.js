export default class {
	constructor () {
		this.config = {};
	}

	updateConfig (config) {
		for (var i in config) {
			this.config[i] = config[i];
		}

		return this;
	}

	startCode () {		
		var gcode = this.config["startCode"];

		gcode = this._subsituteVariables(gcode);

		return gcode;
	}

	endCode () {		
		var gcode = this.config["endCode"];

		gcode = this._subsituteVariables(gcode);

		return gcode;
	}

	_subsituteVariables (gcode) {
		var temperature = this.config["temperature"];
		var bedTemperature = this.config["bedTemperature"];
		var preheatTemperature = this.config["heatupTemperature"];
		var preheatBedTemperature = this.config["heatupBedTemperature"];
		var travelSpeed = this.config["travelSpeed"] * 60;
		var printerType = this.config["type"];
		var heatedbed = this.config["heatedbed"];

		switch (printerType) {
			case "makerbot_replicator2": printerType = "r2"; break; 
			case "makerbot_replicator2x": printerType = "r2x"; break;
			case "makerbot_thingomatic": printerType = "t6"; break;
			case "makerbot_generic": printerType = "r2"; break;
			case "_3Dison_plus": printerType = "r2"; break;
		}
		var heatedBedReplacement = heatedbed ? "" : ";";

		gcode = gcode.replace(/{printingTemp}/gi, temperature);
		gcode = gcode.replace(/{printingBedTemp}/gi, bedTemperature);
		gcode = gcode.replace(/{preheatTemp}/gi, preheatTemperature);
		gcode = gcode.replace(/{preheatBedTemp}/gi, preheatBedTemperature);
		gcode = gcode.replace(/{printerType}/gi, printerType);
		gcode = gcode.replace(/{travelSpeed}/gi, travelSpeed);
		gcode = gcode.replace(/{if heatedBed}/gi, heatedBedReplacement);

		return gcode;
	}
}
