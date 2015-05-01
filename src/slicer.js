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

	this.geometry;

	this.lines = [];
};
D3D.Slicer.prototype.setGeometry = function (geometry) {
	"use strict";

	this.geometry = geometry;
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
		"use strict";

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
	};

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
		var fillArea = this.getInset((inset || outerLayer), wallThickness);

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

			for (var j = 0; j <= shape.length; j ++) {
				//Finish shape by going to first point
				var point = shape[(j % shape.length)];

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

			context.moveTo((path[0].X- 100) * 6.0 + 200, (path[0].Y- 100) * 6.0 + 200);

			for (var j = 0; j < path.length; j ++) {
				var point = path[j];
				context.lineTo((point.X- 100) * 6.0 + 200, (point.Y- 100) * 6.0 + 200);
			}
			context.closePath();
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