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

		if (!(face.normal.y === 1 || face.normal.y === -1)) {
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
		}
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

	for (var layer = 1; layer < layersIntersections.length; layer ++) {
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
				var shape = new D3D.Path([], true);

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

	var lowFillTemplate = this.getFillTemplate(dimensionsZ, fillSize, true, true);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		var insets = new D3D.Paths();
		var fills = new D3D.Paths();
		var outerLayers = new D3D.Paths();

		var downFill = (layer - skinCount >= 0) ? slices[layer - skinCount] : new D3D.Paths();
		var upFill = (layer + skinCount < slices.length) ? slices[layer + skinCount] : new D3D.Paths();
		//var surroundingLayer = downFill.intersect(upFill);
		var surroundingLayer = upFill.clone().scaleUp(scale);
		//D3D.Paths surroundingLayer

		for (var i = 0; i < slice.length; i ++) {
			var part = slice[i];

			var outerLayer = part.clone();
			outerLayer.scaleUp(scale);

			for (var offset = wallThickness; offset <= shellThickness; offset += wallThickness) {
				var inset = outerLayer.offset(-offset);

				insets.push(inset);
			}

			var fillArea = (inset || outerLayer).offset(-wallThickness/2);

			var highFillArea = fillArea.difference(surroundingLayer);

			var lowFillArea = fillArea.difference(highFillArea);

			var fill = new D3D.Paths([]);

			fills.join(lowFillTemplate.intersect(lowFillArea));

			var highFillTemplate = this.getFillTemplate(dimensionsZ, wallThickness, (layer % 2 === 0), (layer % 2 === 1));
			fills.join(highFillTemplate.intersect(highFillArea));

			console.log(highFillTemplate.intersect(highFillArea));

			outerLayers.push(outerLayer);
		}

		data.push({
			outerLayer: outerLayers.scaleDown(scale), 
			insets: insets.scaleDown(scale), 
			fill: fills.scaleDown(scale)
		});
	}

	return data;
};
D3D.Slicer.prototype.getFillTemplate = function (dimension, size, even, uneven) {
	"use strict";

	var paths = [];

	if (even) {
		for (var length = 0; length <= dimension; length += size) {
			paths.push(new D3D.Path([{X: length, Y: 0}, {X: length, Y: dimension}], false));
		}
	}
	if (uneven) {
		for (var length = 0; length <= dimension; length += size) {
			paths.push(new D3D.Path([{X: 0, Y: length}, {X: dimension, Y: length}], false));
		}
	}
	
	//return paths;
	return new D3D.Paths(paths);
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
		gcode = gcode.concat(sliceToGcode(slice.insets));
		gcode = gcode.concat(sliceToGcode(slice.fill));
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

		slice.insets.draw(context, "blue");
		slice.outerLayer.draw(context, "green");
		slice.fill.draw(context, "red");
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

	console.log(data);
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