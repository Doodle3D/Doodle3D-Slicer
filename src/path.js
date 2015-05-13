/******************************************************
*
* Path
*
* Abstraction layer for annoying clipper js
*
******************************************************/

D3D.Path = function (path, closed) {
	"use strict";

	Array.call(this);

	this.setPath(path || []);

	this.closed = (closed !== undefined) ? closed : true;
};
D3D.Path.prototype = Object.create(Array.prototype);
D3D.Path.prototype.setPath = function (path) {
	"use strict";

	for (var i = 0; i < path.length; i ++) {
		this.push(path[i]);
	}

	return this;
};
D3D.Path.prototype.clip = function (path, type) {
	"use strict";

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPath(this, ClipperLib.PolyType.ptSubject, true);
	if (path instanceof D3D.Path) {
		clipper.AddPath(path, ClipperLib.PolyType.ptClip, true);
	}
	else if (path instanceof D3D.Paths) {
		clipper.AddPaths(path, ClipperLib.PolyType.ptClip, true);
	}
	clipper.Execute(type, solution);

	return new D3D.Paths(solution, this.closed);
};
D3D.Path.prototype.union = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctUnion);
};
D3D.Path.prototype.difference = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctDifference);
};
D3D.Path.prototype.intersect = function (path) {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctIntersection);
};
D3D.Path.prototype.xor = function () {
	"use strict";

	return this.clip(path, ClipperLib.ClipType.ctXor);
};
D3D.Path.prototype.offset = function (offset) {
	"use strict";

	var solution = new ClipperLib.Path();
	var co = new ClipperLib.ClipperOffset(2, 0.25);
	co.AddPath(this, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, offset);

	return new D3D.Path(solution[0], this.closed);
};
D3D.Path.prototype.scaleUp = function (factor) {
	"use strict";

	ClipperLib.JS.ScaleUpPath(this, factor);

	return this;
};
D3D.Path.prototype.scaleDown = function (factor) {
	"use strict";

	var path = ClipperLib.JS.ScaleDownPath(this, factor);

	return this;
};
D3D.Path.prototype.tresholdArea = function (minArea) {
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
D3D.Path.prototype.area = function () {
	"use strict";

	return ClipperLib.Clipper.Area(this);
};
D3D.Path.prototype.join = function (path) {
	"use strict";

	this.setPath(this.concat(path));

	return this;
}
D3D.Path.prototype.clone = function () {
	"use strict";

	var path = ClipperLib.JS.Clone(this);

	return new D3D.Path(path, this.closed);
}
D3D.Path.prototype.draw = function (context, color) {
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