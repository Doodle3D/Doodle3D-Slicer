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
	var scope = this;

	this.alive = false;

	this.batchSize = 512;
	this.maxBufferedLines = 4096;

	this.localIp = localIp;
	this.api = "http://" + localIp + "/d3dapi/";
	
	this.config = {};
	this.status = {};

	this.printBatches = [];
	this.currentBatch = 0;

	this.loaded = false;

	this.init();
};
D3D.Box.prototype.init = function () {
	"use strict";
	var scope = this;

	this.getNetworkAlive(function (error, data) {
		if (error) {
			scope.alive = false;
			console.warn(error);
			
			setTimeout(function () {
				scope.init();
			}, 1000);

			return;
		}

		scope.alive = true;

		scope.getConfigAll(function (error, data) {
			if (error) {
				console.warn(error);
				scope.init();
			}

			scope.updateConfig(data);

			if (!scope.loaded) {
				scope.loaded = true;
				if (scope.onload !== undefined) {
					scope.onload();
				}
			}

			scope.updateLoop();
		});
	});

	return this;
};
D3D.Box.prototype.updateConfig = function (config) {
	"use strict";

	for (var i in config) {
		this.config[i] = config[i];
	}

	return this;
};
D3D.Box.prototype.updateLoop = function () {
	"use strict";
	var scope = this;
	//TODO
	//Code is zo op gezet dat maar api call te gelijk is
	//Bij error wordt gelijk zelfde data opnieuw gestuurd
	//Als DoodleBox ontkoppeld wordt komt er een error in de loop waardoor pagina breekt en ververst moet worden

	if (this.printBatches.length > 0 && (this.status["buffered_lines"] + this.batchSize) <= this.maxBufferedLines) {
	//if (this.printBatches.length > 0 ) {
		this.printBatch();
	}
	else {
		setTimeout(function () {
			scope.updateState();
		}, 1000);
	}
};
D3D.Box.prototype.updateState = function () {
	//que api calls so they don't overload the d3d box
	"use strict";
	var scope = this;

	this.getInfoStatus(function (error, data) {
		if (error) {
			console.warn(error);
			scope.init();

			return;
		}

		scope.status = data;

		if (scope.onupdate !== undefined) {
			scope.onupdate(data);
		}

		scope.updateLoop();
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
	var scope = this;

	var gcode = this.printBatches.shift();

	this.setPrinterPrint({
		"start": ((this.currentBatch === 0) ? true : false), 
		"first": ((this.currentBatch === 0) ? true : false), 
		"gcode": gcode.join("\n"), 
		"last": ((this.printBatches.length === 0) ? true : false) //only for debug purposes
	}, function (error, data) {
		if (error) {
			scope.printBatches.unshift(gcode);
			console.warn(error);
			scope.init();

			return;
		}

		console.log("batch sent: " + scope.currentBatch, data);

		if (scope.printBatches.length > 0) {
			//sent new batch
			scope.currentBatch ++;
		}
		else {
			//finish sending
		}

		scope.updateState();
	});
};
D3D.Box.prototype.stopPrint = function (printer) {
	"use strict";
	var scope = this;

	this.printBatches = [];
	this.currentBatch = 0;

	this.setPrinterStop({
		"gcode": printer.getEndCode()
	}, function (error, data) {
		if (error) {
			console.warn(error);
			scope.init();

			return;
		}

		console.log("Printer stop command sent");
	});

	return this;
};

//COMMUNICATION SHELL
//see http://www.doodle3d.com/help/api-documentation
D3D.Box.prototype.getConfig = function (keys, callback) {
	"use strict";

	getAPI(this.api + "config/?" + keys.join("=&") + "=", callback);

	return this;
};
D3D.Box.prototype.getConfigAll = function (callback) {
	"use strict";

	getAPI(this.api + "config/all", callback);

	return this;
};
D3D.Box.prototype.setConfig = function (data, callback) {
	"use strict";
	var scope = this;

	sendAPI(this.api + "config", data, function (response) {
		for (var i in response.validation) {
			if (response.validation[i] === "ok") {
				scope[i] = data[i];
			}
		}

		if (callback !== undefined) {
			callback(response);
		}
	});

	return this;
};
D3D.Box.prototype.getInfo = function (callback) {
	"use strict";

	getAPI(this.api + "info", callback);

	return this;
};
D3D.Box.prototype.getInfoStatus = function (callback) {
	"use strict";

	getAPI(this.api + "info/status", callback);

	return this;
};
D3D.Box.prototype.downloadInfoLogFiles = function () {
	//works in google chrome... not tested in other browsers
	//some browsers may redirect using this code
	"use strict";

	window.location = this.api + "info/logfiles";
};
D3D.Box.prototype.getInfoAcces = function (callback) {
	"use strict";

	getAPI(this.api + "info/access", callback);

	return this;
};
D3D.Box.prototype.getNetworkScan = function (callback) {
	"use strict";

	getAPI(this.api + "network/scan", callback);

	return this;
};
D3D.Box.prototype.getNetworkKnown = function (callback) {
	"use strict";

	getAPI(this.api + "network/known", callback);

	return this;
};
D3D.Box.prototype.getNetworkStatus = function (callback) {
	"use strict";

	getAPI(this.api + "network/status", callback);

	return this;
};
D3D.Box.prototype.setNetworkAssosiate = function (data, callback) {
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
	"use strict";

	sendAPI(this.api + "network/remove", {
		"ssid": ssid
	}, callback);

	return this;	
};
D3D.Box.prototype.getNetworkSignin = function (callback) {
	"use strict";

	getAPI(this.api + "network/signin", callback);

	return this;
};
D3D.Box.prototype.getNetworkAlive = function (callback) {
	"use strict";

	getAPI(this.api + "network/alive", callback);

	return this;
};
D3D.Box.prototype.getPrinterTemperature = function (callback) {
	"use strict";

	getAPI(this.api + "printer/temperature", callback);

	return this;
};
D3D.Box.prototype.getPrinterProgress = function (callback) {
	"use strict";

	getAPI(this.api + "printer/progress", callback);

	return this;
};
D3D.Box.prototype.getPrinterState = function (callback) {
	"use strict";

	getAPI(this.api + "printer/state", callback);

	return this;
};
D3D.Box.prototype.getPrinterListAll = function (callback) {
	"use strict";

	getAPI(this.api + "printer/listall", callback);

	return this;
};
D3D.Box.prototype.setPrinterHeatup = function (callback) {
	"use strict";

	sendAPI(this.api + "printer/heatup", {}, callback);

	return this;
};
D3D.Box.prototype.setPrinterPrint = function (data, callback) {
	"use strict";

	sendAPI(this.api + "printer/print", data, callback);

	return this;
};
D3D.Box.prototype.setPrinterStop = function (data, callback) {
	"use strict";

	sendAPI(this.api + "printer/stop", data, callback);

	return this;
};
D3D.Box.prototype.getSketch = function (id, callback) {
	"use strict";

	getAPI(this.api + "sketch/?id=" + id, callback);
	
	return this;
};
D3D.Box.prototype.setSketch = function (data, callback) {
	"use strict";

	sendAPI(this.api + "sketch", {
		"data": data
	}, callback);
	
	return this;
};
D3D.Box.prototype.getSketchStatus = function (callback) {
	"use strict";

	getAPI(this.api + "sketch/status", callback);
	
	return this;
};
D3D.Box.prototype.setSketchClear = function (callback) {
	"use strict";

	sendAPI(this.api + "sketch/clear", callback);
	
	return this;
};
D3D.Box.prototype.getSystemVersions = function (callback) {
	"use strict";

	getAPI(this.api + "system/fwversions", callback);
	
	return this;
};
D3D.Box.prototype.getUpdateStatus = function (callback) {
	"use strict";

	getAPI(this.api + "update/status", callback);
	
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