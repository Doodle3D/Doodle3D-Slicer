import THREE from 'three.js';
import Paths from './paths.js';
import Slice from './slice.js';
import GCode from './gcode.js';

export default class {
	constructor () {
		this.progress = {
			createdLines: false, 
			calculatedLayerIntersections: false, 
			sliced: false, 
			generatedSlices: false, 
			generatedInnerLines: false, 
			generatedInfills: false, 
			generatedSupport: false, 
			optimizedPaths: false,  
			generatedGCode: false
		};
	}

	setMesh (mesh) {
		mesh.updateMatrix();

		this.setGeometry(mesh.geometry, mesh.matrix);

		return this;
	}

	setGeometry (geometry, matrix) {
		if (geometry.type === 'BufferGeometry') {
			geometry = new THREE.Geometry().fromBufferGeometry(geometry);
		}
		else if (geometry.type === 'Geometry') {
			geometry = geometry.clone();
		}
		else {
			console.warn('Geometry is not an instance of BufferGeometry or Geometry');
			return;
		}

		if (matrix instanceof THREE.Matrix4) {
			geometry.applyMatrix(matrix);
		}

		geometry.mergeVertices();
		geometry.computeFaceNormals();

		this.geometry = geometry;

		return this;
	}

	slice (settings) {
		var supportEnabled = settings.config['supportEnabled'];

		// get unique lines from geometry;
		var lines = this._createLines(settings);

		var {layerIntersectionIndexes, layerIntersectionPoints} = this._calculateLayersIntersections(lines, settings);

		var shapes = this._intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);

		var slices = this._shapesToSlices(shapes, settings);

		//return;

		this._generateInnerLines(slices, settings);
		
		this._generateInfills(slices, settings);
		
		if (supportEnabled) {
			this._generateSupport(slices, settings);
		}
		
		this._optimizePaths(slices, settings);

		var gcode = this._slicesToGCode(slices, settings);

		if (this.onfinish !== undefined) {
			this.onfinish(gcode);
		}

