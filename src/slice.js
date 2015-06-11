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

	//instead of for loop pick the closest shape to start;
	for (var i = 0; i < this.parts.length; i ++) {
		var part = this.parts[i];

		if (part.outerLine.length > 0) {
			part.outerLine = part.outerLine.optimizePath(start);
			start = part.outerLine.lastPoint();
		}

		for (var j = 0; j < part.innerLines.length; j ++) {
			var innerLine = part.innerLines[j];
			if (innerLine.length > 0) {
				part.innerLines[j] = innerLine.optimizePath(start);
				//start = part.innerLines[j].lastPoint();
			}
		}

		if (part.fill.length > 0) {
			part.fill = part.fill.optimizePath(start);
			start = part.fill.lastPoint();
		}
	}

	if (this.support !== undefined && this.support.length > 0) {
		this.support = this.support.optimizePath(start);
		//start = this.support.lastPoint();
	}

	return start;
};
D3D.Slice.prototype.getOutline = function () {
	'use strict';

	var outLines = new D3D.Paths([], true);

	for (var i = 0; i < this.parts.length; i ++) {
		outLines.join(this.parts[i].outerLine);
	}

	return outLines;
};
D3D.Slice.prototype.addIntersect = function (intersect) {
	'use strict';

	this.parts.push({
		intersect: intersect, 
		innerLines: [],
		outerLine: new D3D.Paths([], true), 
		fill: new D3D.Paths([], false)
	});
};