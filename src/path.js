/******************************************************
*
* Path
*
* Abstraction layer for annoying clipper js
*
******************************************************/

D3D.Path = function (path, closed) {
	"use strict";

	this.path = path || [];
	this.closed = (closed !== undefined) ? closed : true;
};
D3D.Path.prototype.setPath = function (path) {
	"use strict";

	this.path = path;

	return this;
};
D3D.Path.prototype.union = function (path) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this.path, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path.path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(ClipperLib.ClipType.ctUnion, solution);

	return new D3D.Path(solution, this.closed);
};
D3D.Path.prototype.difference = function (path) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this.path, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path.path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(ClipperLib.ClipType.ctDifference, solution);

	return new D3D.Path(solution, this.closed);
};
D3D.Path.prototype.intersect = function (path) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this.path, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path.path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(ClipperLib.ClipType.ctIntersection, solution);

	return new D3D.Path(solution, this.closed);
};
D3D.Path.prototype.xor = function () {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this.path, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path.path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(ClipperLib.ClipType.ctXor, solution);

	return new D3D.Path(solution, this.closed);
};
D3D.Path.prototype.offset = function (offset) {
	"use strict";

	var solution = new ClipperLib.Paths();
	var co = new ClipperLib.ClipperOffset(1, 1);
	co.AddPaths(this.path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, offset);

	return new D3D.Path(solution, this.closed);
};
D3D.Path.prototype.scaleUp = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleUpPaths(this.path, factor);

	return this;
};
D3D.Path.prototype.scaleDown = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleDownPaths(this.path, factor);

	return this;
};
D3D.Path.prototype.tresholdArea = function (minArea) {
	"use strict";

	for (var i = 0; i < this.path.length; i ++) {
		var shape = this.path[i];

		var area = ClipperLib.Clipper.Area(shape);

		if (area < minArea) {
			this.path.splice(i, 1);
			i --;
		}
	}
	
	return areas;
};
D3D.Path.prototype.area = function () {
	"use strict";

	var areas = [];

	for (var i = 0; i < this.path.length; i ++) {
		var shape = this.path[i];

		areas.push(ClipperLib.Clipper.Area(shape))
	}
	
	return areas;
};
D3D.Path.prototype.join = function (path) {
	"use strict";

	this.path = this.path.concat(path.path);

	return this;
}
D3D.Path.prototype.clone = function () {
	"use strict";

	var path = ClipperLib.JS.Clone(this.path);

	return new D3D.Path(path, this.closed);
}
D3D.Path.prototype.draw = function (context, color) {
	"use strict";

	context.strokeStyle = color;
	for (var i = 0; i < this.path.length; i ++) {
		var shape = this.path[i];

		context.beginPath();
		var length = this.closed ? (shape.length + 1) : shape.length;
		for (var j = 0; j < length; j ++) {
			var point = shape[j % shape.length];

			context.lineTo(point.X*2, point.Y*2);
		}
		context.stroke();
	}
};