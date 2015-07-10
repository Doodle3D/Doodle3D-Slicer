/******************************************************
*
* Slice
*
******************************************************/

D3D.Slice = function () {
	'use strict';

	this.parts = [];
};
D3D.Slice.prototype.optimizePaths = function (start) {
	'use strict';

	if (this.brim !== undefined && this.brim.length > 0) {
		this.brim = this.brim.optimizePath(start);
		start = this.brim.lastPoint();
	}

	var parts = [];

	while (this.parts.length > 0) {

		var closestDistance = Infinity;
		var closestPart;

		for (var i = 0; i < this.parts.length; i ++) {
			var part = this.parts[i];
			if (part.addFill) {
				var bounds = part.outerLine.bounds();
			}
			else {
				var bounds = part.intersect.bounds();
			}

			var top = bounds.top - start.y;
			var bottom = start.y - bounds.bottom;
			var left = bounds.left - start.x;
			var right = start.x - bounds.right;

			var distance = Math.max(top, bottom, left, right);

			if (distance < closestDistance) {
				closestDistance = distance;
				closestPart = i;
			}
		}

		var part = this.parts.splice(closestPart, 1)[0];
		parts.push(part);

		if (part.addFill) {
			if (part.outerLine.length > 0) {
				part.outerLine = part.outerLine.optimizePath(start);
				start = part.outerLine.lastPoint();
			}

			for (var j = 0; j < part.innerLines.length; j ++) {
				var innerLine = part.innerLines[j];
				if (innerLine.length > 0) {
					part.innerLines[j] = innerLine.optimizePath(start);
					start = part.innerLines[j].lastPoint();
				}
			}

			if (part.fill.length > 0) {
				part.fill = part.fill.optimizePath(start);
				start = part.fill.lastPoint();
			}
		}
		else {
			part.intersect.optimizePath(start);
			start = part.intersect.lastPoint();
		}

	}

	this.parts = parts;

	if (this.support !== undefined && this.support.length > 0) {
		this.support = this.support.optimizePath(start);
		start = this.support.lastPoint();
	}

	return start;
};
D3D.Slice.prototype.getOutline = function () {
	'use strict';

	var outLines = new D3D.Paths([], true);

	for (var i = 0; i < this.parts.length; i ++) {
		var part = this.parts[i];

		if (part.addFill) {
			outLines.join(this.parts[i].outerLine);
		}
	}

	return outLines;
};
D3D.Slice.prototype.add = function (intersect) {
	'use strict';

	if (intersect.closed) {
		this.parts.push({
			intersect: intersect, 
			innerLines: [],
			outerLine: new D3D.Paths([], true), 
			fill: new D3D.Paths([], false), 
			addFill: true
		});
	}
	else {
		this.parts.push({
			intersect: intersect, 
			addFill: false
		});
	}
};