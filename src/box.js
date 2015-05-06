/******************************************************
*
* Box
* Representation of de Doodle3DBox
* Handles all communication with the doodle box
*
******************************************************/

//TODO
//Als meerdere clients met box zouden verbinden zal de api te veel requests krijgen waardoor hij crasht
//implimentatie van het veranderen van onder andere naam, netwerkverbinding etc

D3D.Box = function (localIp) {
	"use strict";
	var self = this;

	this.batchSize = 512;
	this.maxBufferedLines = 4096;

	this.localIp = localIp;
	this.api = "http://" + localIp + "/d3dapi/";

	this.config = {};

	this.printBatches = [];
	this.currentBatch = 0;

	this.loaded = false;
	this.onload;

	getAPI(self.api + "config/all", function (data) {
		for (var i in data) {
			if (i.indexOf("doodle3d") === 0) {
				self.config[i] = data[i];
			}
		}

		self.printer = new D3D.Printer(data);
		self.update();

		self.loaded = true;
		if (self.onload !== undefined) {
			self.onload();
		}
	});
};
D3D.Box.prototype.update = function () {
	"use strict";
	//TODO
	//Code is zo op gezet dat maar api call te gelijk is
	//Bij error wordt gelijk zelfde data opnieuw gestuurd
	//Als DoodleBox ontkoppeld wordt komt er een error in de loop waardoor pagina breekt en ververst moet worden

	//if (this.printBatches.length > 0 && (this.progress["buffered_lines"] + this.batchSize) <= this.maxBufferedLines) {
	if (this.printBatches.length > 0 ) {
		this.printBatch();
	}
	else {
		this.updateState();
	}
};
D3D.Box.prototype.updateState = function () {
	"use strict";
	var self = this;

	//que api calls so they don't overload the d3d box
	getAPI(this.api + "info/status", function (data) {
		self.printer.status = data;

		self.update();
	});
};
D3D.Box.prototype.print = function (gcode) {
	"use strict";

	this.currentBatch = 0;

	//clone gcode to remove array links
	gcode = gcode.clone();

	//gcode split in batches
	while (gcode.length > 0) {
		var gcodeBatch = gcode.splice(0, Math.min(this.batchSize, gcode.length));
		this.printBatches.push(gcodeBatch);
	}

	return this;
};
D3D.Box.prototype.printBatch = function () {
	"use strict";
	var self = this;

	var gcode = this.printBatches.shift();

	sendAPI(this.api + "printer/print", {
		"start": ((this.currentBatch === 0) ? "true" : "false"),
		"first": ((this.currentBatch === 0) ? "true" : "false"),
		"gcode": gcode.join("\n")
	}, function (data) {

		console.log("batch sent: " + self.currentBatch, data);
		if (self.printBatches.length > 0) {
			//sent new batch
			self.currentBatch ++;
		}
		else {
			//finish printing
		}

		self.updateState();
	});
};
D3D.Box.prototype.stop = function () {
	"use strict";

	this.printBatches = [];
	this.currentBatch = 0;

	var finishMove = [
		"M107 ;fan off", 
		"G91 ;relative positioning", 
		"G1 E-1 F300 ;retract the filament a bit before lifting the nozzle, to release some of the pressure", 
		"G1 Z+0.5 E-5 X-20 Y-20 F9000 ;move Z up a bit and retract filament even more", 
		"G28 X0 Y0 ;move X/Y to min endstops, so the head is out of the way", 
		"M84 ;disable axes / steppers", 
		"G90 ;absolute positioning", 
		"M104 S180", 
		";M140 S70", 
		"M117 Done                 ;display message (20 characters to clear whole screen)"
	];

	sendAPI(this.api + "printer/stop", {
		"gcode": finishMove.join("\n")
		//"gcode": {}
	}, function (data) {
		console.log("Printer stop command sent");
	});

	return this;
};
D3D.Box.prototype.setConfig = function (data) {
	"use strict";

	sendAPI(this.api + "config", data);

	return this;
};
D3D.Box.prototype.getInfoLog = function (callback) {
	"use strict";

	getAPI(this.api + "info/logfiles", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.getInfoAcces = function (callback) {
	"use strict";

	//error
	//cannot call function or module 'info/acces' ('module/function 'info/acces' does not exist')

	getAPI(this.api + "info/acces", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.getNetwerkScan = function (callback) {
	"use strict";

	getAPI(this.api + "network/scan", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.getNetworkKnown = function (callback) {
	"use strict";

	getAPI(this.api + "network/known", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.getNetworkStatus = function (callback) {
	"use strict";

	getAPI(this.api + "network/status", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.setNetworkAssosiate = function (data) {
	"use strict";

	sendAPI(this.api + "network/assosiate", data);	

	return this;
};
D3D.Box.prototype.setNetworkDisassosiate = function (data) {
	"use strict";

	sendAPI(this.api + "network/displayassosiate", data);

	return this;	
};
D3D.Box.prototype.setNetworkOpenap = function (data) {
	"use strict";

	sendAPI(this.api + "network/openap", data);

	return this;	
};
D3D.Box.prototype.setNetworkRemove = function (ssid) {
	"use strict";

	sendAPI(this.api + "network/displayassosiate", {ssid: ssid});

	return this;	
};
D3D.Box.prototype.getNetworkAlive = function (callback) {
	"use strict";

	//emty?

	getAPI(this.api + "network/alive", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.getPrinterListAll = function (callback) {
	"use strict";

	getAPI(this.api + "printer/listall", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});

	return this;
};
D3D.Box.prototype.setPrinterHeatup = function (data) {
	"use strict";

	sendAPI(this.api + "printer/heatup", data);

	return this;
};
D3D.Box.prototype.getVersion = function (data) {
	"use strict";

	//error
	//cannot call function or module 'system/fwversion' ('module/function 'system/fwversion' does not exist')

	getAPI(this.api + "system/fwversion", function (data) {
		if (callback !== undefined) {
			callback(data);
		}
	});
	
	return this;
};