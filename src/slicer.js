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

	/*
	geometry.computeFaceNormals();
	for (var i = 0; i < geometry.faces.length; i ++) {
		var face = geometry.faces[i];
		var normal = face.normal;

		if (normal.x === 0 && normal.y === 0 && normal.z === 0) {
			geometry.faces.splice(i, 1);
			console.log("Tets");
			i --;
		}
	}
	*/

	//apply mesh matrix on geometry;
	geometry.applyMatrix(matrix);
	geometry.mergeVertices();
	geometry.computeFaceNormals();
	geometry.computeBoundingBox();

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

		var done = [];
		var sliceParts = [];
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

							var faceNormal = faceNormals[Math.floor(j/2)];

							console.log();

							if (a.distanceTo(b) === 0 || faceNormal.equals(new THREE.Vector2(0, 0))) {
								connects = connects.concat(this.lines[index].connects);
								faceNormals = faceNormals.concat(this.lines[index].normals);
								index = -1;
							}
							else {
								var normal = a.sub(b).normal().normalize();

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
					sliceParts.push(new D3D.Paths([shape], true));
				}
			}
		}

		var slice = new D3D.Slice();

		for (var i = 0; i < sliceParts.length; i ++) {
			var slicePart1 = sliceParts[i];
			var merge = false;

			for (var j = 0; j < slice.parts.length; j ++) {
				var slicePart2 = slice.parts[j].intersect;

				if (slicePart2.intersect(slicePart1).length > 0) {
					slicePart2.join(slicePart1);
					merge = true;
					break;
				}
			}
			if (!merge) {
				slice.addIntersect(slicePart1);
			}
		}

		slices.push(slice);

		this.progress.sliceLayer = layer;
		this.updateProgress();
	}
	return slices;
};
D3D.Slicer.prototype.slicesToData = function (slices, printer) {
	"use strict";

	var scale = 100;

	var layerHeight = printer.config["printer.layerHeight"];
	var nozzleDiameter = printer.config["printer.nozzleDiameter"] * scale;
	var shellThickness = printer.config["printer.shellThickness"] * scale;
	var fillSize = printer.config["printer.fillSize"] * scale;
	var brimOffset = printer.config["printer.brimOffset"] * scale;
	var bottomThickness = printer.config["printer.bottomThickness"];
	var topThickness = printer.config["printer.topThickness"];
	var useSupport = printer.config["printer.support.use"];
	var supportGritSize = printer.config["printer.support.gritSize"] * scale;
	var supportAccaptanceMargin = printer.config["printer.support.accaptanceMargin"] * scale;
	var supportMargin = printer.config["printer.support.margin"] * scale;
	var plateSize = printer.config["printer.support.plateSize"] * scale;
	var supportDistanceY = printer.config["printer.support.distanceY"];
	var brimOffset = printer.config["printer.brimOffset"] * scale;

	var supportDistanceLayers = Math.ceil(supportDistanceY / layerHeight);
	var bottomSkinCount = Math.ceil(bottomThickness/layerHeight);
	var topSkinCount = Math.ceil(topThickness/layerHeight);
	var nozzleRadius = nozzleDiameter / 2;

	var lowFillTemplate = this.getFillTemplate({
		left: this.geometry.boundingBox.min.z * scale, 
		top: this.geometry.boundingBox.min.x * scale, 
		right: this.geometry.boundingBox.max.z * scale, 
		bottom: this.geometry.boundingBox.max.x * scale
	}, fillSize, true, true);

	console.log("generating outer lines and inner lines");
	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];

			var outerLine = part.intersect.clone().scaleUp(scale).offset(-nozzleRadius);

			if (outerLine.length > 0) {
				part.outerLine = outerLine;

				for (var offset = nozzleDiameter; offset <= shellThickness; offset += nozzleDiameter) {
					var innerLine = outerLine.offset(-offset);

					if (innerLine.length > 0) {
						part.innerLines.push(innerLine);
					}
					else {
						break;
					}
				}
			}
		}
	}

	console.log("generating infills");
	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];
		
		var downSkin = (layer - bottomSkinCount >= 0) ? slices[layer - bottomSkinCount].getOutline() : new D3D.Paths([], true);
		var upSkin = (layer + topSkinCount < slices.length) ? slices[layer + topSkinCount].getOutline() : new D3D.Paths([], true);
		var surroundingLayer = (downSkin.length === 0 || upSkin.length === 0) ? new D3D.Paths([], true) : upSkin.intersect(downSkin);

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];
			var outerLine = part.outerLine;

			if (outerLine.length > 0) {
				var inset = ((part.innerLines.length > 0) ? part.innerLines[part.innerLines.length - 1] : outerLine);

				var fillArea = inset.offset(-nozzleRadius);
				var highFillArea = fillArea.difference(surroundingLayer);
				var lowFillArea = fillArea.difference(highFillArea);

				var fill = new D3D.Paths([], false);

				if (lowFillTemplate.length > 0) {
					part.fill.join(lowFillTemplate.intersect(lowFillArea));
				}

				if (highFillArea.length > 0) {
					var bounds = highFillArea.bounds();
					var even = (layer % 2 === 0);
					var highFillTemplate = this.getFillTemplate(bounds, nozzleDiameter, even, !even);
					part.fill.join(highFillTemplate.intersect(highFillArea));
				}
			}
		}

		this.progress.dataLayer = layer;
		this.updateProgress();
	}

	if (useSupport) {
		console.log("generating support");

		var supportTemplate = this.getFillTemplate({
			left: this.geometry.boundingBox.min.z * scale, 
			top: this.geometry.boundingBox.min.x * scale, 
			right: this.geometry.boundingBox.max.z * scale, 
			bottom: this.geometry.boundingBox.max.x * scale
		}, supportGritSize, true, true);

		var supportAreas = new D3D.Paths([], true);

		for (var layer = slices.length - 1 - supportDistanceLayers; layer >= 0; layer --) {
			if (supportAreas.length > 0) {

				if (layer >= supportDistanceLayers) {
					var sliceSkin = slices[layer - supportDistanceLayers].getOutline();
					sliceSkin = sliceSkin.offset(supportMargin);

					supportAreas = supportAreas.difference(sliceSkin);
				}

				var currentSlice = slices[layer];

				if (layer === 0) {
					supportAreas = supportAreas.offset(plateSize).difference(sliceSkin);

					var template = this.getFillTemplate(supportAreas.bounds(), nozzleDiameter, true, false);

					currentSlice.support = template.intersect(supportAreas);
				}
				else {
					currentSlice.support = supportTemplate.intersect(supportAreas).join(supportAreas.clone());
				}
			}

			var supportSkin = slices[layer + supportDistanceLayers - 1].getOutline();

			var slice = slices[layer + supportDistanceLayers];
			for (var i = 0; i < slice.parts.length; i ++) {
				var slicePart = slice.parts[i];
				var outerLine = slicePart.outerLine;

				var overlap = supportSkin.offset(supportAccaptanceMargin).intersect(outerLine);
				var overhang = outerLine.difference(overlap);

				if (overlap.length === 0 || overhang.length > 0) {
					//var supportArea = outerLine.difference(supportSkin.intersect(outerLine));
					//supportAreas = supportAreas.union(supportArea);

					//supportAreas = supportAreas.union(overhang);

					supportAreas = supportAreas.union(overhang.offset(supportAccaptanceMargin).intersect(outerLine));
				}
			}
		}
	}

	console.log("opimize paths");
	var start = new THREE.Vector2(0, 0);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		if (layer === 0) {
			slice.brim = slice.getOutline().offset(brimOffset);
		}

		var start = slice.optimizePaths(start);

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];

			part.outerLine.scaleDown(scale);
			for (var j = 0; j < part.innerLines.length; j ++) {
				var innerLine = part.innerLines[j];
				innerLine.scaleDown(scale);
			}
			part.fill.scaleDown(scale);
		}

		if (slice.support !== undefined) {
			slice.support.scaleDown(scale);
		}
		if (slice.brim !== undefined) {
			slice.brim.scaleDown(scale);
		}
	}
	
	return slices;
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

		if (slice.brim !== undefined) {
			sliceToGCode(slice.brim, true, true);
		}

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];

			sliceToGCode(part.outerLine, false, true);
			for (var j = 0; j < part.innerLines.length; j ++) {
				var innerLine = part.innerLines[j];
				sliceToGCode(innerLine, false, false);
			}
			sliceToGCode(part.fill, true, false);
		}

		if (slice.support !== undefined) {
			sliceToGCode(slice.support, true, true);
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
	this.slicesToData(slices, printer);
	end = new Date().getTime();
	console.log("Data: " + (end - start) + "ms");

	start = new Date().getTime();
	var gcode = this.dataToGCode(slices, printer);
	end = new Date().getTime();
	console.log("Gcode: " + (end - start) + "ms");

	return gcode;
};