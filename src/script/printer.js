/******************************************************
*
* Printer
* Representation of the connected printer
*
******************************************************/

D3D.Printer = function (config) {
	"use strict";
	
	for (var i in config) {
		this[i] = config[i];
	}
};
D3D.Printer.prototype.getStartCode = function () {
	"use strict";
	
	var gcode = this["printer.startcode"];
	gcode = this.subsituteVariables(gcode);

	return gcode.split("\n");
};
D3D.Printer.prototype.getEndCode = function () {
	"use strict";
	
	var gcode = this["printer.endcode"];
	gcode = this.subsituteVariables(gcode);

	return gcode.split("\n");
};
D3D.Printer.prototype.subsituteVariables = function (gcode) {
	"use strict";

	var temperature = this["printer.temperature"];
	var bedTemperature = this["printer.bed.temperature"];
	var preheatTemperature = this["printer.heatup.temperature"];
	var preheatBedTemperature = this["printer.heatup.bed.temperature"];
	var printerType = this["printer.type"];
	var heatedbed = this["printer.heatedbed"];

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
	gcode = gcode.replace(/{if heatedBed}/gi, heatedBedReplacement);

	return gcode;
};