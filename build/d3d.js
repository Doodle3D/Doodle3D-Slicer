/******************************************************
*
* Utils
* requires jQuery, Three.js
*
******************************************************/

var D3D = {
	"version": "0.1", 
	"website": "http://www.doodle3d.com/", 
	"contact": "develop@doodle3d.com"
};

//add normal function to Three.js Vector class
THREE.Vector2.prototype.normal = function () {
	"use strict";

	var x = this.y;
	var y = -this.x;

	return this.set(x, y);
};

function sendAPI (url, data, callback) {
	"use strict";

	$.ajax({
		url: url, 
		type: "POST", 
		data: data, 
		dataType: "json", 
		timeout: 10000, 
		success: function (response) {
			if (response.status === "success") {
				if (callback !== undefined) {
					callback(response.data);
				}
			}
			else {
				console.warn(response.msg);
			}
		}
	}).fail(function () {
		console.warn("Failed connecting to " + url);
		sendAPI(url, data, callback);
	});
}

function getAPI (url, callback) {
	"use strict";

	$.ajax({
		url: url, 
		dataType: "json", 
		timeout: 5000, 
		success: function (response) {
			if (response.status === "success") {
				if (callback !== undefined) {
					callback(response.data);
				}
			}
			else {
				console.warn(response.msg);
			}
		}
	}).fail(function () {
		console.warn("Failed connecting to " + url);
		getAPI(url, callback);
	});
}

function downloadFile (file, data) {
	"use strict";
	
	$(document.createElement("a")).attr({
		download: file, 
		href: "data:text/plain," + data
	})[0].click();
}

