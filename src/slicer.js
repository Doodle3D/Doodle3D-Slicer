/******************************************************
*
* Slicer
*
* TODO (optimalisatie)
* sorteer lijnen op laagste hoogte -> stop loop wanneer hij een lijn zonder intersectie heeft gevonden
* verwijder lijnen die ooit interactie gehad hebben, maar nu niet meer
*
******************************************************/

D3D.Slicer = function (geometry) {
	"use strict";

	this.geometry = geometry;
	this.geometry.mergeVertices();

	this.lines = [];
	this.lineLookup = {};
};
D3D.Slicer.prototype.addLine = function (a, b) {
	"use stict";

	//think lookup can only be b_a, a_b is only possible when face is flipped
	var index = this.lineLookup[a + "_" + b] || this.lineLookup[b + "_" + a];

	//if (!index) {
	if (index === undefined) {
		index = this.lines.length;
		this.lineLookup[a + "_" + b] = index;

		this.lines.push({
			line: new THREE.Line3(this.geometry.vertices[a], this.geometry.vertices[b]),
			connects: []
		});
	}

	return index;
};
D3D.Slicer.prototype.createLines = function () {
	"use strict";

	this.lines = [];
	this.lineLookup = {};

	for (var i = 0; i < this.geometry.faces.length; i ++) {
		var face = this.geometry.faces[i];

		//check for only adding unique lines
		//returns index of said line
		var a = this.addLine(face.a, face.b);
		var b = this.addLine(face.b, face.c);
		var c = this.addLine(face.c, face.a);

		//set connecting lines (based on face)
		this.lines[a].connects.push(b, c);
		this.lines[b].connects.push(a, c);
		this.lines[c].connects.push(a, b);
	}

	//sort lines on min height
	//this.lines.sort(function (a, b) {
	//	return Math.min() - Math.min();
	//});
};
D3D.Slicer.prototype.slice = function (height, step) {
	"use strict";

	this.createLines();

	var slices = [];

	var	plane = new THREE.Plane();

	for (var z = 0; z < height; z += step) {
		plane.set(new THREE.Vector3(0, -1, 0), z);

		var slice = [];
		slices.push(slice);

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

			if (done.indexOf(i) === -1 && intersections[i]) {
				var index = i;

				var shape = [];

				while (index !== -1) {
					var intersection = intersections[index];
					shape.push(intersection);

					done.push(index);

					var connects = this.lines[index].connects;
					for (var j = 0; j < connects.length; j ++) {
						index = connects[j];

						if (done.indexOf(index) === -1 && intersections[index]) {
							break;
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
	}

	return slices;
};
D3D.Slicer.prototype.getGcode = function (printer) {
	"use strict";

	var normalSpeed = doodleBox.printer["printer.speed"];
	var bottomSpeed = doodleBox.printer["printer.bottomLayerSpeed"];
	var firstLayerSlow = doodleBox.printer["printer.firstLayerSlow"];
	var bottomFlowRate = doodleBox.printer["printer.bottomFlowRate"];
	var travelSpeed = doodleBox.printer["printer.travelSpeed"];
	var filamentThickness = doodleBox.printer["printer.filamentThickness"];
	var wallThickness = doodleBox.printer["printer.wallThickness"];
	var layerHeight = doodleBox.printer["printer.layerHeight"];
	var enableTraveling = doodleBox.printer["printer.enableTraveling"];
	var retractionEnabled = doodleBox.printer["printer.retraction.enabled"];
	var retractionSpeed = doodleBox.printer["printer.retraction.speed"];
	var retractionminDistance = doodleBox.printer["printer.retraction.minDistance"];
	var retractionAmount = doodleBox.printer["printer.retraction.amount"];
	var dimensionsZ = doodleBox.printer["printer.dimensions.z"];

	var gcode = doodleBox.printer.getStartCode();

	var extruder = 0.0;
	var speed = firstLayerSlow ? (bottomSpeed*60).toFixed(3) : (normalSpeed*60).toFixed(3);
	var flowRate = bottomFlowRate;
	var filamentSurfaceArea = Math.pow((filamentThickness/2), 2) * Math.PI;

	var slices = this.slice(dimensionsZ, layerHeight);

	for (var layer = 0; layer < slices.length; layer ++) {
		var slice = slices[layer];

		//turn on fan on layer 2
		if (layer === 2) {
			gcode.push("M106");
			speed = (normalSpeed*60).toFixed(3);
			flowRate = 1;
		}

		var z = ((layer + 1) * layerHeight).toFixed(3);

		for (var i = 0; i < slice.length; i ++) {
			var shape = slice[i];

			var previousPoint;

			for (var j = 0; j <= shape.length; j ++) {
				//Finish shape by going to first point
				var point = shape[(j % shape.length)];

				if (j === 0) {
					//TODO
					//add retraction
					if (extruder > retractionAmount && retractionEnabled) {
						gcode.push([
							"G0", 
							"E" + (extruder - retractionAmount).toFixed(3),
							"F" + (retractionSpeed * 60).toFixed(3)
						].join(" "));
					}

					gcode.push([
						"G0", 
						"X" + point.x.toFixed(3) + " Y" + point.y.toFixed(3) + " Z" + z, 
						"F" + (travelSpeed*60)
					].join(" "));

					if (extruder > retractionAmount && retractionEnabled) {
						gcode.push([
							"G0", 
							"E" + extruder.toFixed(3),
							"F" + (retractionSpeed * 60).toFixed(3)
						].join(" "));
					}
				}
				else {
					var lineLength = new THREE.Vector2().copy(point).sub(previousPoint).length();
					extruder += lineLength * wallThickness * layerHeight / filamentSurfaceArea * flowRate;

					gcode.push([
						"G1", 
						"X" + point.x.toFixed(3) + " Y" + point.y.toFixed(3) + " Z" + z, 
						"F" + speed, 
						"E" + extruder.toFixed(3)
					].join(" "));
				}

				previousPoint = point;
			}
		}
	}

	gcode = gcode.concat(doodleBox.printer.getEndCode());
	return gcode;
};