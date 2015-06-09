/******************************************************
*
* Slicer
*
******************************************************/

D3D.Slicer = function () {
	"use strict";

	this.progress = {
		totalFaces: 0,
		currentFace: 0, 
		totalLayers: 0, 
		sliceLayer: 0, 
		dataLayer: 0, 
		gcodeLayer: 0
	};
};
D3D.Slicer.prototype.setMesh = function (geometry, matrix) {
	"use strict";

	//convert buffergeometry to geometry;
	if (geometry instanceof THREE.BufferGeometry) {
		geometry = new THREE.Geometry().fromBufferGeometry(geometry);
	}

	//apply mesh matrix on geometry;
	geometry.applyMatrix(matrix);
	geometry.mergeVertices();
	geometry.computeFaceNormals();
	geometry.computeBoundingBox();
	
	/*
	for (var i = 0; i < geometry.faces.length; i ++) {
		var face = geometry.faces[i];
		var normal = face.normal;

		if (normal.x === 0 && normal.y === 0 && normal.z === 0) {
			geometry.faces.splice(i, 1);
			i --;
		}
	}
	*/

	this.geometry = geometry;

	//get unique lines from geometry;
	this.createLines();

	return this;
};
D3D.Slicer.prototype.updateProgress = function () {
	'use strict';
	
	var faces = this.progress.currentFace / (this.progress.totalFaces - 1);
	var slice = this.progress.sliceLayer / (this.progress.totalLayers - 1);
	var data = this.progress.dataLayer / (this.progress.totalLayers - 2);
	var gcode = this.progress.gcodeLayer / (this.progress.totalLayers - 2);

	this.progress.procent = (faces + slice + data + gcode) / 4;

	if (this.onProgress !== undefined) {

		this.onProgress(this.progress);
	}
};
D3D.Slicer.prototype.createLines = function () {
	"use strict";

	this.progress.totalFaces = this.geometry.faces.length;

	this.lines = [];
	var lineLookup = {};

	var self = this;
	function addLine (a, b) {
		var index = lineLookup[b + "_" + a];

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

		if (face.normal.y !== 1 && face.normal.y !== -1) {
			var normal = new THREE.Vector2().set(face.normal.z, face.normal.x).normalize();

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
		}

		this.progress.currentFace = i;
		this.updateProgress();
	}
};
D3D.Slicer.prototype.slice = function (layerHeight, height) {
	"use strict";
	var numLayers = height / layerHeight;

	var layersIntersections = [];

	for (var lineIndex = 0; lineIndex < this.lines.length; lineIndex ++) {
		var line = this.lines[lineIndex].line;

		var min = Math.ceil(Math.min(line.start.y, line.end.y) / layerHeight);
		var max = Math.floor(Math.max(line.start.y, line.end.y) / layerHeight);

		for (var layerIndex = min; layerIndex <= max; layerIndex ++) {
			if (layerIndex >= 0 && layerIndex < numLayers) {
				if (layersIntersections[layerIndex] === undefined) {
					layersIntersections[layerIndex] = [];
				}
				layersIntersections[layerIndex].push(lineIndex);
			}
		}
	}

	var slices = [];

	//still error in first layer, so remove first layer & last layer
	//see https://github.com/Doodle3D/Doodle3D-Slicer/issues/1
	for (var layer = 0; layer < layersIntersections.length; layer ++) {
		var layerIntersections = layersIntersections[layer];
		var y = layer * layerHeight;

		var intersections = [];
		var log = [];
		for (var i = 0; i < layerIntersections.length; i ++) {
			var index = layerIntersections[i];
			var line = this.lines[index].line;

			if (line.start.y === line.end.y) {
				var x = line.start.x;
				var z = line.start.z;
			}
			else {
				var alpha = (y - line.start.y) / (line.end.y - line.start.y);
				var x = line.end.x * alpha + line.start.x * (1 - alpha);
				var z = line.end.z * alpha + line.start.z * (1 - alpha);
			}

			intersections[index] = new THREE.Vector2(z, x);
			log.push({x: z, y: x, index: index, connects: this.lines[index].connects});
		}
		/*if (layer === 10) {
			console.log(JSON.stringify(log));
			breakCode();
		}*/

		var done = [];
		var slice = [];
		for (var i = 0; i < layerIntersections.length; i ++) {
			var index = layerIntersections[i];

			if (done.indexOf(index) === -1) {
				var shape = [];

				while (index !== -1) {
					var intersection = intersections[index];
					shape.push({X: intersection.x, Y: intersection.y});

					var connects = this.lines[index].connects;
					var faceNormals = this.lines[index].normals;
					for (var j = 0; j < connects.length; j ++) {
						index = connects[j];

						if (intersections[index] !== undefined && done.indexOf(index) === -1) {
							done.push(index);

							var a = new THREE.Vector2(intersection.x, intersection.y);
							var b = intersections[index];

							if (a.distanceTo(b) === 0) {
								connects = connects.concat(this.lines[index].connects);
								faceNormals = faceNormals.concat(this.lines[index].normals);
								index = -1;
							}
							else {
								var normal = a.sub(b).normal().normalize();
								var faceNormal = faceNormals[Math.floor(j/2)];

								if (normal.dot(faceNormal) >= 0) {
								//if (true) {
									break;
								}
								else {
									index = -1;
								}
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

		this.progress.sliceLayer = layer;
		this.updateProgress();
	}
	return slices;
};
D3D.Slicer.prototype.slicesToData = function (slices, printer) {
	"use strict";

	var scale = 100;

	var layerHeight = printer.config["printer.layerHeight"] * scale;
	var dimensionsZ = printer.config["printer.dimensions.z"] * scale;
	var nozzleDiameter = printer.config["printer.nozzleDiameter"] * scale;
	var shellThickness = printer.config["printer.shellThickness"] * scale;
	var fillSize = printer.config["printer.fillSize"] * scale;
	var brimOffset = printer.config["printer.brimOffset"] * scale;
	var bottomThickness = printer.config["printer.bottomThickness"] * scale;
	var topThickness = printer.config["printer.topThickness"] * scale;

	var bottomSkinCount = Math.ceil(bottomThickness/layerHeight);
	var topSkinCount = Math.ceil(topThickness/layerHeight);
	var nozzleRadius = nozzleDiameter / 2;

	var start = new THREE.Vector2(0, 0);

	var data = [];

	var lowFillTemplate = this.getFillTemplate({
		left: this.geometry.boundingBox.min.z * scale, 
		top: this.geometry.boundingBox.min.x * scale, 
		right: this.geometry.boundingBox.max.z * scale, 
		bottom: this.geometry.boundingBox.max.x * scale
	}, fillSize, true, true);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];
		
		var layerData = [];
		data.push(layerData);
		
		var downSkin = new D3D.Paths([], true);
		if (layer - bottomSkinCount >= 0) {
			var downLayer = slices[layer - bottomSkinCount];
			for (var i = 0; i < downLayer.length; i ++) {
				downSkin.join(downLayer[i]);
			}
		}
		var upSkin = new D3D.Paths([], true);
		if (layer + topSkinCount < slices.length) {
			var upLayer = slices[layer + topSkinCount];
			for (var i = 0; i < upLayer.length; i ++) {
				upSkin.join(upLayer[i]);
			}
		}
		var surroundingLayer = upSkin.intersect(downSkin).scaleUp(scale);
		var sliceData = [];

		for (var i = 0; i < slice.length; i ++) {
			var part = slice[i];

			//var outerLayer = part.clone();
			var outerLayer = part.clone().scaleUp(scale).offset(-nozzleRadius);

			if (outerLayer.length > 0) {
				var insets = new D3D.Paths([], true);
				for (var offset = nozzleDiameter; offset <= shellThickness; offset += nozzleDiameter) {
					var inset = outerLayer.offset(-offset);

					insets.join(inset);
				}

				var fillArea = (inset || outerLayer).offset(-nozzleRadius);
				//var fillArea = (inset || outerLayer).clone();
				var highFillArea = fillArea.difference(surroundingLayer);
				var lowFillArea = fillArea.difference(highFillArea);

				var fill = new D3D.Paths([], false);

				if (lowFillTemplate.length > 0) {
					fill.join(lowFillTemplate.intersect(lowFillArea));
				}

				if (highFillArea.length > 0) {
					var bounds = highFillArea.bounds();
					var even = (layer % 2 === 0);
					var highFillTemplate = this.getFillTemplate(bounds, nozzleDiameter, even, !even);
					fill.join(highFillTemplate.intersect(highFillArea));
				}

				outerLayer = outerLayer.optimizePath(start);
				if (insets.length > 0) {
					insets = insets.optimizePath(outerLayer.lastPoint());
					fill = fill.optimizePath(insets.lastPoint());
				}
				else {
					fill = fill.optimizePath(outerLayer.lastPoint());
				}

				if (fill.length > 0) {
					start = fill.lastPoint();
				}
				else if (insets.length > 0) {
					start = insets.lastPoint();
				}
				else {
					start = outerLayer.lastPoint();
				}

				layerData.push({
					outerLayer: outerLayer.scaleDown(scale),
					fill: fill.scaleDown(scale),
					insets: insets.scaleDown(scale)
				});
			}
		}

		this.progress.dataLayer = layer;
		this.updateProgress();
	}

	return data;
};
D3D.Slicer.prototype.getFillTemplate = function (bounds, size, even, uneven) {
	"use strict";

	var paths = new D3D.Paths([], false);

	if (even) {
		for (var length = Math.floor(bounds.left/size)*size; length <= Math.ceil(bounds.right/size)*size; length += size) {
			paths.push([{X: length, Y: bounds.top}, {X: length, Y: bounds.bottom}]);
		}
	}
	if (uneven) {
		for (var length = Math.floor(bounds.top/size)*size; length <= Math.floor(bounds.bottom/size)*size; length += size) {
			paths.push([{X: bounds.left, Y: length}, {X: bounds.right, Y: length}]);
		}
	}
	
	//return paths;
	return paths;
};
/*
D3D.Slicer.prototype.dataToGCode = function (data, printer) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var normalSpeed = printer.config["printer.speed"];
	var bottomSpeed = printer.config["printer.bottomLayerSpeed"];
	var firstLayerSlow = printer.config["printer.firstLayerSlow"];
	var bottomFlowRate = printer.config["printer.bottomFlowRate"];
	var normalFlowRate = printer.config["printer.normalFlowRate"];
	var travelSpeed = printer.config["printer.travelSpeed"];
	var filamentThickness = printer.config["printer.filamentThickness"];
	var nozzleDiameter = printer.config["printer.nozzleDiameter"];
	var enableTraveling = printer.config["printer.enableTraveling"];
	var retractionEnabled = printer.config["printer.retraction.enabled"];
	var retractionSpeed = printer.config["printer.retraction.speed"];
	var retractionMinDistance = printer.config["printer.retraction.minDistance"];
	var retractionAmount = printer.config["printer.retraction.amount"];

	function sliceToGCode (path) {
		var gcode = [];

		for (var i = 0; i < path.length; i ++) {
			var shape = path[i];

			var previousPoint;

			var length = path.closed ? (shape.length + 1) : shape.length;

			for (var j = 0; j < length; j ++) {
				var point = shape[j % shape.length];

				if (j === 0) {
					//TODO
					//add retraction

					gcode.push(
						"G0" + 
						" X" + point.X.toFixed(3) + " Y" + point.Y.toFixed(3) + " Z" + z + 
						" F" + (travelSpeed * 60)
					);
					
					if (extruder > retractionMinDistance && retractionEnabled && j === 0) {
						gcode.push(
							"G0" + 
							" E" + extruder.toFixed(3) + 
							" F" + (retractionSpeed * 60).toFixed(3)
						);
					}
					
				}
				else {
					var a = new THREE.Vector2(point.X, point.Y);
					var b = new THREE.Vector2(previousPoint.X, previousPoint.Y);
					var lineLength = a.distanceTo(b);

					extruder += lineLength * nozzleDiameter * layerHeight / filamentSurfaceArea * flowRate;

					gcode.push(
						"G1" + 
						" X" + point.X.toFixed(3) + " Y" + point.Y.toFixed(3) + " Z" + z + 
						" F" + speed + 
						" E" + extruder.toFixed(3)
					);
				}

				previousPoint = point;
			}
		}

		if (extruder > retractionMinDistance && retractionEnabled) {
			gcode.push(
				"G0" +
				" E" + (extruder - retractionAmount).toFixed(3) + 
				" F" + (retractionSpeed * 60).toFixed(3)
			);
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

		//turn on fan on layer 1
		if (layer === 1) {
			gcode.push("M106");
			speed = (normalSpeed*60).toFixed(3);
			flowRate = normalFlowRate;
		}

		var z = ((layer + 1) * layerHeight).toFixed(3);

		for (var i = 0; i < slice.length; i ++) {
			var layerPart = slice[i];

			gcode = gcode.concat(sliceToGCode(layerPart.outerLayer));
			gcode = gcode.concat(sliceToGCode(layerPart.insets));
			gcode = gcode.concat(sliceToGCode(layerPart.fill));
		}

		this.progress.gcodeLayer = layer;
		this.updateProgress();
	}

	gcode = gcode.concat(printer.getEndCode());

	return gcode;
};
*/
D3D.Slicer.prototype.dataToGCode = function (data, printer) {
	"use strict";

	var gcode = new D3D.GCode().setSettings(printer);

	function sliceToGCode (path, retract, unRetract) {
		for (var i = 0; i < path.length; i ++) {
			var shape = path[i];

			var length = path.closed ? (shape.length + 1) : shape.length;

			for (var j = 0; j < length; j ++) {
				var point = shape[j % shape.length];

				if (j === 0) {
					gcode.moveTo(false, point.X, point.Y, layer);

					if (unRetract) {
						gcode.unRetract();
					}
				}
				else {
					gcode.moveTo(true, point.X, point.Y, layer);
				}
			}
		}
		
		if (retract) {
			gcode.retract();
		}
	}

	for (var layer = 0; layer < data.length; layer ++) {
		var slice = data[layer];

		if (layer === 1) {
			gcode.turnFanOn();
			gcode.bottom = false;
		}

		for (var i = 0; i < slice.length; i ++) {
			var layerPart = slice[i];

			sliceToGCode(layerPart.outerLayer, false, true);
			sliceToGCode(layerPart.insets, false, false);
			sliceToGCode(layerPart.fill, true, false);
		}

		this.progress.gcodeLayer = layer;
		this.updateProgress();
	}

	return gcode.getGCode();
};
D3D.Slicer.prototype.getGCode = function (printer) {
	"use strict";

	var layerHeight = printer.config["printer.layerHeight"];
	var dimensionsZ = printer.config["printer.dimensions.z"];

	this.progress.totalLayers = Math.floor(Math.min(this.geometry.boundingBox.max.y, dimensionsZ) / layerHeight);
	this.progress.sliceLayer = 0;
	this.progress.dataLayer = 0;
	this.progress.gcodeLayer = 0;

	var start = new Date().getTime();
	var slices = this.slice(layerHeight, dimensionsZ);
	var end = new Date().getTime();
	console.log("Slicing: " + (end - start) + "ms");

	start = new Date().getTime();
	var data = this.slicesToData(slices, printer);
	end = new Date().getTime();
	console.log("Data: " + (end - start) + "ms");

	start = new Date().getTime();
	var gcode = this.dataToGCode(data, printer);
	end = new Date().getTime();
	console.log("Gcode: " + (end - start) + "ms");

	return gcode;
};