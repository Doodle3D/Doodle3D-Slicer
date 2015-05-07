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
		console.warn("failed connecting to " + url);
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
		console.warn("failed connecting to " + url);
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

function applyMouseControls (renderer, camera, maxDistance) {
	"use strict";
	//TODO
	//impliment touch controls
	//windows mouse wheel fix

	var distance = 20;
	var rotX = 0;
	var rotY = 0;
	var moveCamera = false;

	function updateCamera () {
		camera.position.x = Math.cos(rotY)*Math.sin(rotX)*distance;
		camera.position.y = Math.sin(rotY)*distance;
		camera.position.z = Math.cos(rotY)*Math.cos(rotX)*distance;
		camera.lookAt(new THREE.Vector3(0, 0, 0));
	}

	$(renderer.domElement).on("mousedown", function (e) {
		moveCamera = true;
	}).on("wheel", function (e) {
		var event = e.originalEvent;

		event.preventDefault();
		distance = THREE.Math.clamp(distance - event.wheelDelta, 1, maxDistance);

		updateCamera();
	});

	$(window).on("mouseup", function (e) {
		moveCamera = false;
	}).on("mousemove", function (e) {
		var event = e.originalEvent;

		if (moveCamera === true) {
			rotX = (rotX - event.webkitMovementX/100) % (2*Math.PI);
			rotY = THREE.Math.clamp(rotY + event.webkitMovementY/100, -Math.PI/2, Math.PI/2);

			updateCamera();
		}
	});
	
	updateCamera();
}

var requestAnimFrame = (function () {
	"use strict";

	return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || function (callback) {
		setTimeout(callback, 1000/60);
	};
})();
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

	//if (this.printBatches.length > 0 && (this.progress["buffered_lines"] + this.batchSize) <= this.maxBufferedLines) {
	if (this.printBatches.length > 0 ) {
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
		"gcode": finishMove.join("\n")
	}, function (data) {
		console.log("Printer stop command sent");
	});

	return this;
};