Array.prototype.clone = function () {
	"use strict";
	
	var array = [];

	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
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

	this.getConfigAll(function (data) {
		self.updateConfig(data);

		self.printer = new D3D.Printer(data);
		self.update();

		self.loaded = true;
		if (self.onload !== undefined) {
			self.onload();
		}
	});
};
D3D.Box.prototype.updateConfig = function (config) {
	"use strict";

	for (var i in config) {
		if (i.indexOf("doodle3d") === 0) {
			this.config[i] = config[i];
		}
	}

	return this;
};
D3D.Box.prototype.update = function () {
	"use strict";
	//TODO
	//Code is zo op gezet dat maar api call te gelijk is
	//Bij error wordt gelijk zelfde data opnieuw gestuurd
	//Als DoodleBox ontkoppeld wordt komt er een error in de loop waardoor pagina breekt en ververst moet worden

	if (this.printBatches.length > 0 && (this.printer.status["buffered_lines"] + this.batchSize) <= this.maxBufferedLines) {
	//if (this.printBatches.length > 0 ) {
		this.printBatch();
	}
	else {
		this.updateState();
	}
};
D3D.Box.prototype.updateState = function () {
	//que api calls so they don't overload the d3d box
	"use strict";
	var self = this;

	this.getInfoStatus(function (data) {
		self.printer.status = data;

		if (self.onupdate !== undefined) {
			self.onupdate(data);
		}

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

	this.setPrinterPrint({
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
			//finish sending
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

	this.setPrinterStop({
		//"gcode": {}
		"gcode": finishMove.join("\n")
	}, function (data) {
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
	var self = this;

	sendAPI(this.api + "config", data, function (response) {
		for (var i in response.validation) {
			if (response.validation[i] !== "ok") {
				delete data[i];
			}
		}
		self.updateConfig(data);
		self.printer.updateConfig(data);

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
/******************************************************
*
* Printer
* Representation of the connected printer
*
******************************************************/

D3D.Printer = function (config) {
	"use strict";

	this.status = {};
	this.config = {};

	this.updateConfig(config);	
};
D3D.Printer.prototype.updateConfig = function (config) {
	"use strict";

	for (var i in config) {
		if (i.indexOf("printer") === 0) {
			this.config[i] = config[i];
		}
	}

	return this;
};
D3D.Printer.prototype.getStartCode = function () {
	"use strict";
	
	var gcode = this.config["printer.startcode"];
	gcode = this.subsituteVariables(gcode);

	return gcode.split("\n");
};
D3D.Printer.prototype.getEndCode = function () {
	"use strict";
	
	var gcode = this.config["printer.endcode"];
	gcode = this.subsituteVariables(gcode);

	return gcode.split("\n");
};
D3D.Printer.prototype.subsituteVariables = function (gcode) {
	"use strict";

	var temperature = this.config["printer.temperature"];
	var bedTemperature = this.config["printer.bed.temperature"];
	var preheatTemperature = this.config["printer.heatup.temperature"];
	var preheatBedTemperature = this.config["printer.heatup.bed.temperature"];
	var printerType = this.config["printer.type"];
	var heatedbed = this.config["printer.heatedbed"];

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
/******************************************************
*
* Path
*
* Abstraction layer for annoying clipper js
*
******************************************************/

D3D.Paths = function (paths, closed) {
	"use strict";

	Array.call(this);

	this.setPaths(paths || []);

	this.closed = (closed !== undefined) ? closed : true;
};
D3D.Paths.prototype = Object.create(Array.prototype);
D3D.Paths.prototype.setPaths = function (paths) {
	"use strict";

	for (var i = 0; i < paths.length; i ++) {
		var path = paths[i];
		this.push(path);
	}

	return this;
};
D3D.Paths.prototype.clip = function (path, type) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(type, solution);

	return new D3D.Paths(solution);
};
D3D.Paths.prototype.union = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctUnion);
};
D3D.Paths.prototype.difference = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctDifference);
};
D3D.Paths.prototype.intersect = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctIntersection);
};
D3D.Paths.prototype.xor = function () {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctXor);
};
D3D.Paths.prototype.offset = function (offset) {
	"use strict";

	var solution = new ClipperLib.Paths();
	var co = new ClipperLib.ClipperOffset(1, 1);
	co.AddPaths(this, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, offset);

	return new D3D.Paths(solution);
};
D3D.Paths.prototype.scaleUp = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleUpPaths(this, factor);

	return this;
};
D3D.Paths.prototype.scaleDown = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleDownPaths(this, factor);

	return this;
};
D3D.Paths.prototype.optimizePath = function (start) {
	"use strict";

	var optimizedPaths = new D3D.Paths();

	while (optimizedPaths.length !== this.length) {
		var minLength = undefined;
		var reverse;
		var minPath;

		for (var i = 0; i < this.length; i ++) {
			var path = this[i];

			if (optimizedPaths.indexOf(path) === -1) {
				var startPoint = new THREE.Vector2(path[0].X, path[0].Y);
				var endPoint = new THREE.Vector2(path[path.length - 1].X, path[path.length - 1].Y);
				var length = startPoint.sub(start).length();
				if (minLength === undefined || length < minLength) {
					minPath = path;
					minLength = length;
					reverse = false;
				}
				var length = endPoint.sub(start).length();
				if (length < minLength) {
					minPath = path;
					minLength = length;
					reverse = true;
				}
			}
		}

		if (reverse) {
			minPath.reverse();	
		}
		var point = minPath[minPath.length - 1];
		start = new THREE.Vector2(point.X, point.Y);
		optimizedPaths.push(minPath);
	}

	return optimizedPaths;
};
D3D.Paths.prototype.tresholdArea = function (minArea) {
	//code not tested yet
	"use strict";

	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		var area = ClipperLib.Clipper.Area(shape);

		if (area < minArea) {
			this.splice(i, 1);
			i --;
		}
	}
	
	return areas;
};
D3D.Paths.prototype.join = function (path) {
	"use strict";

	for (var i = 0; i < path.length; i ++) {
		this.push(path[i]);
	}

	return this;
};
D3D.Paths.prototype.clone = function () {
	"use strict";

	return new D3D.Paths(ClipperLib.JS.Clone(this), this.closed);
};
D3D.Paths.prototype.bounds = function () {
	"use strict";

	return ClipperLib.Clipper.GetBounds(this);
};
D3D.Paths.prototype.draw = function (context, color) {
	"use strict";

	context.strokeStyle = color;
	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		//var point = shape[0];
		//context.fillText(i, point.X*2, point.Y*2);

		context.beginPath();
		var length = this.closed ? (shape.length + 1) : shape.length;
		for (var j = 0; j < length; j ++) {
			var point = shape[j % shape.length];

			context.lineTo(point.X*2, point.Y*2);
		}
		context.stroke();
	}
};
/******************************************************
*
* Slicer
*
* TODO (optimalisatie)
* sorteer lijnen op laagste hoogte -> stop loop wanneer hij een lijn zonder intersectie heeft gevonden
* verwijder lijnen die ooit interactie gehad hebben, maar nu niet meer
* helft van lijnen toevoegen omdat 4face altijd recht is, en 3face dus te veel data bevat
* 
* omliggende lagen -> difference && sum omliggende lijnen
* voor laag 5 = 5 diff (3 && 4 && 6 && 7))
*
******************************************************/

