/******************************************************
*
* Path
*
* Abstraction layer for annoying clipper js
*
******************************************************/

D3D.Paths = function (paths, closed) {
	"use strict";

	Array.call(this);

	this.setPaths(paths || []);

	this.closed = (closed !== undefined) ? closed : true;
};
D3D.Paths.prototype = Object.create(Array.prototype);
D3D.Paths.prototype.setPaths = function (paths) {
	"use strict";

	for (var i = 0; i < paths.length; i ++) {
		var path = paths[i];
		this.push(path);
	}

	return this;
};
D3D.Paths.prototype.clip = function (path, type) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(type, solution);

	return new D3D.Paths(solution);
};
D3D.Paths.prototype.union = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctUnion);
};
D3D.Paths.prototype.difference = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctDifference);
};
D3D.Paths.prototype.intersect = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctIntersection);
};
D3D.Paths.prototype.xor = function () {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctXor);
};
D3D.Paths.prototype.offset = function (offset) {
	"use strict";

	var solution = new ClipperLib.Paths();
	var co = new ClipperLib.ClipperOffset(1, 1);
	co.AddPaths(this, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, offset);

	return new D3D.Paths(solution);
};
D3D.Paths.prototype.scaleUp = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleUpPaths(this, factor);

	return this;
};
D3D.Paths.prototype.scaleDown = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleDownPaths(this, factor);

	return this;
};
D3D.Paths.prototype.tresholdArea = function (minArea) {
	"use strict";

	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		var area = ClipperLib.Clipper.Area(shape);

		if (area < minArea) {
			this.splice(i, 1);
			i --;
		}
	}
	
	return areas;
};
D3D.Paths.prototype.area = function () {
	"use strict";

	return ClipperLib.Clipper.Area(this);
};
D3D.Paths.prototype.join = function (path) {
	"use strict";

	for (var i = 0; i < path.length; i ++) {
		this.push(path[i]);
	}

	return this;
};
D3D.Paths.prototype.clone = function () {
	"use strict";

	return new D3D.Paths(ClipperLib.JS.Clone(this), this.closed);
};
D3D.Paths.prototype.bounds = function () {
	"use strict";

	return ClipperLib.Clipper.GetBounds(this);
};
D3D.Paths.prototype.reverse = function () {
	"use strict";

	ClipperLib.Clipper.ReversePaths(this);

	return this;
};
D3D.Paths.prototype.draw = function (context, color) {
	"use strict";

	context.strokeStyle = color;
	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		context.beginPath();
		var length = this.closed ? (shape.length + 1) : shape.length;
		for (var j = 0; j < length; j ++) {
			var point = shape[j % shape.length];

			context.lineTo(point.X*2, point.Y*2);
		}
		context.stroke();
	}
};