//COMMUNICATION SHELL
//see http://www.doodle3d.com/help/api-documentation
D3D.Box.prototype.getConfig = function (keys, callback) {
	//works
	"use strict";

	getAPI(this.api + "config/?" + keys.join("=&") + "=", callback);
};
D3D.Box.prototype.getConfigAll = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "config/all", callback);
};
D3D.Box.prototype.setConfig = function (data, callback) {
	//works
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
	//works
	"use strict";

	getAPI(this.api + "info", callback);
};
D3D.Box.prototype.getInfoStatus = function (callback) {
	//works
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
D3D.Box.prototype.getNetworkSignin = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "network/signin", callback);

	return this;
};
D3D.Box.prototype.getNetworkAlive = function (callback) {
	//works but returns empty array
	"use strict";

	getAPI(this.api + "network/alive", callback);

	return this;
};
D3D.Box.prototype.getPrinterTemperature = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "printer/temperature", callback);

	return this;
};
D3D.Box.prototype.getPrinterProgress = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "printer/progress", callback);

	return this;
};
D3D.Box.prototype.getPrinterState = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "printer/state", callback);

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
D3D.Box.prototype.setPrinterPrint = function (data, callback) {
	//works
	"use strict";

	sendAPI(this.api + "printer/print", data, callback);

	return this;
};
D3D.Box.prototype.setPrinterStop = function (data, callback) {
	//works
	"use strict";

	sendAPI(this.api + "printer/stop", data, callback);

	return this;
};
D3D.Box.prototype.getSketch = function (id, callback) {
	//works
	"use strict";

	getAPI(this.api + "sketch/?id=" + id, callback);
	
	return this;
};
D3D.Box.prototype.setSketch = function (data, callback) {
	//works
	"use strict";

	sendAPI(this.api + "sketch", {
		"data": data
	}, callback);
	
	return this;
};
D3D.Box.prototype.getSketchStatus = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "sketch/status", callback);
	
	return this;
};
D3D.Box.prototype.setSketchClear = function (callback) {
	//works
	"use strict";

	sendAPI(this.api + "sketch/clear", callback);
	
	return this;
};
D3D.Box.prototype.getSystemVersions = function (callback) {
	//works
	"use strict";

	getAPI(this.api + "system/fwversions", callback);
	
	return this;
};
D3D.Box.prototype.getUpdateStatus = function (callback) {
	//works
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
D3D.Slicer.prototype.setGeometry = function (geometry) {
	"use strict";

	if (geometry instanceof THREE.BufferGeometry) {
		geometry = new THREE.Geometry().fromBufferGeometry(geometry);
	}

	this.geometry = geometry.clone();
	this.geometry.mergeVertices();

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
				normals: []
			});
		}

		return index;
	}

	for (var i = 0; i < this.geometry.faces.length; i ++) {
		var face = this.geometry.faces[i];
		var normal = new THREE.Vector2().set(face.normal.x, face.normal.z).normalize();

		//check for only adding unique lines
		//returns index of said line
		var a = addLine(face.a, face.b);
		var b = addLine(face.b, face.c);
		var c = addLine(face.c, face.a);

		//set connecting lines (based on face)

		//something wrong here, 3 face can go in different direction
		this.lines[a].connects.push(b, c);
		this.lines[b].connects.push(c, a);
		this.lines[c].connects.push(a, b);

		this.lines[a].normals.push(normal);
		this.lines[b].normals.push(normal);
		this.lines[c].normals.push(normal);
	}

	//sort lines on min height
	//this.lines.sort(function (a, b) {
	//	return Math.min() - Math.min();
	//});
};
D3D.Slicer.prototype.slice = function (height, step) {
	"use strict";

	var slices = [];

	var	plane = new THREE.Plane();

	for (var z = 0; z < height; z += step) {
		plane.set(new THREE.Vector3(0, -1, 0), z);

		var slice = [];

		var intersections = [];

		for (var i = 0; i < this.lines.length; i ++) {
			var line = this.lines[i].line;

			var intersection = plane.intersectLine(line);

			if (intersection !== undefined) {
				//remove +100 when implimenting good structure for geometry is complete
				var point = new THREE.Vector2(intersection.x + 100, intersection.z + 100);

				intersections.push(point);
			}
			else {
				intersections.push(false);
			}
		}

		var done = [];
		for (var i = 0; i < intersections.length; i ++) {

			if (intersections[i] && done.indexOf(i) === -1) {
				var index = i;

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

				//think this check is not nescesary, always higher as 0
				if (shape.length > 0) {
					shape.push({X: shape[0].X, Y: shape[0].Y});
					slice.push(shape);
				}
			}
		}

		//stop when ther are no intersects
		if (slice.length > 0) {
			slices.push(slice);
		}
		else {
			break;
		}
	}

	return slices;
};
D3D.Slicer.prototype.getInset = function (slice, offset) {
	"use strict";

	var solution = new ClipperLib.Paths();
	var co = new ClipperLib.ClipperOffset(1, 1);
	co.AddPaths(slice, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, -offset);

	return solution;
};
D3D.Slicer.prototype.getFillTemplate = function (dimension, size, even, uneven) {
	"use strict";

	var paths = new ClipperLib.Paths();

	if (even) {
		for (var length = 0; length <= dimension; length += size) {
			paths.push([{X: length, Y: 0}, {X: length, Y: dimension}]);
		}
	}
	if (uneven) {
		for (var length = 0; length <= dimension; length += size) {
			paths.push([{X: 0, Y: length}, {X: dimension, Y: length}]);
		}
	}
	
	return paths;
};
D3D.Slicer.prototype.slicesToData = function (slices, printer) {
	"use strict";

	//scale because of clipper crap
	var scale = 100;

	var layerHeight = printer.config["printer.layerHeight"] * scale;
	var dimensionsZ = printer.config["printer.dimensions.z"] * scale;
	var wallThickness = printer.config["printer.wallThickness"] * scale;
	var shellThickness = printer.config["printer.shellThickness"] * scale;
	var fillSize = printer.config["printer.fillSize"] * scale;
	var brimOffset = printer.config["printer.brimOffset"] * scale;

	var data = [];

	var lowFillTemplate = this.getFillTemplate(dimensionsZ, fillSize, true, true);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		//var outerLayer = ClipperLib.JS.Clean(slice, 1.0);
		var outerLayer = slice.clone();
		ClipperLib.JS.ScaleUpPaths(outerLayer, scale);

		var innerLayer = [];

		for (var i = wallThickness; i < shellThickness; i += wallThickness) {
			var inset = this.getInset(outerLayer, i);

			innerLayer = innerLayer.concat(inset);
		}

		//moet fillArea wel kleiner?
		//var fillArea = this.getInset((inset || outerLayer), wallThickness);
		var fillArea = (inset || outerLayer);

		var fillAbove = false;
		//for (var i = 1; i < shellThickness/layerHeight; i ++) {
		for (var i = 1; i < shellThickness/layerHeight; i ++) {
			var newLayer = ClipperLib.JS.Clone(slices[layer + i]);
			ClipperLib.JS.ScaleUpPaths(newLayer, scale);

			if (newLayer.length === 0 || (fillAbove && fillAbove.length === 0)) {
				fillAbove = [];

				break;
			}
			else if (fillAbove === false) {
				fillAbove = newLayer;
			}
			else {
				var c = new ClipperLib.Clipper();
				var solution = new ClipperLib.Paths();
				c.AddPaths(newLayer, ClipperLib.PolyType.ptSubject, true);
				c.AddPaths(fillAbove, ClipperLib.PolyType.ptClip, true);
				c.Execute(ClipperLib.ClipType.ctIntersection, solution);

				fillAbove = solution;
			}
		}
		//kijkt alleen nog naar boven
		//omliggende lagen hebben inhoud van lowFill;
		//inset moet opgevult worden;
		//verschill tussen lowFill en inset moet vol, rest is raster

		var clipper = new ClipperLib.Clipper();
		var highFillArea = new ClipperLib.Paths();
		clipper.AddPaths(fillArea, ClipperLib.PolyType.ptSubject, true);
		clipper.AddPaths(fillAbove, ClipperLib.PolyType.ptClip, true);
		clipper.Execute(ClipperLib.ClipType.ctDifference, highFillArea);

		var clipper = new ClipperLib.Clipper();
		var lowFillArea = new ClipperLib.Paths();
		clipper.AddPaths(fillArea, ClipperLib.PolyType.ptSubject, true);
		clipper.AddPaths(highFillArea, ClipperLib.PolyType.ptClip, true);
		clipper.Execute(ClipperLib.ClipType.ctDifference, lowFillArea);

		var fill = [];

		var clipper = new ClipperLib.Clipper();
		var lowFillStrokes = new ClipperLib.Paths();
		clipper.AddPaths(lowFillTemplate, ClipperLib.PolyType.ptSubject, false);
		clipper.AddPaths(lowFillArea, ClipperLib.PolyType.ptClip, true);
		clipper.Execute(ClipperLib.ClipType.ctIntersection, lowFillStrokes);

		fill = fill.concat(lowFillStrokes);

		//optimize
		//make as big as bounding box of highFillArea
		var highFillTemplate = this.getFillTemplate(dimensionsZ, wallThickness, (layer % 2 === 0), (layer % 2 === 1));

		var clipper = new ClipperLib.Clipper();
		var highFillStrokes = new ClipperLib.Paths();
		clipper.AddPaths(highFillTemplate, ClipperLib.PolyType.ptSubject, false);
		clipper.AddPaths(highFillArea, ClipperLib.PolyType.ptClip, true);
		clipper.Execute(ClipperLib.ClipType.ctIntersection, highFillStrokes);		

		fill = fill.concat(highFillStrokes);

		//create brim
		/*if (layer === 0) {
			var brim = this.getInset(outerLayer, -brimOffset);
			outerLayer = brim.concat(outerLayer);
		}*/

		ClipperLib.JS.ScaleDownPaths(outerLayer, scale);
		ClipperLib.JS.ScaleDownPaths(innerLayer, scale);
		ClipperLib.JS.ScaleDownPaths(fill, scale);

		data.push({
			outerLayer: outerLayer, 
			innerLayer: innerLayer, 
			fill: fill
		});
	}

	return data;
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

			for (var j = 0; j < shape.length; j ++) {
				var point = shape[j];

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

		gcode = gcode.concat(sliceToGcode(slice.outerLayer));
		gcode = gcode.concat(sliceToGcode(slice.innerLayer));
		gcode = gcode.concat(sliceToGcode(slice.fill));
	}

	gcode = gcode.concat(printer.getEndCode());
	return gcode;
};
D3D.Slicer.prototype.drawPaths = function (printer, min, max) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var dimensionsZ = printer.config["printer.dimensions.z"];

	function drawPolygons (paths, color) {
		context.fillStyle = color;
		context.strokeStyle = color;
		context.beginPath();

		for (var i = 0; i < paths.length; i ++) {
			var path = paths[i];

			context.moveTo((path[0].X * 2), (path[0].Y * 2));

			for (var j = 0; j < path.length; j ++) {
				var point = path[j];
				context.lineTo((point.X * 2), (point.Y * 2));
			}
			//context.closePath();
		}
		context.stroke();
	}

	var slices = this.slice(dimensionsZ, layerHeight);
	slices.shift();

	var data = this.slicesToData(slices, printer);

	var canvas = document.createElement("canvas");
	canvas.width = 400;
	canvas.height = 400;
	var context = canvas.getContext("2d");

	for (var layer = min; layer < max; layer ++) {
		var slice = data[layer % data.length];

		drawPolygons(slice.outerLayer, "red");
		drawPolygons(slice.innerLayer, "green");
		drawPolygons(slice.fill, "blue");
	}

	return canvas;
};
D3D.Slicer.prototype.getGcode = function (printer) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var dimensionsZ = printer.config["printer.dimensions.z"];

	var slices = this.slice(dimensionsZ, layerHeight);
	
	//still error in first layer, so remove first layer
	//see https://github.com/Doodle3D/Doodle3D-Slicer/issues/1
	slices.shift();

	var data = this.slicesToData(slices, printer);
	//return data;

	//TODO
	//make the path more optimized for 3d printers
	//make the printer follow the shortest path from line to line
	//see https://github.com/Ultimaker/CuraEngine#gcode-generation

	var gcode = this.dataToGcode(data, printer);
	return gcode;
};