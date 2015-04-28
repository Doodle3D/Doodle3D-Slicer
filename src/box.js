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

	this.printBatches = [];
	this.currentBatch = 0;

	this.loaded = false;
	this.onload;

	getAPI(self.api + "config/all", function (data) {
		//self.config = data;

		for (var i in data) {
			if (i.indexOf("doodle3d") === 0) {
				self[i] = data[i];
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
	getAPI(this.api + "printer/state", function (data) {
		self.printer.state = data.state;

		if (data.state !== "connecting" && data.state !== "disconnected") {
			
			getAPI(self.api + "printer/temperature", function (data) {
				self.printer.temperature = data;

				getAPI(self.api + "printer/progress", function (data) {
					self.printer.progress = data;

					//finish updating state
					self.update();
				});
			});
		}
		else {
			self.update();
		}
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
};