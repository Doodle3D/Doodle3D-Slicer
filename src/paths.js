import ClipperLib from 'clipper-lib';
import THREE from 'three.js';

export default class Paths extends Array {
	constructor (paths = [], closed = true) {
		super();

		this.setPaths(paths);
		this.closed = closed;
	}

	setPaths (paths) {
		for (var i = 0; i < paths.length; i ++) {
			var path = paths[i];

			if (path.length > 0) {
				this.push(path);
			}
		}

		return this;
	}

	_clip (path, type) {
		var solution = new ClipperLib.PolyTree();

		var clipper = new ClipperLib.Clipper();
		clipper.AddPaths(this, ClipperLib.PolyType.ptSubject, this.closed);
		clipper.AddPaths(path, ClipperLib.PolyType.ptClip, path.closed);
		clipper.Execute(type, solution);

		if (this.closed) {
			var paths = ClipperLib.Clipper.ClosedPathsFromPolyTree(solution);
		}
		else {
			var paths = ClipperLib.Clipper.OpenPathsFromPolyTree(solution);
		}

		return new Paths(paths, this.closed);
	}
	
	union (path) {
		return this._clip(path, ClipperLib.ClipType.ctUnion);
	}

	difference (path) {
		return this._clip(path, ClipperLib.ClipType.ctDifference);
	}

	intersect (path) {
		return this._clip(path, ClipperLib.ClipType.ctIntersection);
	}

	xor (path) {
		return this._clip(path, ClipperLib.ClipType.ctXor);
	}

	offset (offset) {
		var solution = new ClipperLib.Paths();
		var co = new ClipperLib.ClipperOffset(1, 1);
		co.AddPaths(this, ClipperLib.JoinType.jtSquare, ClipperLib.EndType.etClosedPolygon);
		co.Execute(solution, offset);

		return new Paths(solution);
	}

	scaleUp (factor) {
		ClipperLib.JS.ScaleUpPaths(this, factor);

		return this;
	}

	scaleDown (factor) {
		ClipperLib.JS.ScaleDownPaths(this, factor);

		return this;
	}

	lastPoint () {
		if (this.length === 0) {
			return new THREE.Vector2();
		}

		var lastPath = this[this.length - 1];
		var lastPoint = this.closed ? lastPath[0] : lastPath[lastPath.length - 1];
		return new THREE.Vector2(lastPoint.X, lastPoint.Y);
	}

	optimizePath (start) {
		var optimizedPaths = new Paths([], this.closed);
		var donePaths = [];

		while (optimizedPaths.length !== this.length) {
			var minLength = false;
			var reverse;
			var minPath;
			var offset;
			var pathIndex;

			for (var i = 0; i < this.length; i += 1) {
				var path = this[i];

				if (donePaths.indexOf(i) === -1) {

					if (this.closed) {
						for (var j = 0; j < path.length; j += 1) {
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
	}

	areas () {
		var areas = [];

		for (var i = 0; i < this.length; i ++) {
			var shape = this[i];
			var area = Math.abs(ClipperLib.Clipper.Area(shape));
			areas.push(area);
		}

		return areas;
	}

	area () {
		var areas = this.areas();
		var totalArea = 0;

		for (var i = 0; i < areas.length; i ++) {
			var area = areas[i];
			totalArea += area;
		}

		return totalArea;
	}

	tresholdArea (minArea) {
		// code not tested yet
		for (var i = 0; i < this.length; i ++) {
			var shape = this[i];
			var area = ClipperLib.Clipper.Area(shape);

			if (area < minArea) {
				this.splice(i, 1);
				i -= 1;
			}
		}
	}

	join (path) {
		for (var i = 0; i < path.length; i += 1) {
			this.push(path[i]);
		}

		return this;
	}

	clone () {
		return new Paths(ClipperLib.JS.Clone(this), this.closed);
	}

	bounds () {
		return ClipperLib.Clipper.GetBounds(this);
	}

	clean (cleanDelta) {
		return new Paths(ClipperLib.Clipper.CleanPolygons(this, cleanDelta), this.closed);
	}

	isHole () {
		if (this.length !== 1) {
			console.log('wtf?');
		}
		return !ClipperLib.Clipper.Orientation(this[0]);
	}

	pointCollision (point) {
		var collision = ClipperLib.Clipper.PointInPolygon(point, this[0]);
		return ClipperLib.Clipper.PointInPolygon(point, this[0]);
	}

	boundSize () {
		var bounds = this.bounds();

		var width = bounds.right - bounds.left;
		var height = bounds.bottom - bounds.top;

		return width * height;
	}

	draw (context, color) {
		context.strokeStyle = color;
		for (var i = 0; i < this.length; i += 1) {
			var shape = this[i];

			// var point = shape[0];
			// context.fillText(i, point.X*2, point.Y*2);

			context.beginPath();
			for (var j = 0; j < shape.length; j += 1) {
				var point = shape[j % shape.length];

				context.lineTo(point.X * 2, point.Y * 2);
			}
			if (this.closed) {
				context.closePath();
			}
			context.stroke();
		}
	}
}
