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
		const { startCode } = this.config;
		const gcode = this._subsituteVariables(startCode);
		return gcode;
	}

	endCode () {
		const { endCode } = this.config;
		const gcode = this._subsituteVariables(endCode);
		return gcode;
	}

	_subsituteVariables (gcode) {
		let {
			temperature,
			bedTemperature,
			heatTemperature,
			heatBedTemperature,
			travelSpeed,
			printerType,
			heatedbed
		} = this.config;

		travelSpeed *= 60;

		switch (printerType) {
			case 'makerbot_replicator2': printerType = 'r2'; break;
			case 'makerbot_replicator2x': printerType = 'r2x'; break;
			case 'makerbot_thingomatic': printerType = 't6'; break;
			case 'makerbot_generic': printerType = 'r2'; break;
			case '_3Dison_plus': printerType = 'r2'; break;
		}

		const heatedBedReplacement = heatedbed ? '' : ';';

		gcode = gcode.replace(/{printingTemp}/gi, temperature);
		gcode = gcode.replace(/{printingBedTemp}/gi, bedTemperature);
		gcode = gcode.replace(/{preheatTemp}/gi, heatTemperature);
		gcode = gcode.replace(/{preheatBedTemp}/gi, heatBedTemperature);
		gcode = gcode.replace(/{printerType}/gi, printerType);
		gcode = gcode.replace(/{travelSpeed}/gi, travelSpeed);
		gcode = gcode.replace(/{if heatedBed}/gi, heatedBedReplacement);

		return gcode;
	}
}
