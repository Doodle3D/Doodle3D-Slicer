/******************************************************
*
* Slicer
*
******************************************************/

D3D.Slicer = function () {
	"use strict";

	this.progress = {
		createdLines: false, 
		sliced: false, 
		generatedInnerLines: false, 
		generatedInfills: false, 
		generatedSupport: false, 
		optimizedPaths: false,  
		generatedGCode: false
	};
};
D3D.Slicer.prototype.setMesh = function (mesh) {
	"use strict";

	this.setGeometry(mesh.geometry, mesh.matrix);

	return this;
};
D3D.Slicer.prototype.setGeometry = function (geometry, matrix) {
	"use strict";

	//convert buffergeometry to geometry;
	if (geometry instanceof THREE.BufferGeometry) {
		geometry = new THREE.Geometry().fromBufferGeometry(geometry);
	}
	else if (geometry instanceof THREE.Geometry) {
		geometry = geometry.clone();
	}
	else {
		console.warn("Geometry is not an instance of BufferGeometry or Geometry");
		return;
	}

	if (matrix instanceof THREE.Matrix4) {
		geometry.applyMatrix(matrix);
	}

	geometry.computeBoundingBox();
	geometry.computeFaceNormals();
	geometry.mergeVertices();

	this.geometry = geometry;

	return this;
};
D3D.Slicer.prototype.getGCode = function (printer) {
	"use strict";
	var useSupport = printer.config["supportUse"];

	//get unique lines from geometry;
	var lines = this._createLines(printer);

	var slices = this._slice(lines, printer);

	this._generateInnerLines(slices, printer);
	
	this._generateInfills(slices, printer);

	if (useSupport) {
		this._generateSupport(slices, printer);
	}
	
	this._optimizePaths(slices, printer);

	var gcode = this._slicesToGCode(slices, printer);

	return gcode;
};
D3D.Slicer.prototype._createLines = function (printer) {
	"use strict";

	var lines = [];
	var lineLookup = {};

	var self = this;
	function addLine (a, b) {
		var index = lineLookup[b + "_" + a];

		if (index === undefined) {
			index = lines.length;
			lineLookup[a + "_" + b] = index;

			lines.push({
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
			var normal = new THREE.Vector2(face.normal.z, face.normal.x).normalize();

			//check for only adding unique lines
			//returns index of said line
			var a = addLine(face.a, face.b);
			var b = addLine(face.b, face.c);
			var c = addLine(face.c, face.a);

			//set connecting lines (based on face)
			lines[a].connects.push(b, c);
			lines[b].connects.push(c, a);
			lines[c].connects.push(a, b);

			lines[a].normals.push(normal);
			lines[b].normals.push(normal);
			lines[c].normals.push(normal);
		}
	}

	this.progress.createdLines = true;
	this._updateProgress(printer);

	return lines;
};
D3D.Slicer.prototype._slice = function (lines, printer) {
	"use strict";

	var layerHeight = printer.config["layerHeight"];
	var height = printer.config["dimensionsZ"];

	//var testData = [];

	var numLayers = height / layerHeight;

	var layersIntersections = [];
	for (var layer = 0; layer < numLayers; layer ++) {
		layersIntersections[layer] = [];
	}
	
	for (var lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
		var line = lines[lineIndex].line;

		var min = Math.ceil(Math.min(line.start.y, line.end.y) / layerHeight);
		var max = Math.floor(Math.max(line.start.y, line.end.y) / layerHeight);

		for (var layerIndex = min; layerIndex <= max; layerIndex ++) {
			if (layerIndex >= 0 && layerIndex < numLayers) {
				layersIntersections[layerIndex].push(lineIndex);
			}
		}
	}

	var slices = [];
	//var testPoints = [];

	for (var layer = 1; layer < layersIntersections.length; layer ++) {
		var layerIntersections = layersIntersections[layer];

		if (layerIntersections.length > 0) {

			var y = layer * layerHeight;

			var intersections = [];
			for (var i = 0; i < layerIntersections.length; i ++) {
				var index = layerIntersections[i];
				var line = lines[index].line;

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

				/*testPoints.push({
					x: z, 
					y: x, 
					connects: lines[index].connects, 
					index: index, 
					normals: lines[index].normals
				});*/
			}

			var done = [];
			var sliceParts = [];
			for (var i = 0; i < layerIntersections.length; i ++) {
				var index = layerIntersections[i];

				if (done.indexOf(index) === -1) {
					var shape = [];

					while (index !== -1) {
						done.push(index);

						var intersection = intersections[index];
						//uppercase X and Y because clipper vector
						shape.push({X: intersection.x, Y: intersection.y});

						var connects = lines[index].connects.clone();
						var faceNormals = lines[index].normals.clone();
						for (var j = 0; j < connects.length; j ++) {
							index = connects[j];

							if (intersections[index] !== undefined && done.indexOf(index) === -1) {

								var a = new THREE.Vector2(intersection.x, intersection.y);
								var b = new THREE.Vector2(intersections[index].x, intersections[index].y);

								var faceNormal = faceNormals[Math.floor(j/2)];

								if (a.distanceTo(b) === 0 || faceNormal.length() === 0) {
									done.push(index);

									connects = connects.concat(lines[index].connects);
									faceNormals = faceNormals.concat(lines[index].normals);
									index = -1;
								}
								else {
									var normal = a.sub(b).normal().normalize();

									if (normal.dot(faceNormal) > 0) {
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

					var part = new D3D.Paths([shape]).clean(0.01);
					if (part.length > 0) {
						sliceParts.push(part);
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

			/*if (layer === 218) {
				testData.push({
					testPoints: testPoints, 
					pathData: slice.parts
				});
			}*/
		}
	}

	//console.log(JSON.stringify(testData));

	this.progress.sliced = true;
	this._updateProgress(printer);

	return slices;
};
D3D.Slicer.prototype._generateInnerLines = function (slices, printer) {
	"use strict";

	console.log("generating outer lines and inner lines");

	//need to scale up everything because of clipper rounding errors
	var scale = 100;

	var layerHeight = printer.config["layerHeight"];
	var nozzleDiameter = printer.config["nozzleDiameter"] * scale;
	var shellThickness = printer.config["shellThickness"] * scale;
	var nozzleRadius = nozzleDiameter / 2;

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

	this.progress.generatedInnerLines = true;
	this._updateProgress(printer);
};
D3D.Slicer.prototype._generateInfills = function (slices, printer) {
	"use strict";

	console.log("generating infills");

	//need to scale up everything because of clipper rounding errors
	var scale = 100;

	var layerHeight = printer.config["layerHeight"];
	var fillGridSize = printer.config["fillGridSize"] * scale;
	var bottomThickness = printer.config["bottomThickness"];
	var topThickness = printer.config["topThickness"];
	var nozzleDiameter = printer.config["nozzleDiameter"] * scale;
	var infillOverlap = printer.config["infillOverlap"] * scale;
	
	var bottomSkinCount = Math.ceil(bottomThickness/layerHeight);
	var topSkinCount = Math.ceil(topThickness/layerHeight);
	var nozzleRadius = nozzleDiameter / 2;
	var hightemplateSize = Math.sqrt(2 * Math.pow(nozzleDiameter, 2));

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		if (layer - bottomSkinCount >= 0 && layer + topSkinCount < slices.length) {
			var downSkin =  slices[layer - bottomSkinCount].getOutline();
			var upSkin = slices[layer + topSkinCount].getOutline();
			var surroundingLayer = upSkin.intersect(downSkin);
		}
		else {
			var surroundingLayer = false;
		}		

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];
			var outerLine = part.outerLine;

			if (outerLine.length > 0) {
				var inset = ((part.innerLines.length > 0) ? part.innerLines[part.innerLines.length - 1] : outerLine);

				var fillArea = inset.offset(-nozzleRadius);
				if (surroundingLayer) {
					if (infillOverlap === 0) {
						var highFillArea = fillArea.difference(surroundingLayer).intersect(fillArea);
					}
					else {
						var highFillArea = fillArea.difference(surroundingLayer).offset(infillOverlap).intersect(fillArea);
					}
				}
				else {
					var highFillArea = fillArea;
				}
				var lowFillArea = fillArea.difference(highFillArea);

				var fill = new D3D.Paths([], false);

				if (lowFillArea.length > 0) {
					var bounds = lowFillArea.bounds();
					var lowFillTemplate = this._getFillTemplate(bounds, fillGridSize, true, true);

					part.fill.join(lowFillTemplate.intersect(lowFillArea));
				}

				if (highFillArea.length > 0) {
					var bounds = highFillArea.bounds();
					var even = (layer % 2 === 0);
					var highFillTemplate = this._getFillTemplate(bounds, hightemplateSize, even, !even);

					part.fill.join(highFillTemplate.intersect(highFillArea));
				}
			}
		}
	}

	this.progress.generatedInfills = true;
	this._updateProgress(printer);
};
D3D.Slicer.prototype._generateSupport = function (slices, printer) {
	"use strict";

	console.log("generating support");

	//need to scale up everything because of clipper rounding errors
	var scale = 100;

	var layerHeight = printer.config["layerHeight"];
	var supportGridSize = printer.config["supportGridSize"] * scale;
	var supportAcceptanceMargin = printer.config["supportAcceptanceMargin"] * scale;
	var supportMargin = printer.config["supportMargin"] * scale;
	var plateSize = printer.config["supportPlateSize"] * scale;
	var supportDistanceY = printer.config["supportDistanceY"];
	var supportDistanceLayers = Math.ceil(supportDistanceY / layerHeight);
	var nozzleDiameter = printer.config["nozzleDiameter"] * scale;

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

				var template = this._getFillTemplate(supportAreas.bounds(), nozzleDiameter, true, false);

				currentSlice.support = template.intersect(supportAreas);
			}
			else {
				var supportTemplate = this._getFillTemplate(supportAreas.bounds(), supportGridSize, true, true);

				currentSlice.support = supportTemplate.intersect(supportAreas).join(supportAreas.clone());
			}
		}

		var supportSkin = slices[layer + supportDistanceLayers - 1].getOutline();

		var slice = slices[layer + supportDistanceLayers];
		for (var i = 0; i < slice.parts.length; i ++) {
			var slicePart = slice.parts[i];
			var outerLine = slicePart.outerLine;

			var overlap = supportSkin.offset(supportAcceptanceMargin).intersect(outerLine);
			var overhang = outerLine.difference(overlap);

			if (overlap.length === 0 || overhang.length > 0) {
				supportAreas = supportAreas.union(overhang.offset(supportAcceptanceMargin).intersect(outerLine));
			}
		}
	}

	this.progress.generatedSupport = true;
	this._updateProgress(printer);

};
D3D.Slicer.prototype._optimizePaths = function (slices, printer) {
	"use strict";

	console.log("opimize paths");

	//need to scale up everything because of clipper rounding errors
	var scale = 100;

	var brimOffset = printer.config["brimOffset"] * scale;

	var start = new THREE.Vector2(0, 0);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		if (layer === 0) {
			slice.brim = slice.getOutline().offset(brimOffset);
		}

		start = slice.optimizePaths(start);

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

	this.progress.optimizedPaths = true;
	this._updateProgress(printer);

}
D3D.Slicer.prototype._getFillTemplate = function (bounds, size, even, uneven) {
	"use strict";

	var paths = new D3D.Paths([], false);

	var left = Math.floor(bounds.left / size) * size;
	var right = Math.ceil(bounds.right / size) * size;
	var top = Math.floor(bounds.top / size) * size;
	var bottom = Math.floor(bounds.bottom / size) * size;

	var width = right - left;

	if (even) {
		for (var y = top; y <= bottom + width; y += size) {
			paths.push([
				{X: left, Y: y}, 
				{X: right, Y: y - width}
			]);
		}
	}
	if (uneven) {
		for (var y = top - width; y <= bottom; y += size) {
			paths.push([
				{X: left, Y: y}, 
				{X: right, Y: y + width}
			]);
		}
	}
	
	return paths;
};
D3D.Slicer.prototype._slicesToGCode = function (slices, printer) {
	"use strict";

	var gcode = new D3D.GCode().setSettings(printer);

	function pathToGCode (path, retract, unRetract, type) {

		for (var i = 0; i < path.length; i ++) {
			var shape = path[i];

			var length = path.closed ? (shape.length + 1) : shape.length;

			for (var j = 0; j < length; j ++) {
				var point = shape[j % shape.length];

				if (j === 0) {
					//TODO
					//moveTo should impliment combing
					gcode.moveTo(point.X, point.Y, layer);

					if (unRetract) {
						gcode.unRetract();
					}
				}
				else {
					gcode.lineTo(point.X, point.Y, layer, type);
				}
			}
		}
		
		if (retract) {
			gcode.retract();
		}
	}

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		if (layer === 1) {
			gcode.turnFanOn();
			gcode.bottom = false;
		}

		if (slice.brim !== undefined) {
			pathToGCode(slice.brim, true, true, "brim");
		}

		for (var i = 0; i < slice.parts.length; i ++) {
			var part = slice.parts[i];

			pathToGCode(part.outerLine, false, true, "outerLine");

			for (var j = 0; j < part.innerLines.length; j ++) {
				var innerLine = part.innerLines[j];
				pathToGCode(innerLine, false, false, "innerLine");
			}

			pathToGCode(part.fill, true, false, "fill");
		}

		if (slice.support !== undefined) {
			pathToGCode(slice.support, true, true, "support");
		}
	}

	this.progress.generatedGCode = true;
	this._updateProgress();


	return gcode.getGCode();
};
D3D.Slicer.prototype._updateProgress = function () {
	'use strict';

	if (this.onProgress !== undefined) {
		var useSupport = printer.config["supportUse"];

		var progress = {};

		var procent = 0;
		var length = 0;
		for (var i in this.progress) {
			if (!(!useSupport && i === "generatedSupport")) {
				progress[i] = this.progress[i];
				if (this.progress[i]) {
					procent ++;
				}
				length ++;
			}
		}

		progress.procent = procent / length;

		this.onProgress(progress);
	}
};