D3D.Slicer = function () {
	"use strict";

	this.lines = [];
};
D3D.Slicer.prototype.setMesh = function (mesh) {
	"use strict";

	mesh.updateMatrix();

	var geometry = mesh.geometry.clone();
	if (geometry instanceof THREE.BufferGeometry) {
		geometry = new THREE.Geometry().fromBufferGeometry(geometry);
	}
	geometry.mergeVertices();
	geometry.applyMatrix(mesh.matrix);

	this.geometry = geometry;

	this.createLines();

	return this;
};
D3D.Slicer.prototype.createLines = function () {
	"use strict";

	this.lines = [];
	var lineLookup = {};

	var self = this;
	function addLine (a, b) {

		//think lookup can only be b_a, a_b is only possible when face is flipped
		var index = lineLookup[a + "_" + b] || lineLookup[b + "_" + a];

		if (index === undefined) {
			index = self.lines.length;
			lineLookup[a + "_" + b] = index;

			self.lines.push({
				line: new THREE.Line3(self.geometry.vertices[a], self.geometry.vertices[b]), 
				connects: [], 
				normals: [],
				ignore: 0
			});
		}

		return index;
	}

	for (var i = 0; i < this.geometry.faces.length; i ++) {
		var face = this.geometry.faces[i];

		//if (face.normal.y !== 1 && face.normal.y !== -1) {
			var normal = new THREE.Vector2().set(face.normal.x, face.normal.z).normalize();

			//check for only adding unique lines
			//returns index of said line
			var a = addLine(face.a, face.b);
			var b = addLine(face.b, face.c);
			var c = addLine(face.c, face.a);

			//set connecting lines (based on face)
			this.lines[a].connects.push(b, c);
			this.lines[b].connects.push(c, a);
			this.lines[c].connects.push(a, b);

			this.lines[a].normals.push(normal);
			this.lines[b].normals.push(normal);
			this.lines[c].normals.push(normal);
		//}
	}
};
D3D.Slicer.prototype.slice = function (height, step) {
	"use strict";

	var layersIntersections = [];

	for (var i = 0; i < this.lines.length; i ++) {
		var line = this.lines[i];

		var min = Math.ceil(Math.min(line.line.start.y, line.line.end.y) / step);
		var max = Math.floor(Math.max(line.line.start.y, line.line.end.y) / step);

		for (var layerIndex = min; layerIndex <= max; layerIndex ++) {
			if (layerIndex >= 0) {
				if (layersIntersections[layerIndex] === undefined) {
					layersIntersections[layerIndex] = [];
				}
				layersIntersections[layerIndex].push(i);
			}
		}
	}

	var slices = [];

	for (var layer = 1; layer < layersIntersections.length-1; layer ++) {
		var layerIntersections = layersIntersections[layer];
		var y = layer*step;

		var intersections = [];
		for (var i = 0; i < layerIntersections.length; i ++) {
			var index = layerIntersections[i];
			var line = this.lines[index].line;

			var alpha = (y - line.start.y) / (line.end.y - line.start.y);
			var x = line.end.x * alpha + line.start.x * (1 - alpha);
			var z = line.end.z * alpha + line.start.z * (1 - alpha);

			intersections[index] = new THREE.Vector2(x, z);
		}

		var done = [];
		var slice = new D3D.Paths([], true);
		for (var i = 0; i < layerIntersections.length; i ++) {
			var index = layerIntersections[i];

			if (done.indexOf(index) === -1) {
				var shape = [];

				while (index !== -1) {
					var intersection = intersections[index];
					shape.push({X: intersection.x, Y: intersection.y});

					done.push(index);

					var connects = this.lines[index].connects;
					var faceNormals = this.lines[index].normals;
					for (var j = 0; j < connects.length; j ++) {
						index = connects[j];

						if (intersections[index] && done.indexOf(index) === -1) {
							var a = new THREE.Vector2().set(intersection.x, intersection.y);
							var b = intersections[index];
							var normal = a.sub(b).normal().normalize();
							var faceNormal = faceNormals[Math.floor(j/2)];

							if (normal.dot(faceNormal) > 0) {
								break;
							}
							else {
								index = -1;
							}
						}
						else {
							index = -1;
						}
					}
				}

				/*
				for (var i = 0; i < shape.length; i ++) {
					var point = shape[i];
					var previousPoint = shape[(i + shape.length - 1) % shape.length];
					var nextPoint = shape[(i + 1) % shape.length];

					var point = new THREE.Vector2(point.X, point.Y);
					var previousPoint = new THREE.Vector2(previousPoint.X, previousPoint.Y);
					var nextPoint = new THREE.Vector2(nextPoint.X, nextPoint.Y);
					//var lineLength = nextPoint.sub(previousPoint).length();

					var normal = nextPoint.sub(previousPoint).normal().normalize();
					var distance = Math.abs(normal.dot(point.sub(previousPoint)));

					//something better for offset check
					if (distance <= 0.01) {
						shape.splice(i, 1);
						i --;
					}
				}
				*/

				//think this check is not nescesary, always higher as 0
				if (shape.length > 0) {
					slice.push(new D3D.Paths([shape]));
				}
			}
		}

		var layerParts = [];

		for (var i = 0; i < slice.length; i ++) {
			var layerPart1 = slice[i];
			var merge = false;

			for (var j = 0; j < layerParts.length; j ++) {
				var layerPart2 = layerParts[j];

				if (layerPart2.intersect(layerPart1).length > 0) {
					layerPart2.join(layerPart1);
					merge = true;
					break;
				}
			}
			if (!merge) {
				layerParts.push(layerPart1);
			}
		}

		//stop when ther are no intersects
		if (layerParts.length > 0) {
			slices.push(layerParts);
		}
		else {
			break;
		}
	}

	return slices;
};
D3D.Slicer.prototype.slicesToData = function (slices, printer) {
	"use strict";

	var scale = 100;

	var layerHeight = printer.config["printer.layerHeight"] * scale;
	var dimensionsZ = printer.config["printer.dimensions.z"] * scale;
	var wallThickness = printer.config["printer.wallThickness"] * scale;
	var shellThickness = printer.config["printer.shellThickness"] * scale;
	var fillSize = printer.config["printer.fillSize"] * scale;
	var brimOffset = printer.config["printer.brimOffset"] * scale;
	var skinCount = Math.ceil(shellThickness/layerHeight);

	var data = [];

	var lowFillTemplate = this.getFillTemplate({
		left: 0, 
		top: 0, 
		right: dimensionsZ, 
		bottom: dimensionsZ
	}, fillSize, true, true);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];
		
		var layerData = [];
		data.push(layerData);
		
		var downSkin = new D3D.Paths([], true);
		if (layer - skinCount >= 0) {
			var downLayer = slices[layer - skinCount];
			for (var i = 0; i < downLayer.length; i ++) {
				downSkin.join(downLayer[i]);
			}
		}
		var upSkin = new D3D.Paths([], true);
		if (layer + skinCount < slices.length) {
			var downLayer = slices[layer + skinCount];
			for (var i = 0; i < downLayer.length; i ++) {
				upSkin.join(downLayer[i]);
			}
		}
		var surroundingLayer = upSkin.intersect(downSkin).clone().scaleUp(scale);
		var sliceData = [];

		for (var i = 0; i < slice.length; i ++) {
			var part = slice[i];

			var outerLayer = part.clone();
			outerLayer.scaleUp(scale);

			var insets = new D3D.Paths([], true);
			for (var offset = wallThickness; offset <= shellThickness; offset += wallThickness) {
				var inset = outerLayer.offset(-offset);

				insets.join(inset);
			}

			var fillArea = (inset || outerLayer).offset(-wallThickness/2);

			var highFillArea = fillArea.difference(surroundingLayer);

			var lowFillArea = fillArea.difference(highFillArea);

			var fill = new D3D.Paths([], false);

			fill.join(lowFillTemplate.intersect(lowFillArea));

			if (highFillArea.length > 0) {
				var highFillTemplate = this.getFillTemplate(highFillArea.bounds(), wallThickness, (layer % 2 === 0), (layer % 2 === 1));
				fill.join(highFillTemplate.intersect(highFillArea));
			}

			var lastPath = insets[insets.length - 1];
			var lastPoint = lastPath[lastPath.length - 1];
			var start = new THREE.Vector2(lastPoint.X, lastPoint.Y);
			fill = fill.optimizePath(start);			

			layerData.push({
				outerLayer: outerLayer.scaleDown(scale),
				fill: fill.scaleDown(scale),
				insets: insets.scaleDown(scale)
			});
		}
	}

	return data;
};
D3D.Slicer.prototype.getFillTemplate = function (bounds, size, even, uneven) {
	"use strict";

	var paths = new D3D.Paths([], false);

	if (even) {
		for (var length = Math.floor(bounds.left); length <= Math.ceil(bounds.right); length += size) {
			paths.push([{X: length, Y: bounds.top}, {X: length, Y: bounds.bottom}]);
		}
	}
	if (uneven) {
		for (var length = Math.floor(bounds.top); length <= Math.floor(bounds.bottom); length += size) {
			paths.push([{X: bounds.left, Y: length}, {X: bounds.right, Y: length}]);
		}
	}
	
	//return paths;
	return paths;
};
D3D.Slicer.prototype.dataToGcode = function (data, printer) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var normalSpeed = printer.config["printer.speed"];
	var bottomSpeed = printer.config["printer.bottomLayerSpeed"];
	var firstLayerSlow = printer.config["printer.firstLayerSlow"];
	var bottomFlowRate = printer.config["printer.bottomFlowRate"];
	var travelSpeed = printer.config["printer.travelSpeed"];
	var filamentThickness = printer.config["printer.filamentThickness"];
	var wallThickness = printer.config["printer.wallThickness"];
	var enableTraveling = printer.config["printer.enableTraveling"];
	var retractionEnabled = printer.config["printer.retraction.enabled"];
	var retractionSpeed = printer.config["printer.retraction.speed"];
	var retractionMinDistance = printer.config["printer.retraction.minDistance"];
	var retractionAmount = printer.config["printer.retraction.amount"];

	function sliceToGcode (slice) {
		var gcode = [];

		for (var i = 0; i < slice.length; i ++) {
			var shape = slice[i];

			var previousPoint;

			var length = slice.closed ? (shape.length + 1) : shape.length;

			for (var j = 0; j < length; j ++) {
				var point = shape[j % shape.length];

				if (j === 0) {
					//TODO
					//add retraction
					if (extruder > retractionMinDistance && retractionEnabled) {
						gcode.push([
							"G0", 
							"E" + (extruder - retractionAmount).toFixed(3), 
							"F" + (retractionSpeed * 60).toFixed(3)
						].join(" "));
					}

					gcode.push([
						"G0", 
						"X" + point.X.toFixed(3) + " Y" + point.Y.toFixed(3) + " Z" + z, 
						"F" + (travelSpeed*60)
					].join(" "));

					if (extruder > retractionMinDistance && retractionEnabled) {
						gcode.push([
							"G0", 
							"E" + extruder.toFixed(3), 
							"F" + (retractionSpeed * 60).toFixed(3)
						].join(" "));
					}
				}
				else {
					var a = new THREE.Vector2().set(point.X, point.Y);
					var b = new THREE.Vector2().set(previousPoint.X, previousPoint.Y);
					var lineLength = a.distanceTo(b);

					extruder += lineLength * wallThickness * layerHeight / filamentSurfaceArea * flowRate;

					gcode.push([
						"G1", 
						"X" + point.X.toFixed(3) + " Y" + point.Y.toFixed(3) + " Z" + z, 
						"F" + speed, 
						"E" + extruder.toFixed(3)
					].join(" "));
				}

				previousPoint = point;
			}
		}

		return gcode;
	}

	var gcode = printer.getStartCode();

	var extruder = 0.0;
	var speed = firstLayerSlow ? (bottomSpeed*60).toFixed(3) : (normalSpeed*60).toFixed(3);
	var filamentSurfaceArea = Math.pow((filamentThickness/2), 2) * Math.PI;
	var flowRate = bottomFlowRate;

	for (var layer = 0; layer < data.length; layer ++) {
		var slice = data[layer];

		//turn on fan on layer 2
		if (layer === 2) {
			gcode.push("M106");
			speed = (normalSpeed*60).toFixed(3);
			flowRate = 1;
		}

		var z = ((layer + 1) * layerHeight).toFixed(3);

		for (var i = 0; i < slice.length; i ++) {
			var layerPart = slice[i];

			gcode = gcode.concat(sliceToGcode(layerPart.outerLayer));
			gcode = gcode.concat(sliceToGcode(layerPart.insets));
			gcode = gcode.concat(sliceToGcode(layerPart.fill));
		}
	}

	gcode = gcode.concat(printer.getEndCode());
	return gcode;
};
//only for debug purposes
D3D.Slicer.prototype.drawPaths = function (printer, min, max) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var dimensionsZ = printer.config["printer.dimensions.z"];

	var slices = this.slice(dimensionsZ, layerHeight);

	var data = this.slicesToData(slices, printer);

	var canvas = document.createElement("canvas");
	canvas.width = 400;
	canvas.height = 400;
	var context = canvas.getContext("2d");

	for (var layer = min; layer < max; layer ++) {
		var slice = data[layer % data.length];

		for (var i = 0; i < slice.length; i ++) {
			var layerPart = slice[i];

			layerPart.insets.draw(context, "blue");
			layerPart.outerLayer.draw(context, "green");
			layerPart.fill.draw(context, "red");
		}
	}

	return canvas;
};
D3D.Slicer.prototype.getGcode = function (printer) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var dimensionsZ = printer.config["printer.dimensions.z"];

	var start = new Date().getTime();
	var slices = this.slice(dimensionsZ, layerHeight);
	var end = new Date().getTime();

	console.log("Slicing: " + (end - start) + "ms");

	//still error in first layer, so remove first layer
	//see https://github.com/Doodle3D/Doodle3D-Slicer/issues/1

	var start = new Date().getTime();
	var data = this.slicesToData(slices, printer);
	var end = new Date().getTime();

	console.log("Data: " + (end - start) + "ms");

	//return data;

	//TODO
	//make the path more optimized for 3d printers
	//make the printer follow the shortest path from line to line
	//see https://github.com/Ultimaker/CuraEngine#gcode-generation

	var start = new Date().getTime();
	var gcode = this.dataToGcode(data, printer);
	var end = new Date().getTime();

	console.log("Gcode: " + (end - start) + "ms");

	return gcode;
};