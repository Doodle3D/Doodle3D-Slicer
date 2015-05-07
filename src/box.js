/******************************************************
*
* Box
* Representation of de Doodle3DBox
* Handles all communication with the doodle box
* JavaScript shell for api communication
* Check http://www.doodle3d.com/help/api-documentation
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
		"start": ((this.currentBatch === 0) ? true : false),
		"first": ((this.currentBatch === 0) ? true : false),
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
D3D.Box.prototype.stopPrint = function () {
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
	}, function (data) {
		console.log("Printer stop command sent");
	});

	return this;
};
D3D.Box.prototype.setConfig = function (data, callback) {
	//works
	"use strict";

	sendAPI(this.api + "config", data, callback);

	return this;
};
D3D.Box.prototype.getInfo = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "info", callback);
};
D3D.Box.prototype.downloadInfoLog = function (callback) {
	//works in google chrome... not tested in other browsers
	//some browsers may redirect using this code
	"use strict";

	window.location = this.api + "info/logfiles";
};
D3D.Box.prototype.getInfoAcces = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "info/access", callback);

	return this;
};
D3D.Box.prototype.getNetworkScan = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "network/scan", callback);

	return this;
};
D3D.Box.prototype.getNetworkKnown = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "network/known", callback);

	return this;
};
D3D.Box.prototype.getNetworkStatus = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "network/status", callback);

	return this;
};
D3D.Box.prototype.setNetworkAssosiate = function (data, callback) {
	//works
	"use strict";

	sendAPI(this.api + "network/associate", data, callback);	

	return this;
};
D3D.Box.prototype.setNetworkDisassosiate = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "network/disassociate", {}, callback);

	return this;	
};
D3D.Box.prototype.setNetworkOpenAP = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "network/openap", {}, callback);

	return this;	
};
D3D.Box.prototype.setNetworkRemove = function (ssid, callback) {
	//works
	"use strict";

	sendAPI(this.api + "network/remove", {
		ssid: ssid
	}, callback);

	return this;	
};
D3D.Box.prototype.getNetworkAlive = function (callback) {
	//works but returns empty array
	"use strict";

	getAPI(this.api + "network/alive", callback);

	return this;
};
D3D.Box.prototype.getPrinterListAll = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "printer/listall", callback);

	return this;
};
D3D.Box.prototype.setPrinterHeatup = function (callback) {
	//works
	"use strict";

	sendAPI(this.api + "printer/heatup", {}, callback);

	return this;
};
D3D.Box.prototype.getSystemVersions = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "system/fwversions", callback);
	
	return this;
};
D3D.Box.prototype.getSketch = function (id, callback) {
	//not tested
	"use strict";

	getAPI(this.api + "sketch/status/?id=" + id, callback);
	
	return this;
};
D3D.Box.prototype.getSketchStatus = function (callback) {
	//not tested
	"use strict";

	getAPI(this.api + "sketch/status", callback);
	
	return this;
};
D3D.Box.prototype.getUpdateStatus = function (callback) {
	//not tested
	"use strict";

	getAPI(this.api + "update/status", callback);
	
	return this;
};
D3D.Box.prototype.setSketch = function (data, callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "sketch", data, callback);
	
	return this;
};
D3D.Box.prototype.setSketchClear = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "sketch/clear", callback);
	
	return this;
};
D3D.Box.prototype.setUpdateDownload = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "update/download", {}, callback);
	
	return this;
};
D3D.Box.prototype.setUpdateInstall = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "update/install", {}, callback);
	
	return this;
};
D3D.Box.prototype.setUpdateClear = function (callback) {
	//not tested
	"use strict";

	sendAPI(this.api + "update/clear", {}, callback);
	
	return this;
};