		return gcode;
	}

	_createLines (settings) {
		console.log('constructing unique lines from geometry');

		var lines = [];
		var lineLookup = {};

		var addLine = (a, b) => {
			var index = lineLookup[b + '_' + a];

			if (index === undefined) {
				index = lines.length;
				lineLookup[a + '_' + b] = index;

				lines.push({
					line: new THREE.Line3(this.geometry.vertices[a], this.geometry.vertices[b]), 
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

				// check for only adding unique lines
				// returns index of said line
				var a = addLine(face.a, face.b);
				var b = addLine(face.b, face.c);
				var c = addLine(face.c, face.a);

				// set connecting lines (based on face)
				lines[a].connects.push(b, c);
				lines[b].connects.push(c, a);
				lines[c].connects.push(a, b);

				lines[a].normals.push(normal);
				lines[b].normals.push(normal);
				lines[c].normals.push(normal);
			}
		}

		this.progress.createdLines = true;
		this._updateProgress(settings);

		return lines;
	}

	_calculateLayersIntersections (lines, settings) {
		console.log('calculating layer intersections');

		var layerHeight = settings.config["layerHeight"];
		var height = settings.config["dimensionsZ"];

		var numLayers = height / layerHeight;

		var layerIntersectionIndexes = [];
		var layerIntersectionPoints = [];
		for (var layer = 0; layer < numLayers; layer ++) {
			layerIntersectionIndexes[layer] = [];
			layerIntersectionPoints[layer] = [];
		}

		for (var lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
			var line = lines[lineIndex].line;

			var min = Math.ceil(Math.min(line.start.y, line.end.y) / layerHeight);
			var max = Math.floor(Math.max(line.start.y, line.end.y) / layerHeight);

			for (var layerIndex = min; layerIndex <= max; layerIndex ++) {
				if (layerIndex >= 0 && layerIndex < numLayers) {

					layerIntersectionIndexes[layerIndex].push(lineIndex);

					var y = layerIndex * layerHeight;

					if (line.start.y === line.end.y) {
						var x = line.start.x;
						var z = line.start.z;
					}
					else {
						var alpha = (y - line.start.y) / (line.end.y - line.start.y);
						var x = line.end.x * alpha + line.start.x * (1 - alpha);
						var z = line.end.z * alpha + line.start.z * (1 - alpha);
					}

					layerIntersectionPoints[layerIndex][lineIndex] = new THREE.Vector2(z, x);
				}
			}
		}

		this.progress.calculatedLayerIntersections = true;
		this._updateProgress(settings);

		return {
			layerIntersectionIndexes, 
			layerIntersectionPoints
		};
	}

	_intersectionsToShapes (layerIntersectionIndexes, layerIntersectionPoints, lines, settings) {
		console.log("generating slices");

		var shapes = [];

		for (var layer = 1; layer < layerIntersectionIndexes.length; layer ++) {
			var intersectionIndexes = layerIntersectionIndexes[layer];
			var intersectionPoints = layerIntersectionPoints[layer];

			if (intersectionIndexes.length === 0) {
				continue;
			}

			var shapeParts = [];
			for (var i = 0; i < intersectionIndexes.length; i ++) {
				var index = intersectionIndexes[i];

				if (intersectionPoints[index] === undefined) {
					continue;
				}

				var firstPoints = [index];
				var isFirstPoint = true;
				var closed = false;

				var shape = [];

				while (index !== -1) {
					var intersection = intersectionPoints[index];
					// uppercase X and Y because clipper vector
					shape.push({X: intersection.x, Y: intersection.y});

					delete intersectionPoints[index];

					var connects = lines[index].connects;
					var faceNormals = lines[index].normals;

					for (var j = 0; j < connects.length; j ++) {
						var index = connects[j];

						if (firstPoints.indexOf(index) !== -1 && shape.length > 2) {
							closed = true;
							index = -1;
							break;
						}

						// Check if index has an intersection or is already used
						if (intersectionPoints[index] !== undefined) {
							var faceNormal = faceNormals[Math.floor(j / 2)];

							var a = new THREE.Vector2(intersection.x, intersection.y);
							var b = new THREE.Vector2(intersectionPoints[index].x, intersectionPoints[index].y);

							// can't calculate normal between points if distance is smaller as 0.0001
							if ((faceNormal.x === 0 && faceNormal.y === 0) || a.distanceTo(b) < 0.0001) {
								if (isFirstPoint) {
									firstPoints.push(index);
								}

								delete intersectionPoints[index];

								connects = connects.concat(lines[index].connects);
								faceNormals = faceNormals.concat(lines[index].normals);
								index = -1;
							}
							else {
								// make sure the path goes the right direction
								// THREE.Vector2.normal is not yet implimented
								// var normal = a.sub(b).normal().normalize();
								var normal = a.sub(b);
								normal.set(-normal.y, normal.x).normalize();

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
					isFirstPoint = false;
				}

				if (!closed) {
					var index = firstPoints[0];

					while (index !== -1) {
						if (firstPoints.indexOf(index) === -1) {
							var intersection = intersectionPoints[index];
							shape.unshift({X: intersection.x, Y: intersection.y});

							delete intersectionPoints[index];
						}

						var connects = lines[index].connects;

						for (var i = 0; i < connects.length; i ++) {
							var index = connects[i];

							if (intersectionPoints[index] !== undefined) {
								break;
							}
							else {
								index = -1;
							}
						}
					}
				}

				var part = new Paths([shape], closed).clean(0.01);
				if (part.length > 0) {
					shapeParts.push(part);
				}
			}

			shapes.push(shapeParts);
		}

		this.progress.sliced = true;
		this._updateProgress(settings);

		return shapes;
	}

	_shapesToSlices (shapes, settings) {
		var slices = [];

		for (var layer = 0; layer < shapes.length; layer ++) {
			var shapeParts = shapes[layer];

			var slice = new Slice();

			var holes = [];
			var outlines = [];

			for (var i = 0; i < shapeParts.length; i ++) {
				var shape = shapeParts[i];

				if (!shape.closed) {
					slice.add(shape);
				}
				else if (shape.isHole()) {
					holes.push(shape);
				}
				else {
					slice.add(shape);
					outlines.push(shape);
				}
			}

			for (var i = 0; i < holes.length; i ++) {
				var hole = holes[i];

				for (var j = 0; j < outlines.length; j ++) {
					var outline = outlines[j];

					if (outline.pointCollision(hole[0][0])) {
						outline.join(hole);
						break;
					}
				}
			}

			slice.removeSelfIntersect();

			slices.push(slice);
		}

		this.progress.generatedSlices = true;
		this._updateProgress(settings);

		return slices;
	}

	_generateInnerLines (slices, settings) {
		console.log("generating outer lines and inner lines");

		// need to scale up everything because of clipper rounding errors
		var scale = 100;

		var layerHeight = settings.config["layerHeight"];
		var nozzleDiameter = settings.config["nozzleDiameter"] * scale;
		var shellThickness = settings.config["shellThickness"] * scale;
		var nozzleRadius = nozzleDiameter / 2;
		var shells = Math.round(shellThickness / nozzleDiameter);

		for (var layer = 0; layer < slices.length; layer ++) {
			var slice = slices[layer];

			for (var i = 0; i < slice.parts.length; i ++) {
				var part = slice.parts[i];

				if (!part.intersect.closed) {
					continue;
				}

				// var outerLine = part.intersect.clone().scaleUp(scale).offset(-nozzleRadius);
				var outerLine = part.intersect.scaleUp(scale).offset(-nozzleRadius);

				if (outerLine.length > 0) {
					part.outerLine = outerLine;

					for (var shell = 1; shell < shells; shell += 1) {
						var offset = shell * nozzleDiameter;

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
		this._updateProgress(settings);
	}

	_generateInfills (slices, settings) {
		console.log("generating infills");

		// need to scale up everything because of clipper rounding errors
		var scale = 100;

		var layerHeight = settings.config["layerHeight"];
		var fillGridSize = settings.config["fillGridSize"] * scale;
		var bottomThickness = settings.config["bottomThickness"];
		var topThickness = settings.config["topThickness"];
		var nozzleDiameter = settings.config["nozzleDiameter"] * scale;
		var infillOverlap = settings.config["infillOverlap"] * scale;
		
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

				if (!part.intersect.closed) {
					continue;
				}

				var outerLine = part.outerLine;

				if (outerLine.length > 0) {
					var inset = (part.innerLines.length > 0) ? part.innerLines[part.innerLines.length - 1] : outerLine;

					var fillArea = inset.offset(-nozzleRadius);
					var lowFillArea = false;
					if (surroundingLayer) {
						var highFillArea = fillArea.difference(surroundingLayer);

						if (infillOverlap > 0) {
							highFillArea = highFillArea.offset(infillOverlap);
						}

						highFillArea = highFillArea.intersect(fillArea);

						var lowFillArea = fillArea.difference(highFillArea);
					}
					else {
						var highFillArea = fillArea;
					}

					var fill = new Paths([], false);

					if (lowFillArea && lowFillArea.length > 0) {
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
		this._updateProgress(settings);
	}

	_generateSupport (slices, settings) {
		console.log("generating support");

		// need to scale up everything because of clipper rounding errors
		var scale = 100;

		var layerHeight = settings.config["layerHeight"];
		var supportGridSize = settings.config["supportGridSize"] * scale;
		var supportAcceptanceMargin = settings.config["supportAcceptanceMargin"] * scale;
		var supportMargin = settings.config["supportMargin"] * scale;
		var plateSize = settings.config["supportPlateSize"] * scale;
		var supportDistanceY = settings.config["supportDistanceY"];
		var supportDistanceLayers = Math.max(Math.ceil(supportDistanceY / layerHeight), 1);
		var nozzleDiameter = settings.config["nozzleDiameter"] * scale;

		var supportAreas = new Paths([], true);

		for (var layer = slices.length - 1 - supportDistanceLayers; layer >= 0; layer --) {
			var currentSlice = slices[layer];

			if (supportAreas.length > 0) {

				if (layer >= supportDistanceLayers) {
					var sliceSkin = slices[layer - supportDistanceLayers].getOutline();
					sliceSkin = sliceSkin;

					var supportAreasSlimmed = supportAreas.difference(sliceSkin.offset(supportMargin));
					if (supportAreasSlimmed.area() < 100.0) {
						supportAreas = supportAreas.difference(sliceSkin);
					}
					else {
						supportAreas = supportAreasSlimmed;
					}
				}

				
				var supportTemplate = this._getFillTemplate(supportAreas.bounds(), supportGridSize, true, true);
				var supportFill = supportTemplate.intersect(supportAreas);
				if (supportFill.length === 0) {
					currentSlice.support = supportAreas.clone();
				}
				else {
					currentSlice.support = supportFill;
				}
			}

			var supportSkin = slices[layer + supportDistanceLayers - 1].getOutline();

			var slice = slices[layer + supportDistanceLayers];
			for (var i = 0; i < slice.parts.length; i ++) {
				var slicePart = slice.parts[i];

				if (slicePart.intersect.closed) {
					var outerLine = slicePart.outerLine;
				}
				else {
					var outerLine = slicePart.intersect.offset(supportAcceptanceMargin);
				}

				var overlap = supportSkin.offset(supportAcceptanceMargin).intersect(outerLine);
				var overhang = outerLine.difference(overlap);

				if (overlap.length === 0 || overhang.length > 0) {
					supportAreas = supportAreas.join(overhang);
				}
			}
		}

		this.progress.generatedSupport = true;
		this._updateProgress(settings);
	}

	_optimizePaths (slices, settings) {
		console.log("opimize paths");

		// need to scale up everything because of clipper rounding errors
		var scale = 100;

		var brimOffset = settings.config["brimOffset"] * scale;

		var start = new THREE.Vector2(0, 0);

		for (var layer = 0; layer < slices.length; layer ++) {
			var slice = slices[layer];

			if (layer === 0) {
				slice.brim = slice.getOutline().offset(brimOffset);
			}

			start = slice.optimizePaths(start);

			for (var i = 0; i < slice.parts.length; i ++) {
				var part = slice.parts[i];

				if (part.intersect.closed) {
					part.outerLine.scaleDown(scale);
					for (var j = 0; j < part.innerLines.length; j ++) {
						var innerLine = part.innerLines[j];
						innerLine.scaleDown(scale);
					}
					part.fill.scaleDown(scale);
				}
			}

			if (slice.support !== undefined) {
				slice.support.scaleDown(scale);
			}
			if (slice.brim !== undefined) {
				slice.brim.scaleDown(scale);
			}
		}

		this.progress.optimizedPaths = true;
		this._updateProgress(settings);
	}

	_getFillTemplate (bounds, size, even, uneven) {
		var paths = new Paths([], false);

		var left = Math.floor(bounds.left / size) * size;
		var right = Math.ceil(bounds.right / size) * size;
		var top = Math.floor(bounds.top / size) * size;
		var bottom = Math.ceil(bounds.bottom / size) * size;

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
	}

	_slicesToGCode (slices, settings) {
		var gcode = new GCode().setSettings(settings);

		function pathToGCode (path, retract, unRetract, type) {

			for (var i = 0; i < path.length; i ++) {
				var shape = path[i];

				var length = path.closed ? (shape.length + 1) : shape.length;

				for (var j = 0; j < length; j ++) {
					var point = shape[j % shape.length];

					if (j === 0) {
						// TODO
						// moveTo should impliment combing
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

				if (part.intersect.closed) {
					pathToGCode(part.outerLine, false, true, "outerLine");

					for (var j = 0; j < part.innerLines.length; j ++) {
						var innerLine = part.innerLines[j];
						pathToGCode(innerLine, false, false, "innerLine");
					}

					pathToGCode(part.fill, true, false, "fill");
				}
				else {
					var retract = !(slice.parts.length === 1 && slice.support === undefined);
					pathToGCode(part.intersect, retract, retract, "outerLine");
				}
			}

			if (slice.support !== undefined) {
				pathToGCode(slice.support, true, true, "support");
			}
		}

		this.progress.generatedGCode = true;
		this._updateProgress(settings);

		return gcode.getGCode();
	}

	_updateProgress (settings) {
		if (this.onprogress !== undefined) {
			var supportEnabled = settings.config["supportEnabled"];

			var progress = {};

			var procent = 0;
			var length = 0;
			for (var i in this.progress) {
				if (!(!supportEnabled && i === "generatedSupport")) {
					progress[i] = this.progress[i];
					if (progress[i]) {
						procent += 1;
					}
					length += 1;
				}
			}

			progress.procent = procent / length;

			this.onprogress(progress);
		}
	}
}
