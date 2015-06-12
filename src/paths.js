/******************************************************
*
* Path
*
* Abstraction layer for annoying clipper js
* ! inherrits from Array !
*
******************************************************/

D3D.Paths = function (paths, closed) {
	'use strict';

	Array.call(this);

	this.setPaths(paths || []);

	this.closed = (closed !== undefined) ? closed : true;
};
D3D.Paths.prototype = Object.create(Array.prototype);
D3D.Paths.prototype.setPaths = function (paths) {
	'use strict';

	for (var i = 0; i < paths.length; i ++) {
		var path = paths[i];
		if (path.length > 0) {
			this.push(path);
		}
	}

	return this;
};
D3D.Paths.prototype.clip = function (path, type) {
	'use strict';

	var solution = new ClipperLib.Paths();

	var clipper = new ClipperLib.Clipper();
	clipper.AddPaths(this, ClipperLib.PolyType.ptSubject, this.closed);
	clipper.AddPaths(path, ClipperLib.PolyType.ptClip, path.closed);
	clipper.Execute(type, solution);

	return new D3D.Paths(solution, this.closed);
};
D3D.Paths.prototype.union = function (path) {
	'use strict';

	return this.clip(path, ClipperLib.ClipType.ctUnion);
};
D3D.Paths.prototype.difference = function (path) {
	'use strict';

	return this.clip(path, ClipperLib.ClipType.ctDifference);
};
D3D.Paths.prototype.intersect = function (path) {
	'use strict';

	return this.clip(path, ClipperLib.ClipType.ctIntersection);
};
D3D.Paths.prototype.xor = function () {
	'use strict';

	return this.clip(path, ClipperLib.ClipType.ctXor);
};
D3D.Paths.prototype.offset = function (offset) {
	'use strict';

	var solution = new ClipperLib.Paths();
	var co = new ClipperLib.ClipperOffset(1, 1);
	co.AddPaths(this, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
	co.Execute(solution, offset);

	return new D3D.Paths(solution);
};
D3D.Paths.prototype.scaleUp = function (factor) {
	'use strict';

	var path = ClipperLib.JS.ScaleUpPaths(this, factor);

	return this;
};
D3D.Paths.prototype.scaleDown = function (factor) {
	'use strict';

	var path = ClipperLib.JS.ScaleDownPaths(this, factor);

	return this;
};
D3D.Paths.prototype.lastPoint = function () {
	'use strict';

	var lastPath = this[this.length - 1];
	var lastPoint = this.closed ? lastPath[0] : lastPath[lastPath.length - 1];
	return new THREE.Vector2(lastPoint.X, lastPoint.Y);
};
D3D.Paths.prototype.optimizePath = function (start) {
	'use strict';

	var optimizedPaths = new D3D.Paths([], this.closed);
	var donePaths = [];

	while (optimizedPaths.length !== this.length) {
		var minLength = false;
		var reverse;
		var minPath;
		var offset;
		var pathIndex;

		for (var i = 0; i < this.length; i ++) {
			var path = this[i];

			if (donePaths.indexOf(i) === -1) {

				if (this.closed) {
					for (var j = 0; j < path.length; j ++) {
						var point = new THREE.Vector2(path[j].X, path[j].Y);
						var length = point.sub(start).length();
						if (minLength === false || length < minLength) {
							minPath = path;
							minLength = length;
							offset = j;
							pathIndex = i;
						}
					}
				}
				else {
					var startPoint = new THREE.Vector2(path[0].X, path[0].Y);
					var length = startPoint.sub(start).length();
					if (minLength === false || length < minLength) {
						minPath = path;
						minLength = length;
						reverse = false;
						pathIndex = i;
					}
					var endPoint = new THREE.Vector2(path[path.length - 1].X, path[path.length - 1].Y);
					var length = endPoint.sub(start).length();
					if (length < minLength) {
						minPath = path;
						minLength = length;
						reverse = true;
						pathIndex = i;
					}
				}
			}
		}

		if (this.closed) {
			minPath = minPath.concat(minPath.splice(0, offset));
			var point = minPath[0];
		}
		else {
			if (reverse) {
				minPath.reverse();	
			}
			var point = minPath[minPath.length - 1];
		}
		donePaths.push(pathIndex);
		start = new THREE.Vector2(point.X, point.Y);
		optimizedPaths.push(minPath);
	}

	return optimizedPaths;
};
D3D.Paths.prototype.areas = function () {
	'use strict';

	var areas = [];

	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		var area = Math.abs(ClipperLib.Clipper.Area(shape));
		areas.push(area);
	}

	return areas;
};
D3D.Paths.prototype.tresholdArea = function (minArea) {
	//code not tested yet
	'use strict';

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
D3D.Paths.prototype.join = function (path) {
	'use strict';

	for (var i = 0; i < path.length; i ++) {
		this.push(path[i]);
	}

	return this;
};
D3D.Paths.prototype.clone = function () {
	'use strict';

	return new D3D.Paths(ClipperLib.JS.Clone(this), this.closed);
};
D3D.Paths.prototype.bounds = function () {
	'use strict';

	return ClipperLib.Clipper.GetBounds(this);
};
D3D.Paths.prototype.clean = function (cleanDelta) {
	'use strict';

	return new D3D.Paths(ClipperLib.Clipper.CleanPolygons(this, cleanDelta), this.closed);
}
D3D.Paths.prototype.boundSize = function () {
	'use strict';

	var bounds = this.bounds();

	var width = bounds.right - bounds.left;
	var height = bounds.top - bounds.bottom;

	return width * height;
};
D3D.Paths.prototype.draw = function (context, color) {
	'use strict';

	context.strokeStyle = color;
	for (var i = 0; i < this.length; i ++) {
		var shape = this[i];

		//var point = shape[0];
		//context.fillText(i, point.X*2, point.Y*2);

		context.beginPath();
		var length = this.closed ? (shape.length + 1) : shape.length;
		for (var j = 0; j < length; j ++) {
			var point = shape[j % shape.length];

			context.lineTo(point.X*2, point.Y*2);
		}
		context.stroke();
	}
};