//canvas cheat sheet
//http://cheatsheetworld.com/programming/html5-canvas-cheat-sheet/

//TODO
//Global Composite Operation
//Linear Gradient
//Radial Gradient
//Bezier Curve
//Circle
//Touch support

"use strict";
var CAL = {
	name: "Canvas Abstraction Layer",
	version: "1.0",
	author: "Casper Lamboo",
	contact: "casperlamboo@gmail.com"
};

CAL.Math = {
	clamb: function (value, min, max) {
		return (value > min) ? ((value < max) ? value : max) : min;
	},
	randomInt: function (min, max) {
		return Math.round(CAL.Math.random(min, max));
	},
	random: function (min, max) {
		min = min || 0;
		max = max === undefined ? 1 : max;

		return Math.random()*(max - min) + min;
	},
	sign: function (value) {
		return (value > 0) ? 1 : ((value < 0) ? -1 : 0);
	},
	lineCollision: function (v1, v2, v3, v4) {
		//bron: http://mathworld.wolfram.com/Line-LineIntersection.html
		var intersection = new CAL.Vector(
			((v1.x*v2.y-v1.y*v2.x)*(v3.x-v4.x)-(v1.x-v2.x)*(v3.x*v4.y-v3.y*v4.x)) / ((v1.x-v2.x)*(v3.y-v4.y)-(v1.y-v2.y)*(v3.x-v4.x)),
			((v1.x*v2.y-v1.y*v2.x)*(v3.y-v4.y)-(v1.y-v2.y)*(v3.x*v4.y-v3.y*v4.x)) / ((v1.x-v2.x)*(v3.y-v4.y)-(v1.y-v2.y)*(v3.x-v4.x))
		);

		var line1 = v1.subtract(v2).length();
		var line2 = v3.subtract(v4).length();

		var a = line1 >= v1.subtract(intersection).length();
		var b = line1 >= v2.subtract(intersection).length();
		var c = line2 >= v3.subtract(intersection).length();
		var d = line2 >= v4.subtract(intersection).length();

		return (a && b && c && d) ? intersection : false;
	}
};

CAL.Easings = {
	bounceEaseOut: function (dt, b, c, d) {
		if ((dt /= d) < (1 / 2.75)) {
			return c * (7.5625 * dt * dt) + b;
		}
		else if (dt < (2 / 2.75)) {
			return c * (7.5625 * (dt -= (1.5 / 2.75)) * dt + 0.75) + b;
		}
		else if (dt < (2.5 / 2.75)) {
			return c * (7.5625 * (dt -= (2.25 / 2.75)) * dt + 0.9375) + b;
		}
		else {
			return c * (7.5625 * (dt -= (2.625 / 2.75)) * dt + 0.984375) + b;
		}
	},
	easeIn: function (dt, b, c, d) {
		return c * (dt /= d) * dt + b;
	},
	easeOut: function (dt, b, c, d) {
		return -c * (dt /= d) * (dt - 2) + b;
	},
	easeInOut: function (dt, b, c, d) {
		if ((dt /= d / 2) < 1) {
			return c / 2 * dt * dt + b;
		}
		return -c / 2 * ((--dt) * (dt - 2) - 1) + b;
	},
	strongEaseIn: function (dt, b, c, d) {
		return c * (dt /= d) * dt * dt * dt * dt + b;
	},
	strongEaseOut: function (dt, b, c, d) {
		return c * (( dt = dt / d - 1) * dt * dt * dt * dt + 1) + b;
	},
	strongEaseInOut: function (dt, b, c, d) {
		if ((dt /= d / 2) < 1) {
			return c / 2 * dt * dt * dt * dt * dt + b;
		}
		return c / 2 * ((dt -= 2) * dt * dt * dt * dt + 2) + b;
	},
	linear: function (dt, b, c, d) {
		return c * dt / d + b;
	}
};


//this doesn't work, everything is an instance of Object in JavaScript
/*Object.prototype.clone = function () {
	var object = {};
	for (var i in this) {
		var element = this[i];

		object[i] = element.clone ? element.clone() : element;
	}
	return object;
};
Object.prototype.foreach = function (callback) {
	for (var i in this) {
		var element = this[i];

		callback(element, i);
	}
};*/


Array.prototype.foreach = function (callback, scope) {
	for (var i = 0; i < this.length; i ++) {
		var element = this[i];

		if ((scope !== undefined) ? callback.call(scope, element, i) : callback(element, i)) {
			break;
		}
	}
};
Array.prototype.foreachReverse = function (callback, scope) {
	for (var i = this.length-1; i >= 0; i --) {
		var element = this[i];

		if ((scope !== undefined) ? callback.call(scope, element, i) : callback(element, i)) {
			break;
		}
	}
};
Array.prototype.max = function () {
	var max = -Infinity;
	this.foreach(function (element) {
		if (element > max) {
			max = element;
		}
	});
	return max;
};
Array.prototype.min = function () {
	var min = Infinity;
	this.foreach(function (element) {
		if (element < min) {
			min = element;
		}
	});
	return min;
};
Array.prototype.clone = function () {
	var array = [];
	this.foreach(function (element) {
		array.push((element.clone !== undefined) ? element.clone() : element);
	});
	return array;
};
Array.prototype.remove = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var element = arguments[i];
		var index = this.indexOf(element);
		if (index !== -1) {
			this.splice(index, 1);
		}
	}
};

var requestAnimFrame = (function () {
	return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || function (callback) {
		setTimeout(callback, 1000/60);
	};
})();

CAL.Vector = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;
};
CAL.Vector.prototype.add = function (vector) {
	var x = this.x + vector.x;
	var y = this.y + vector.y;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.subtract = function (vector) {
	var x = this.x - vector.x;
	var y = this.y - vector.y;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.scale = function (scalar) {
	var x = this.x * scalar;
	var y = this.y * scalar;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.rotate = function (angle) {
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	var x = cos*this.x - sin*this.y;
	var y = sin*this.x + cos*this.y;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.multiply = function (vector) {
	var x = this.x * vector.x;
	var y = this.y * vector.y;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.length = function () {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};
CAL.Vector.prototype.normal = function () {
	return new CAL.Vector(this.y, -this.x);
};
CAL.Vector.prototype.normalize = function () {
	var length = this.length();

	var x = this.x/length;
	var y = this.y/length;

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.angle = function () {
	return Math.atan2(this.y, this.x);
};
CAL.Vector.prototype.dot = function (vector) {
	return this.x * vector.x + this.y * vector.y;
};
CAL.Vector.prototype.cross = function (vector) {
	return this.x * vector.y - this.y * vector.x;
};
CAL.Vector.prototype.round = function () {
	var x = Math.round(this.x);
	var y = Math.round(this.y);

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.applyMatrix = function (matrix) {
	var m = matrix.matrix;

	var x = m[0]*this.x + m[1]*this.y + m[2];
	var y = m[3]*this.x + m[4]*this.y + m[5];

	return new CAL.Vector(x, y);
};
CAL.Vector.prototype.clone = function () {
	return new CAL.Vector(this.x, this.y);
};
CAL.Vector.prototype.draw = function (context, x, y) {
	var end = new CAL.Vector(this.x + x, this.y + y);
	var arrowOrigin = new CAL.Vector(x, y).add(this.subtract(this.normalize().scale(10)));
	var left = this.normal().normalize().scale(10).add(arrowOrigin);
	var right = this.normal().normalize().scale(-10).add(arrowOrigin);

	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(end.x, end.y);
	context.moveTo(left.x, left.y);
	context.lineTo(end.x, end.y);
	context.lineTo(right.x, right.y);

	context.stroke();
};

CAL.Matrix = function (options) {
	options = options || {};

	if (options.matrix !== undefined && options.sx !== undefined && options.sy !== undefined && options.rotation !== undefined && options.x !== undefined && options.y !== undefined) {
		this.matrix = options.matrix;
		this._sx = options.sx;
		this._sy = options.sy;
		this._rotation = options.rotation;
		this._x = options.x;
		this._y = options.y;
	}
	else if (options instanceof Array || options.matrix) {
		this.matrix = options.matrix || options;

		this._sx = CAL.Math.sign(this.matrix[0])*Math.sqrt(Math.pow(this.matrix[0], 2) + Math.pow(this.matrix[1], 2));
		this._sy = CAL.Math.sign(this.matrix[4])*Math.sqrt(Math.pow(this.matrix[3], 2) + Math.pow(this.matrix[4], 2));
		this._rotation = Math.atan2(-this.matrix[1], this.matrix[0]);
		this._x = this.matrix[2];
		this._y = this.matrix[5];
		//source: http://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
		//BUG doesn't convert right when both sx and sy aren't 1
	}
	else {
		this._sx = options.sx !== undefined ? options.sx : 1;
		this._sy = options.sy !== undefined ? options.sy : 1;
		this._x = options.x || 0;
		this._y = options.y || 0;

		if (options.rotation === undefined) {
			this._rotation = 0;

			this.matrix = [
				this._sx, 0, this._x,
				0, this._sy, this._y
			];
		}
		else {
			this._rotation = options.rotation;
			this.updateMatrix();
		}
	}
};
CAL.Matrix.prototype = {
	get sx () {
		return this._sx;
	},
	set sx (sx) {
		this._sx = sx;
		this.updateMatrix();
	},
	get sy () {
		return this._sy;
	},
	set sy (sy) {
		this._sy = sy;
		this.updateMatrix();
	},
	get rotation () {
		return this._rotation;
	},
	set rotation (rotation) {
		this._rotation = rotation;
		this.updateMatrix();
	},
	get x () {
		return this._x;
	},
	set x (x) {
		this._x = this.matrix[2] = x;
	},
	get y () {
		return this._y;
	},
	set y (y) {
		this._y = this.matrix[5] = y;
	}
};
CAL.Matrix.prototype.updateMatrix = function () {
	this.matrix = [
		this._sx * Math.cos(this._rotation), this._sy * -Math.sin(this._rotation), this._x,
		this._sx * Math.sin(this._rotation), this._sy * Math.cos(this._rotation), this._y
	];
};
CAL.Matrix.prototype.multiplyMatrix = function (matrix) {
	var a = this.matrix;
	var b = matrix.matrix;
	var translation = new CAL.Vector(b[2], b[5]).applyMatrix(this);

	return new CAL.Matrix([
		a[0]*b[0] + a[3]*b[1], a[1]*b[0] + a[4]*b[1], translation.x,
		a[0]*b[3] + a[3]*b[4], a[1]*b[3] + a[4]*b[4], translation.y,
	]);
};
CAL.Matrix.prototype.inverse = function () {
	var m = this.matrix;
	return new CAL.Matrix([
		m[4], -m[1], -m[2],
		-m[3], m[0], -m[5]
	]);
};
CAL.Matrix.prototype.translate = function (x, y) {
	this.x += x;
	this.y += y;

	this.matrix[2] = this.x;
	this.matrix[5] = this.y;

	return this;
};
CAL.Matrix.prototype.setMatrix = function (matrix) {
	this.matrix = matrix.matrix.clone();
	this._x = matrix._x;
	this._y = matrix._y;
	this._sx = matrix._sx;
	this._sy = matrix._sy;
	this._rotation = matrix._rotation;
};
CAL.Matrix.prototype.setContext = function (context) {
	var m = this.matrix;
	context.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
};
CAL.Matrix.prototype.rotateAroundAbsolute = function (angle, center) {
	if (angle !== 0) {
		var center = center
			.subtract(new CAL.Vector(this.x, this.y))
			.rotate(-this.rotation)
			.multiply(new CAL.Vector(1/this.sx, 1/this.sy));

		this.rotateAroundRelative(angle, center);
	}
};
CAL.Matrix.prototype.rotateAroundRelative = function (angle, center) {
	if (angle !== 0) {
		var before = center.applyMatrix(this);

		this.rotation += angle;
		var after = center.applyMatrix(this);

		var offset = before.subtract(after);
		
		this._x += offset.x;
		this._y += offset.y;
		this.updateMatrix();
	}
};
CAL.Matrix.prototype.clone = function () {
	return new CAL.Matrix({
		matrix: this.matrix.clone(),
		sx: this._sx,
		sy: this._sy,
		rotation: this._rotation,
		x: this._x,
		y: this._y
	});
};

CAL.Draw = function (centerX, centerY, numberWidth, numberHeight, options) {
	CAL.Matrix.call(this, options);

	this.visible = options.visible !== undefined ? options.visible : true;
	this.active = options.active || false;
	this.depth = options.depth || 0;

	this.alpha = (typeof options.alpha === "number") ? options.alpha : 1;

	this.centerX = centerX || 0;
	this.centerY = centerY || 0;
	this.index = 0;

	this.numberWidth = numberWidth || 1;
	this.numberHeight = numberHeight || 1;
	this.length = this.numberWidth*this.numberHeight;
};
CAL.Draw.prototype = Object.create(CAL.Matrix.prototype);
CAL.Draw.prototype.draw = function (context, matrix) {
	context.save();
	(matrix || this).setContext(context);
	context.globalAlpha = this.alpha;
	this.drawSimple(context, this.index, 0, 0);
	context.restore();
};
CAL.Draw.prototype.drawSimple = function (context, number, x, y) {
	var sx = (number % this.numberWidth)*this.width;
	var sy = Math.floor(number/this.numberWidth)*this.height;

	context.drawImage(this.image, sx, sy, this.width, this.height, x-this.centerX, y-this.centerY, this.width, this.height);
};
CAL.Draw.prototype.drawAlpha = function (context, number, x, y, alpha) {
	context.globalAlpha = alpha;
	this.drawSimple(context, number, x, y);
	context.globalAlpha = 1;
};
CAL.Draw.prototype.drawAngle = function (context, number, x, y, angle) {
	context.save();
	context.translate(x, y);
	context.rotate(angle);
	this.drawSimple(context, number, 0, 0);
	context.restore();
};
CAL.Draw.prototype.drawScale = function (context, number, x, y, width, height) {
	var sx = (number % this.numberWidth)*this.width;
	var sy = Math.floor(number/this.numberWidth)*this.height;

	context.drawImage(this.image, sx, sy, this.width, this.height, x-this.centerX, y-this.centerY, width, height);	
};
CAL.Draw.prototype.drawContain = function (context, number, x, y, width, height) {
	if (width/height > this.width/this.height) {
		x = x + (width-height/this.height*this.width)/2;
		width = height/this.height*this.width;
		this.drawScale(context, number, x, y, width, height);
	}
	else {
		y = y + (height-width/this.width*this.height)/2;
		height = width/this.width*this.height;
		this.drawScale(context, number, x, y, width, height);
	}
};

CAL.Surface = function (options) {
	options = options || {};
	CAL.Draw.call(this, options.centerX, options.centerY, options.numberWidth, options.numberHeight, options);

	this.clearColor = options.clearColor || false;

	this.setCanvas(options.canvas || document.createElement("canvas"));

	this.setSize(options.width, options.height);
};
CAL.Surface.prototype = Object.create(CAL.Draw.prototype);
CAL.Surface.prototype.setSize = function (width, height) {
	this.image.width = width || this.image.width;
	this.image.height = height || this.image.height;

	this.width = this.image.width/this.numberWidth;
	this.height = this.image.height/this.numberHeight;
};
CAL.Surface.prototype.setCanvas = function (canvas) {
	this.image = canvas;
	this.context = canvas.getContext("2d");
};
CAL.Surface.prototype.clear = function () {
	if (this.clearColor) {
		this.clearColor.setColor(this.context);
		this.context.fillRect(0, 0, this.image.width, this.image.height);
	}
	else {
		this.context.clearRect(0, 0, this.image.width, this.image.height);
	}
};
CAL.Surface.prototype.getImageData = function (x, y, width, height) {
	var x = x || 0;
	var y = y || 0;
	var width = width || this.image.width;
	var height = height || this.image.height;

	return this.context.getImageData(x, y, width, height);
};
CAL.Surface.prototype.getDataURL = function () {
	return this.image.toDataURL();
};
CAL.Surface.prototype.blur = (function () {
	//source: http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html
	//author: Mario Klingemann

	var mul_table = [512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
	var shg_table = [9,11,12,13,13,14,14,15,15,15,15,16,16,16,16,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24 ];

	return function (radius, x, y, width, height) {
		x = x || 0;
		y = y || 0;
		width = this.image.width || 0;
		height = this.image.height || 0;
		var imageData = this.getImageData(x, y, width, height);

		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, 
		r_out_sum, g_out_sum, b_out_sum, a_out_sum,
		r_in_sum, g_in_sum, b_in_sum, a_in_sum, 
		pr, pg, pb, pa, rbs;

		var div = radius + radius + 1;
		var w4 = width << 2;
		var widthMinus1 = width - 1;
		var heightMinus1 = height - 1;
		var radiusPlus1 = radius + 1;
		var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
		var pixels = imageData.data;

		var stackStart = {r: 0, g: 0, b: 0, next: null};
		var stack = stackStart;
		for (i = 1; i < div; i ++) {
			stack = stack.next = {r: 0, g: 0, b: 0, next: null};
			if (i == radiusPlus1) {
				var stackEnd = stack;
			}
		}
		stack.next = stackStart;
		var stackIn = null;
		var stackOut = null;

		yw = yi = 0;

		var mul_sum = mul_table[radius];
		var shg_sum = shg_table[radius];

		for (y = 0; y < height; y ++) {
			r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
			
			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
			a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);
			
			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;
			
			stack = stackStart;
			
			for (i = 0; i < radiusPlus1; i ++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}
			
			for (i = 1; i < radiusPlus1; i ++) {
				p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
				r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[p+2])) * rbs;
				a_sum += (stack.a = (pa = pixels[p+3])) * rbs;
				
				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;
				
				stack = stack.next;
			}
			
			stackIn = stackStart;
			stackOut = stackEnd;
			for (x = 0; x < width; x ++) {
				pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
				if (pa === 0) {
					pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
				}
				else {
					pa = 255 / pa;
					pixels[yi] = ((r_sum * mul_sum) >> shg_sum) * pa;
					pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
					pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
				}
				
				
				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;
				
				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;
				
				p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;
				
				r_in_sum += (stackIn.r = pixels[p]);
				g_in_sum += (stackIn.g = pixels[p+1]);
				b_in_sum += (stackIn.b = pixels[p+2]);
				a_in_sum += (stackIn.a = pixels[p+3]);
				
				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;
				a_sum += a_in_sum;
				
				stackIn = stackIn.next;
				
				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);
				
				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;
				
				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for (x = 0; x < width; x ++) {
			g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
			
			yi = x << 2;
			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
			a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);
			
			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;
			
			stack = stackStart;
			
			for (i = 0; i < radiusPlus1; i ++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}
			
			yp = width;
			
			for (i = 1; i <= radius; i ++) {
				yi = (yp + x) << 2;
				
				r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;
				a_sum += (stack.a = (pa = pixels[yi+3])) * rbs;
			 
				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;
				
				stack = stack.next;
			
				if (i < heightMinus1) {
					yp += width;
				}
			}
			
			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for (y = 0; y < height; y ++) {
				p = yi << 2;
				pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
				if (pa > 0) {
					pa = 255 / pa;
					pixels[p] = ((r_sum * mul_sum) >> shg_sum) * pa;
					pixels[p+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
					pixels[p+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
				}
				else {
					pixels[p] = pixels[p+1] = pixels[p+2] = 0;
				}
				
				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;
			 
				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;
				
				p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;
				
				r_sum += (r_in_sum += (stackIn.r = pixels[p]));
				g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
				b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));
				a_sum += (a_in_sum += (stackIn.a = pixels[p+3]));
			 
				stackIn = stackIn.next;
				
				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);
				
				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;
				
				stackOut = stackOut.next;
				
				yi += width;
			}
		}
		return imageData;
	};
})();

CAL.Draw.prototype.drawBlur = (function () {
	var surface = new CAL.Surface();

	return function (context, number, x, y, radius) {
		if (radius > 0) {
			surface.setSize(this.width + 2*radius, this.height + 2*radius);
			this.drawSimple(surface.context, number, this.centerX+radius, this.centerY+radius);
			var imageData = surface.blur(radius);
			
			context.putImageData(imageData, x-this.centerX - radius, y-this.centerY - radius);

			/*surface.setSize(this.width, this.height);
			this.drawSimple(surface.context, number, this.centerX, this.centerY);
			var imageData = surface.blur(radius);
			
			context.putImageData(imageData, x-this.centerX, y-this.centerY);*/
		}
		else {
			this.drawSimple(context, number, x, y);
		}
	};
})();

CAL.Group = function (options) {
	options = options || {};
	CAL.Surface.call(this, options);

	this.active = true;
	this.visible = true;

	this.objects = [];
	this.useCanvas = options.useCanvas || false;

	this.clearCanvas = true;
	this.drawCanvas = true;

	this.mouse = {
		x: null,
		y: null,
		startX: null,
		startY: null,
		deltaX: null,
		deltaY: null,
		down: false,
		moved: false
	};
};
CAL.Group.prototype = Object.create(CAL.Surface.prototype);
CAL.Group.prototype.updateEvents = function () {
	var scope = this;
	this.image.onmousedown = function (event) {
		if (scope.useCanvas) {
			scope.mouse.x = scope.mouse.startX = Math.round(scope.image.width / scope.image.clientWidth * event.offsetX);
			scope.mouse.y = scope.mouse.startY = Math.round(scope.image.height / scope.image.clientHeight * event.offsetY);
			scope.mouse.deltaX = 0;
			scope.mouse.deltaY = 0;
			scope.mouse.down = true;
			scope.mouse.moved = false;

			scope.mouseDown(scope.mouse, this);
		}
	};
	this.image.onmouseup = function (event) {
		if (scope.useCanvas) {
			scope.mouse.x = Math.round(scope.image.width / scope.image.clientWidth * event.offsetX);
			scope.mouse.y = Math.round(scope.image.height / scope.image.clientHeight * event.offsetY);
			scope.mouse.down = false;

			scope.mouseUp(scope.mouse, this);

			scope.mouse.startX = null;
			scope.mouse.startY = null;
			scope.mouse.deltaX = null;
			scope.mouse.deltaY = null;
			scope.mouse.moved = false;
		}
	};
	this.image.onmousemove = function (event) {
		if (scope.useCanvas) {
			scope.mouse.x = Math.round(scope.image.width / scope.image.clientWidth * event.offsetX);
			scope.mouse.y = Math.round(scope.image.height / scope.image.clientHeight * event.offsetY);
			if (scope.mouse.down) {
				scope.mouse.moved = true;
				scope.mouse.deltaX = scope.mouse.x - scope.mouse.startX;
				scope.mouse.deltaY = scope.mouse.y - scope.mouse.startY;
			}
		}
	};
	//this.image.ontouchstart = function (event) {scope.touchStart(event);};
	//this.image.ontouchmove = function (event) {scope.touchMove(event);};
	//this.image.ontouchend = function (event) {scope.touchEnd(event);};
};
CAL.Group.prototype.setCanvas = function (canvas) {
	/*this.image.onmousedown = null;
	this.image.onmouseup = null;
	this.image.onmousemove = null;
	this.image.ontouchstart = null;
	this.image.ontouchmove = null;
	this.image.ontouchend = null;*/

	this.image = canvas;
	this.context = canvas.getContext("2d");

	this.drawCanvas = true;
	this.updateEvents();
};
CAL.Group.prototype.add = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var object = arguments[i];
		if (this.objects.indexOf(object) === -1) {
			this.objects.push(object);
			if (object.init) {
				object.init(this);
			}
		}
	}
	this.sort();
	this.drawCanvas = true;
};
CAL.Group.prototype.remove = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var object = arguments[i];
		this.objects.remove(object);
		if (object.active && object.remove !== undefined) {
			object.remove(this);
		}
	}
	this.drawCanvas = true;
};
CAL.Group.prototype.sort = function () {
	this.objects.sort(function (a, b) {
		return (a.depth || 0) - (b.depth || 0);
	});
};
CAL.Group.prototype.keyDown = function (keyCode) {
	for (var i = this.objects.length-1; i >= 0; i --) {
		var object = this.objects[i];
		if (object.active && object.keyDown !== undefined) {
			if (object.keyDown(keyCode, this)) {
				break;
			}
		}
	}
};
CAL.Group.prototype.keyUp = function (keyCode) {
	for (var i = this.objects.length-1; i >= 0; i --) {
		var object = this.objects[i];
		if (object.active && object.keyUp !== undefined) {
			if (object.keyUp(keyCode, this)) {
				break;
			}
		}
	}
};
CAL.Group.prototype.mouseDown = function (mouse) {
	for (var i = this.objects.length-1; i >= 0; i --) {
		var object = this.objects[i];
		if (object.useCanvas !== true && object.active && object.mouseDown !== undefined) {
			if (object.mouseDown(mouse, this)) {
				break;
			}
		}
	}
};
CAL.Group.prototype.mouseUp = function (mouse) {
	for (var i = this.objects.length-1; i >= 0; i --) {
		var object = this.objects[i];
		if (object.useCanvas !== true && object.active && object.mouseUp !== undefined) {
			if (object.mouseUp(mouse, this)) {
				break;
			}
		}
	}
};
CAL.Group.prototype.step = function (deltaTime) {
	for (var i = 0; i < this.objects.length; i ++) {
		var object = this.objects[i];
		if (object.active && object.step !== undefined) {
			object.step(deltaTime, this);
		}
	}

	if (this.clearCanvas && this.useCanvas) {
		this.clear();
	}

	if (this.drawCanvas && this.useCanvas) {
		this.draw();
	}

	this.clearCanvas = false;
	this.drawCanvas = false;
};
CAL.Group.prototype.draw = function (context, matrix) {
	context = this.useCanvas ? this.context : context;
	matrix = this.useCanvas ? this : matrix;

	for (var i = 0; i < this.objects.length; i ++) {
		var object = this.objects[i];
		if (object.useCanvas !== true && object.visible && object.draw !== undefined) {
			if (object instanceof CAL.Matrix) {
				object.draw(context, matrix.multiplyMatrix(object));
			}
			else {
				object.draw(context, matrix);
			}
		}
	}
};

CAL.Scene = function () {
	CAL.Group.call(this, {useCanvas: true});

	this.lastTime = new Date().getTime();

	this.keysDown = [];
	this.focus = true;

	var scope = this;
	window.onkeydown = function (event) {
		if (!scope.keysDown[event.keyCode]) {
			scope.keysDown[event.keyCode] = true;
			scope.keyDown(event.keyCode);
		}
	};
	window.onkeyup = function (event) {
		scope.keysDown[event.keyCode] = false;

		scope.keyUp(event.keyCode);
	};
	window.onblur = function (event) {
		this.focus = false;
	};
	window.onfocus = function (event) {
		scope.lastTime = new Date().getTime();
		this.focus = true;
	};
};
CAL.Scene.prototype = Object.create(CAL.Group.prototype);
CAL.Scene.prototype.cycle = function () {
	if (this.focus) {
		var currentTime = new Date().getTime();
		var deltaTime = currentTime-this.lastTime;
		this.lastTime = currentTime;

		this.step(deltaTime);
	}
};
CAL.Scene = new CAL.Scene();

CAL.Image = function (source, centerX, centerY, numberWidth, numberHeight, options) {
	options = options || {};
	CAL.Draw.call(this, centerX, centerY, numberWidth, numberHeight, options);

	this.image = new Image();
	this.source = source;
};
CAL.Image.prototype = Object.create(CAL.Draw.prototype);
CAL.Image.prototype.load = function (callback) {
	var scope = this;
	this.image.onload = function () {
		scope.loaded = true;

		scope.width = scope.image.width/scope.numberWidth;
		scope.height = scope.image.height/scope.numberHeight;

		if (callback !== undefined) {
			callback();
		}
	};
	this.image.src = this.source;
};

CAL.ImageLoader = function () {
	this.images = [];

	for (var i = 0; i < arguments.length; i ++) {
		var image = arguments[i];
		this.images.push(image);
	}
};
CAL.ImageLoader.prototype.add = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var image = arguments[i];
		if (this.images.indexOf(image) === -1) {
			this.images.push(image);
		}
	}
};
CAL.ImageLoader.prototype.remove = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var image = arguments[i];
		this.images.remove(image);
	}
};
CAL.ImageLoader.prototype.load = function (callback) {
	var imagesToLoad = this.images.length;
	for (var i = 0; i < this.images.length; i ++) {
		var image = this.images[i];
		image.load(function () {
			imagesToLoad --;
			if (imagesToLoad === 0 && callback !== undefined) {
				callback();
			}
		}, this);
	};
};

CAL.Color = function () {
	if (typeof arguments[0] === "number" && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
		this.r = arguments[0];
		this.g = arguments[1];
		this.b = arguments[2];
		this.a = typeof arguments[3] === "number" ? arguments[3] : 1;
	}
	else if (typeof arguments[0] === "number") {
		var hex = Math.floor(arguments[0]);

		this.r = hex >> 16 & 255;
		this.g = hex >> 8 & 255;
		this.b = hex & 255;
		this.a = 1;
	}
	else {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 1;
	}
};
CAL.Color.prototype.setStroke = function (context) {
	context.strokeStyle = "rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")";
};
CAL.Color.prototype.setFill = function (context) {
	context.fillStyle = "rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")";
};
CAL.Color.prototype.setColor = function (context) {
	this.setStroke(context);
	this.setFill(context);
};

CAL.Tween = function (object, attributes, duration, options) {
	options = options || {};
	this.visible = false;
	this.active = true;
	this.depth = -10000;

	this.object = object;
	this.attributes = attributes;
	this.timer = 0;
	this.duration = duration;
	this.easing = options.easing || CAL.Easings.linear;
	this.callback = options.callback;

	this.begin = {};
	for (var i in attributes) {
		this.begin[i] = this.object[i];
	}

	this.change = {};
	for (var i in attributes) {
		this.change[i] = attributes[i] - this.begin[i];
	}

	this.drawCanvas = options.drawCanvas !== undefined ? options.drawCanvas : true;
	this.clearCanvas = options.clearCanvas !== undefined ? options.clearCanvas : false;
};
CAL.Tween.prototype.start = function () {
	this.t = 0;
	this.active = true;
};
CAL.Tween.prototype.stop = function () {
	this.t = 0;
	this.active = false;
};
CAL.Tween.prototype.pause = function () {
	this.active = false;
};
CAL.Tween.prototype.resume = function () {
	this.active = true;
};
CAL.Tween.prototype.step = function (deltaTime, group) {
	this.timer += deltaTime;

	if (this.timer < this.duration) {

		for (var i in this.attributes) {
			var dt = this.timer;
			var d = this.duration;
			var b = this.begin[i];
			var c = this.change[i];
			
			this.object[i] = this.easing(dt, b, c, d);
		}
	}
	else {
		for (var i in this.attributes) {
			this.object[i] = this.attributes[i];
		}
		if (this.callback !== undefined) {
			this.callback();
		}
		group.remove(this);
	}

	if (this.clearCanvas) {
		group.clearCanvas = true;
	}
	if (this.drawCanvas) {
		group.drawCanvas = true;
	}
};

CAL.TimeLine = function (options) {
	options = options || {};
	
	this.visible = false;
	this.active = true;
	this.depth = -10000;

	this.moments = [];
	this.autoRemove = (options.autoRemove !== undefined) ? options.autoremove : true;
	this.loop = (options.loop !== undefined) ? options.loop : false;
	this.t = 0;

	CAL.Scene.add(this);
};
CAL.TimeLine.prototype = {
	addMoment: function (time, callback) {
		this.moments.push({
			time: time,
			callback: callback
		});
	},
	removeMoment: function (remove) {
		for (var i = 0; i < this.moments.length; i ++) {
			var moment = this.moments[i];

			if (moment === remove || moment.time === remove || moment.callback === remove) {
				this.moments.remove(moment);
			}
		}
	},
	start: function () {
		this.t = 0;
		this.active = true;
	},
	stop: function () {
		this.t = 0;
		this.active = false;
	},
	pause: function () {
		this.active = false;
	},
	resume: function () {
		this.active = true;
	},
	step: function (dt) {
		var newTime = this.t + dt;
		var remove = true;

		for (var i = 0; i < this.moments.length; i ++) {
			var moment = this.moments[i];
			if (moment.time >= this.t) {
				if (moment.time < newTime) {
					moment.callback();
				}
				else {
					remove = false;
				}
			}
		}

		if (remove && this.loop) {
			this.t = 0;
		}
		else if (remove && this.autoRemove) {
			CAL.Scene.remove(this);
		}
		this.t = newTime;
	}
};

CAL.Shape = function (options) {
	options = options || {};
	CAL.Matrix.call(this, options);

	this.visible = options.visible !== undefined ? options.visible : true;
	this.active = false;
	this.depth = options.depth || 0;
	this.lines = [];

	this.closePath = options.closePath !== undefined ? options.closePath : true;
	this.lineColor = options.lineColor !== undefined ? options.lineColor : new CAL.Color();
	this.shapeColor = options.shapeColor !== undefined ? options.shapeColor : new CAL.Color();
	this.lineWidth = options.lineWidth || 1;
	this.lineJoin = options.lineJoin || "miter";
	this.lineCap = options.lineCap || "square";

	this.points = options.points || [];
};
CAL.Shape.prototype = Object.create(CAL.Matrix.prototype);
CAL.Shape.prototype.addPoint = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var point = arguments[i];
		this.points.push(point);
	}
	//this.update();
};
CAL.Shape.prototype.hit = function (x, y) {

	for (var i = 0; i < this.points.length; i ++) {
		if (new CAL.Vector(x, y).subtract(this.points[i].applyMatrix(this)).dot(this.getNormal(i)) > 0) {
			return false;
		}
	}

	return true;
};
CAL.Shape.prototype.setContext = function (context, matrix) {
	var matrix = matrix || this;
	context.beginPath();
	for (var i = 0; i < this.points.length; i ++) {
		var point = this.points[i].applyMatrix(matrix);
		context.lineTo(point.x, point.y);
	}
	if (this.closePath) {
		context.closePath();
	}
};
CAL.Shape.prototype.getBoundingBox = function () {
	var minX = Infinity;
	var minY = Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;

	for (var i = 0; i < this.points.length; i ++) {
		var point = this.points[i];
		minX = point.x < minX ? point.x : minX;
		minY = point.y < minY ? point.y : minY;
		maxX = point.x > maxX ? point.x : maxX;
		maxY = point.y > maxY ? point.y : maxY;
	};

	return {x: minX, y: minY, width: maxX-minX, height: maxY-minY};
};
CAL.Shape.prototype.getNormal = function (i) {
	var pointA = this.points[(i+1)%this.points.length].applyMatrix(this);
	var pointB = this.points[i].applyMatrix(this);
	return pointA.subtract(pointB).normal().normalize();
};
CAL.Shape.prototype.clip = function (context, matrix) {
	this.setContext(context, matrix);
	context.clip();
};
CAL.Shape.prototype.fill = function (context, matrix) {
	this.setContext(context, matrix);

	this.shapeColor.setFill(context);

	context.fill();
};
CAL.Shape.prototype.stroke = function (context, matrix) {
	this.setContext(context, matrix);

	context.lineColor = this.lineColor;
	context.lineWidth = this.lineWidth;
	context.lineJoin = this.lineJoin;
	context.lineCap = this.lineCap;

	this.lineColor.setStroke(context);

	context.stroke();
};
CAL.Shape.prototype.draw = function (context, matrix) {
	this.setContext(context, matrix);

	if (this.shapeColor) {
		this.shapeColor.setFill(context);
		context.fill();
	}

	if (this.lineColor) {
		context.lineColor = this.lineColor;
		context.lineWidth = this.lineWidth;
		context.lineJoin = this.lineJoin;
		context.lineCap = this.lineCap;
		this.lineColor.setStroke(context);
		context.stroke();
	}
};

CAL.BezierPoint = function (position, controlPointA, controlPointB) {
	this.position = position || new CAL.Vector(0, 0);
	this.controlPointA = controlPointA || new CAL.Vector(0, 0);
	this.controlPointB = controlPointB || new CAL.Vector(0, 0);
}
CAL.BezierPoint.prototype.applyMatrix = function (matrix) {
	var position = this.position.applyMatrix(matrix);
	var controlPointA = this.controlPointA.applyMatrix(matrix);
	var controlPointB = this.controlPointB.applyMatrix(matrix);

	return new CAL.BezierPoint(position, controlPointA, controlPointB);
};
CAL.BezierPoint.prototype.draw = function (context) {
	var leftHandle = this.controlPointA.add(this.position);
	var rightHandle = this.controlPointB.add(this.position);

	context.strokeStyle = "#09F";

	context.beginPath();
	context.moveTo(leftHandle.x, leftHandle.y);
	context.lineTo(this.position.x, this.position.y);
	context.lineTo(rightHandle.x, rightHandle.y);
	context.stroke();

	context.beginPath();
	context.arc(this.position.x, this.position.y, 10, 0, Math.PI*2, true);
	context.stroke();

	context.beginPath();
	context.arc(leftHandle.x, leftHandle.y, 5, 0, Math.PI*2, true);
	context.stroke();

	context.beginPath();
	context.arc(rightHandle.x, rightHandle.y, 5, 0, Math.PI*2, true);
	context.stroke();	
};
/*CAL.Shape = function (options) {
	options = options || {};
	CAL.Matrix.call(this, options);

	this.visible = options.visible !== undefined ? options.visible : true;
	this.active = false;
	this.depth = options.depth || 0;

	this.closePath = options.closePath !== undefined ? options.closePath : true;
	this.lineColor = options.lineColor !== undefined ? options.lineColor : new CAL.Color();
	this.shapeColor = options.shapeColor !== undefined ? options.shapeColor : new CAL.Color();
	this.lineWidth = options.lineWidth || 1;
	this.lineJoin = options.lineJoin || "miter";
	this.lineCap = options.lineCap || "square";

	this.points = options.points || [];
	this.precision = options.precision || 3;

	this.lines = [];
	this.length = 0;
	this.closed = false;
}
CAL.Shape.prototype.init = function (group) {
	for (var i = 0; i < this.points.length; i ++) {
		var point = this.points[i];
		if (point instanceof CAL.Vector) {
			point = new CAL.BezierPoint(point);
		}
		this.points[i] = point;
	}

	this.update();
};
CAL.Shape.prototype.addPoint = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var point = arguments[i];

		if (point instanceof CAL.Vector) {
			point = new CAL.BezierPoint(point);
		}
		if (point instanceof CAL.BezierPoint) {
			this.points.push(point);
		}
	}

	this.update();
};
CAL.Shape.prototype.collisionBox = function (vec1, vec2) {
	for (var i = 0; i < this.lines.length; i ++) {
		var point = this.lines[i];

		if (point.x > vec1.x && point.y > vec1.y && point.x < vec2.x && point.y < vec2.y) {
			return true;
		}
	}
	return false;
};
CAL.Shape.prototype.getNormal = function (i) {
	var pointA = this.lines[(i+1)%this.lines.length].applyMatrix(this);
	var pointB = this.lines[i].applyMatrix(this);
	return pointA.subtract(pointB).normal().normalize();
};
CAL.Shape.prototype.collisionPoint = function (x, y) {
	for (var i = 0; i < this.lines.length; i ++) {
		if (new CAL.Vector(x, y).subtract(this.lines[i].applyMatrix(this)).dot(this.getNormal(i)) > 0) {
			return false;
		}
	}

	return true;
};
CAL.Shape.prototype.removePoint = function () {
	for (var i = 0; i < arguments.length; i ++) {

		var argument = arguments[i];

		if (typeof argument === "number") {
			var index = argument;
		}
		else if (argument instanceof CAL.BezierPoint || argument instanceof CAL.Vector) {
			var index = this.getPointIndex(argument);
		}

		if (index !== -1) {
			this.points.splice(index, 1);
		}
	}

	this.update();
};

CAL.Shape.prototype.getPointIndex = function (point) {
	if (point instanceof CAL.BezierPoint) {
		return this.points.indexOf(argument);
	}
	else if (point instanceof CAL.Vector) {
		for (i = 0; i < this.points.length; i ++) {
			var length = this.points[i].position.subtract(point).length();

			if (length === 0) {
				return i;
			}
		}
		return -1;
	}
};

CAL.Shape.prototype.numberPoints = function () {
	return this.points.length;
};

CAL.Shape.prototype.insertPoint = function (point, index) {
	if (point instanceof CAL.Vector) {
		point = new CAL.BezierPoint(point);
	}
	if (point instanceof CAL.BezierPoint) {
		this.points.splice(index, 0, point);

		this.update();
	}	
};
CAL.Shape.prototype.setClosed = function (closed) {
	this.closed = closed;
	this.update();
};

CAL.Shape.prototype.setPrecision = function (precision) {
	this.precision = precision;
	this.update();
};

CAL.Shape.prototype.makeSmooth = function (strength, start, end) {
	start = start || 0;
	end = end || this.points.length;

	if (this.closed === false) {
		start = Math.max(start, 1);
		end = Math.min(end, this.points.length-1);
	}
	else {
		start = Math.max(start, 0);
		end = Math.min(end, this.points.length);
	}

	for (var i = start; i < end; i ++) {
		var p0 = this.points[i-1];
		var p1 = this.points[i];
		var p2 = this.points[i+1];

		if (typeof(p0) === "undefined") {
			p0 = this.points[this.points.length-1];
		}
		else if (typeof(p2) === "undefined") {
			p2 = this.points[0];
		}

		var a = p0.position.subtract(p1.position);
		var b = p2.position.subtract(p1.position);

		var length = (a.length()+b.length())/4;

		var direction = a.normalize().add(b.scale(-1).normalize()).normalize();

		p1.controlPointA = direction.scale(length*strength);
		p1.controlPointB = direction.scale(-length*strength);
	}

	this.update();
};

CAL.Shape.prototype.calculateBezierPoints = function (p0, p1) {
	var array = [];

	if (p0.controlPointB.length() === 0 && p1.controlPointA.length() === 0) {
		var angle = p1.position.subtract(p0.position).angle();

		array.push({
			x: p0.position.x,
			y: p0.position.y,
			angle: angle
		}, {
			x: p1.position.x,
			y: p1.position.y,
			angle: angle
		});
	}
	else {
		var point = {
			x: p1.position.x,
			y: p1.position.y,
			angle: p1.controlPointB.direction()
		}

		array = array.concat(
			recursiveBezier(
				p0.position,
				p0.position.add(p0.controlPointB),
				p1.position.add(p1.controlPointA),
				p1.position,
				this.precision
			),
			[point]
		);
	}

	return array;
};

CAL.Shape.prototype.update = function () {
	if (this.points.length >= 2) {
		if (this.points[0].controlPointB.length() !== 0) {
			var point = {
				x: this.points[0].position.x,
				y: this.points[0].position.y,
				angle: this.points[0].controlPointB.direction()
			};
			this.lines = [point];
		}

		for (var i = 0; i < this.points.length-1; i ++) {
			var p0 = this.points[i];
			var p1 = this.points[i+1];

			this.lines = this.lines.concat(this.calculateBezierPoints(p0, p1));
		}

		if (this.closed === true) {

			var p0 = this.points[this.points.length-1];
			var p1 = this.points[0];

			this.lines = this.lines.concat(this.calculateBezierPoints(p0, p1));
		}

		var pathLength = 0;
		this.lines[0].position = 0;

		for (var i = 0; i < this.lines.length-1; i ++) {

			var p0 = this.lines[i];
			var p1 = this.lines[i+1];
			var line = new CAL.Vector(p1.x, p1.y).subtract(p0);
			pathLength += line.length();

			p1.position = pathLength;
		}
		 
		this.length = pathLength;
	}
};

CAL.Shape.prototype.getPosition = function (t) {
	var t = Math.max(Math.min(t, this.length), 0);

	for (var i = 1; true; i ++) {
		var p0 = this.lines[i-1];
		var p1 = this.lines[i];

		if (p1.position >= t) {
			t = (t-p0.position) / (p1.position-p0.position);

			var position = new CAL.Vector(p0.x, p0.y).scale(1-t).add(new CAL.Vector(p1.x, p1.y).scale(t));
			var angle = p0.angle + ((((p1.angle-p0.angle)%360)+540)%360-180)*t;

			return {
				x: position.x,
				y: position.y,
				angle: angle
			};
		}
	}
};

CAL.Shape.prototype.setContextPart = function (context, begin, end) {
	var beginPos = this.getPosition(begin);
	var endPos = this.getPosition(end);

	context.beginPath();
	context.moveTo(beginPos.x, beginPos.y);

	for (var i = 0; i < this.lines.length; i ++) {
		var line = this.lines[i];

		if (line.position > begin) {

			context.lineTo(line.x, line.y);
			if (line.position > end) {
				break;
			}
		}
	}
	context.lineTo(endPos.x, endPos.y);
};

CAL.Shape.prototype.setContext = function (context) {
	this.setContextPart(context, 0, this.length);
};

CAL.Shape.prototype.setClippingPart = function (context, begin, end) {
	context.save();
	this.setContextPart(begin, end);
	context.clip();
};

CAL.Shape.prototype.setClipping = function (context) {
	this.setClippingPart(context, 0, this.length);
};

CAL.Shape.prototype.drawPart = function (context, begin, end, color, width, cap) {
	this.setContextPart(context, begin, end);
	
	context.strokeStyle = color || "black";
	context.lineWidth = width || 1;
	context.lineCap = cap || 'butt';
	context.stroke();
};
CAL.Shape.prototype.setContext = function (context, matrix) {
	var matrix = matrix || this;
	context.beginPath();
	for (var i = 0; i < this.lines.length; i ++) {
		var point = this.lines[i]//.applyMatrix(matrix);
		context.lineTo(point.x, point.y);
	}
	if (this.closePath) {
		context.closePath();
	}
};

CAL.Shape.prototype.fill = function (context, matrix) {
	this.setContext(context, matrix);

	this.shapeColor.setFill(context);

	context.fill();
};
CAL.Shape.prototype.stroke = function (context, matrix) {
	this.setContext(context, matrix);
	context.lineColor = this.lineColor;
	context.lineWidth = this.lineWidth;
	context.lineJoin = this.lineJoin;
	context.lineCap = this.lineCap;

	this.lineColor.setStroke(context);

	context.stroke();
};

CAL.Shape.prototype.draw = function (context, matrix) {
	if (this.shapeColor) {
		this.shapeColor.setFill(context);
		context.fill();
	}

	if (this.lineColor) {
		this.stroke(context, matrix);
	}
	this.debugDraw(context);
};
CAL.Shape.prototype.debugDraw = function (context) {
	context.beginPath();
	context.lineWidth = 1;

	for (var i = 0; i < this.points.length; i ++) {
		var point = this.points[i];

		point.draw(context);
	}

	context.beginPath();

	for (var i = 0; i < this.lines.length; i ++) {
		var point = this.lines[i];

		context.lineTo(point.x, point.y);
		context.arc(point.x, point.y, 2, 0, Math.PI*2, true);
		context.lineTo(point.x, point.y);
	}

	context.strokeStyle = "black";
	context.stroke();
};

CAL.Shape.prototype.getSize = function () {
	var width = 0;
	var height = 0;

	for (var i = 0; i < this.lines.length; i ++) {
		var line = this.lines[i];

		width = Math.max(width, Math.ceil(line.x));
		height = Math.max(width, Math.ceil(line.y));
	}

	return {
		width: width,
		height: height
	};
};


CAL.BezierPoint = function (position, controlPointA, controlPointB) {
	this.position = position || new CAL.Vector(0, 0);
	this.controlPointA = controlPointA || new CAL.Vector(0, 0);
	this.controlPointB = controlPointB || new CAL.Vector(0, 0);
}
CAL.BezierPoint.prototype.applyMatrix = function (matrix) {
	var position = this.position.applyMatrix(matrix);
	var controlPointA = this.controlPointA.applyMatrix(matrix);
	var controlPointB = this.controlPointB.applyMatrix(matrix);

	return new CAL.BezierPoint(position, controlPointA, controlPointB);
};
CAL.BezierPoint.prototype.draw = function (context) {
	var leftHandle = this.controlPointA.add(this.position);
	var rightHandle = this.controlPointB.add(this.position);

	context.strokeStyle = "#09F";

	context.beginPath();
	context.moveTo(leftHandle.x, leftHandle.y);
	context.lineTo(this.position.x, this.position.y);
	context.lineTo(rightHandle.x, rightHandle.y);
	context.stroke();

	context.beginPath();
	context.arc(this.position.x, this.position.y, 10, 0, Math.PI*2, true);
	context.stroke();

	context.beginPath();
	context.arc(leftHandle.x, leftHandle.y, 5, 0, Math.PI*2, true);
	context.stroke();

	context.beginPath();
	context.arc(rightHandle.x, rightHandle.y, 5, 0, Math.PI*2, true);
	context.stroke();	
};

function recursiveBezier (p1, p2, p3, p4, precision) {
	//source: http://antigrain.com/research/adaptive_bezier/
	//source: http://en.wikipedia.org/wiki/B%C3%A9zier_curve#Derivative

	var p12 = p1.add(p2).scale(0.5);
	var p23 = p2.add(p3).scale(0.5);
	var p34 = p3.add(p4).scale(0.5);
	var p123 = p12.add(p23).scale(0.5);
	var p234 = p23.add(p34).scale(0.5);
	var p1234 = p123.add(p234).scale(0.5);

	var d = p4.subtract(p1);

	var d2 = Math.abs((p2.x - p4.x) * d.y - (p2.y - p4.y) * d.x);
	var d3 = Math.abs((p3.x - p4.x) * d.y - (p3.y - p4.y) * d.x);

	//if (Math.abs(p1.x + p3.x - p2.x - p2.x) + Math.abs(p1.y + p3.y - p2.y - p2.y) + Math.abs(p2.x + p4.x - p3.x - p3.x) + Math.abs(p2.y + p4.y - p3.y - p3.y) <= precision) {
	if (Math.pow((d2 + d3), 2) < precision * d.dot(d)) {

		//var t = 0.5;
		//var derivative = (p2.subtract(p1)).scale(Math.pow(3*(1-t), 2)).add((p3.subtract(p2)).scale(6*(1-t)*t)).add((p4.subtract(p3)).scale(Math.pow(3*t, 2)));
		var derivative = (p2.subtract(p1)).scale(2.25).add((p3.subtract(p2)).scale(1.5)).add((p4.subtract(p3)).scale(2.25));

		var point = {
			x: p1234.x,
			y: p1234.y,
			angle: derivative.direction()
		}

		return [point];
	}
	else {

		return [].concat(
			recursiveBezier(p1, p12, p123, p1234, precision),
			recursiveBezier(p1234, p234, p34, p4, precision)
		);
	}
}*/

CAL.Text = function (options) {
	options = options || {};
	CAL.Matrix.call(this, options);

	this.visible = options.visible !== undefined ? options.visible : true;
	this.active = options.active !== undefined ? options.active : true;
	this.depth = options.depth || 0;
	this.text = options.text || "";
	this.style = options.style || "normal";
	this.variant = options.variant || "normal";
	this.weight = options.weight || "normal";
	this.size = options.size || 12;
	this.font = options.font || "Arial";

	this.textAlign = options.textAlign || "left";

	this.color = options.color || new CAL.Color();
	this.alpha = typeof options.alpha === "number" ? options.alpha : 1;
};
CAL.Text.prototype = Object.create(CAL.Matrix.prototype);
CAL.Text.prototype.drawText = function (context, text, x, y) {
	context.font = [this.style, this.variant, this.weight, this.size+"px", this.font].join(" ");
	context.textAlign = this.textAlign;
	this.color.setColor(context);
	context.fillText(text, x, y);
};
CAL.Text.prototype.drawTextAlpha = function (context, text, x, y, apha) {
	context.font = [this.style, this.variant, this.weight, this.size+"px", this.font].join(" ");
	context.globalAlpha = apha;
	this.color.setColor(context);
	context.fillText(text, x, y);
	context.globalAlpha = 1;
};
CAL.Text.prototype.draw = function (context, matrix) {
	context.save();
	matrix.setContext(context);
	context.globalAlpha = this.alpha;
	this.drawText(context, this.text, 0, 0);
	context.restore();
};
CAL.Text.prototype.clone = function () {
	return new CAL.text({
		style : this.style,
		variant : this.variant,
		weight : this.weight,
		size : this.size,
		font : this.font,
		color : this.color.clone()
	});
};

CAL.KeyListener = function (options) {
	options = options || {};

	this.visible = false;
	this.active = options.active !== undefined ? option.active : true;
	this.depth = -10000;

	this.actions = options.actions || {};

	CAL.Scene.add(this);
};
CAL.KeyListener.prototype.add = function (key, callback) {
	this.actions[key] = callback;
};
CAL.KeyListener.prototype.keyDown = function (key) {
	if (this.actions[key]) {
		this.actions[key]();
	}
};

CAL.Physics = function () {
	CAL.Scene.add(this);
	this.depth = -1000;
	this.active = true;
	this.visible = false;

	this.objects = [];
	this.manifolds = [];
	this.forces = [];
}
CAL.Physics.prototype.keyDown = function () {
	//DEBUG REASONS
	//EASIER TO DEBUG ON KEYDOWN

	CAL.Scene.clear();

	this.test(120);

	polygon.debugDraw(CAL.Scene.context);
	box.debugDraw(CAL.Scene.context);

};
CAL.Physics.prototype.add = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var object = arguments[i];

		if (object instanceof CAL.PhysicsObject && this.objects.indexOf(object) === -1) {
			for (var j = 0; j < this.objects.length; j ++) {
				this.manifolds.push(new CAL.Manifold(object, this.objects[j]));
				this.manifolds.push(new CAL.Manifold(this.objects[j], object));
			}

			this.objects.push(object);
		}
		else if (object instanceof CAL.Force && this.forces.indexOf(object) === -1) {
			this.forces.push(object);
		}
	}
};
CAL.Physics.prototype.test = function (dt) {
	//var dt = 120;

	this.objects.foreach(function (object) {
		object.step(dt);
	}, this);

	this.forces.foreach(function (force) {
		force.step(dt);
	}, this);

	this.manifolds.foreach(function (manifold) {
		manifold.step(dt);
	}, this);

};

CAL.Manifold = function (a, b) {
	this.a = a;
	this.b = b;

	this.normal;
};
CAL.Manifold.prototype.checkCollision = function (dt) {
	var collisionData = {collision: false};

	this.b.shape.points.foreach(function (pointA, i) {
		var pointA = pointA.applyMatrix(this.b.shape);
		var collision = true;
		var bestDistance = -Infinity;
		var bestNormal;

		this.a.shape.points.foreach(function (pointB, j) {
			var pointB = pointB.applyMatrix(this.a.shape);
			var normal = this.a.shape.getNormal(j);
			var distance = normal.dot(pointA.subtract(pointB));

			if (distance > 0) {
				collision = false;
				return true;
			}
			else if (distance > bestDistance) {
				bestDistance = distance;
				bestNormal = normal;
			}
		}, this);

		if (collision) {
			collisionData = {collision: true, penetrationDepth: -bestDistance, normal: bestNormal, impactPoint: pointA};

			return true;
		}

	}, this);

	return collisionData;

	/*this.a.shape.points.foreach(function (point, i) {
		var normal = this.a.shape.getNormal(i);
		var support = this.b.getSupport(normal.scale(-1));

		var point = point.applyMatrix(this.a.shape);
		var distance = normal.dot(support.subtract(point));

		//if (distance > 0) {
		//	console.log("test");
		//	bestDistance = 1;
		//	return true;
		//}
		if (distance > bestDistance || bestDistance === false) {

			//var velocity = this.b.velocity.add(this.b.getPointVelocity(support));
			//if (velocity.dot(normal) < 0 || velocity.length === 0) {

				bestDistance = distance;
				bestNormal = normal;
				bestImpactPoint = support;
				//bestVelocity = velocity;
			//}
		}
	}, this);

	var i = 2;
	var normal = this.a.shape.getNormal(i);
	normal.scale(100).draw(CAL.Scene.context, 200, 200);
	var support = this.b.getSupport(normal.scale(-1));

	var point = this.a.shape.points[i].applyMatrix(this.a.shape);
	var distance = normal.dot(support.subtract(point));

	console.log(distance);

	CAL.Scene.context.beginPath();
	CAL.Scene.context.arc(support.x, support.y, 10, 0, Math.PI*2);
	CAL.Scene.context.stroke();

	return {collision: bestDistance < 0, penetrationDepth: bestDistance, normal: bestNormal, impactPoint: bestImpactPoint};*/
};
CAL.Manifold.prototype.positionalCorrection = function (collisionData) {
	var percent = 0.2; // usually 20% to 80%
	var slop = 0.1; // usually 0.01 to 0.1

	var correction = collisionData.normal.scale(Math.max(collisionData.penetrationDepth - slop, 0) / (1/this.a.mass + 1/this.b.mass) * percent);

	var aPos = correction.scale(1/this.a.mass);
	this.a.shape._x += aPos.x;
	this.a.shape._y += aPos.y;
	this.a.shape.updateMatrix();

	var bPos = correction.scale(1/this.b.mass);
	this.b.shape._x -= bPos.x;
	this.b.shape._y -= bPos.y;
	this.b.shape.updateMatrix();
};
CAL.Manifold.prototype.resolveCollision = function (collisionData) {
	var restVelocity = this.b.velocity.subtract(this.a.velocity);

	var velAlongNormal = restVelocity.dot(collisionData.normal);
	if (velAlongNormal > 0) {
		return;
	}
	var restitution = Math.min(this.a.restitution, this.b.restitution);

	var force = -(1 + restitution) * velAlongNormal / (1/this.a.mass + 1/this.b.mass);

	var impulse = collisionData.normal.scale(force);
	
	this.a.addForce(impulse.scale(-1), collisionData.impactPoint);
	this.b.addForce(impulse, collisionData.impactPoint);
};
CAL.Manifold.prototype.step = function (dt) {
	var collisionData = this.checkCollision();

	if (collisionData.collision) {
		this.resolveCollision(collisionData);
		this.positionalCorrection(collisionData);
	}
};

CAL.PhysicsObject = function (options) {
	options = options || {};

	this.shape = options.shape || new CAL.Shape();
	this.velocity = options.velocity || new CAL.Vector();
	this.angularVelocity = options.angularVelocity !== undefined ? options.angularVelocity : 0;
	this.restitution = options.restitution !== undefined ? options.restitution : 0.5;
	this.density = options.density || 1;
	this.updateMass();
};
CAL.PhysicsObject.prototype.calculateBoundingBox = function (matrix) {
	matrix = matrix || this.shape;

	var minX = Infinity;
	var minY = Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;
	this.shape.points.foreach(function (point) {
		var point = point.applyMatrix(matrix);

		minX = (point.x < minX) ? point.x : minX;
		minY = (point.y < minY) ? point.y : minY;
		maxX = (point.x > maxX) ? point.x : maxX;
		maxY = (point.y > maxY) ? point.y : maxY;
	}, this);

	return {minX: minX, minY: minY, maxX: maxX, maxY: maxY};
};
CAL.PhysicsObject.prototype.addForce = function (impulse, contactVector) {
	this.velocity = this.velocity.add(impulse.scale(1.0/this.mass));

	/*if (contactVector !== undefined) {
		this.angularVelocity += contactVector.subtract(this.centerOfMass.applyMatrix(this.shape)).cross(impulse)*(1.0/this.inertia);
		//this.angularVelocity = contactVector.subtract(this.centerOfMass.applyMatrix(this.shape)).cross(impulse)*(1.0/this.inertia);
	}*/
};
CAL.PhysicsObject.prototype.pointCollision = function (point) {
	var point = point
		.subtract(new CAL.Vector(this.shape.x, this.shape.y))
		.rotate(-this.shape.rotation)
		.multiply(new CAL.Vector(1/this.shape.sx, 1/this.shape.sy))
		.subtract(new CAL.Vector(this.collisionMask.offsetX, this.collisionMask.offsetY));

	if (point.x < 0) return false;
	if (point.y < 0) return false;
	if (point.x > this.collisionMask.width) return false;
	if (point.y > this.collisionMask.height) return false;

	var i = Math.round(point.y)*this.collisionMask.width + Math.round(point.x);
	return this.collisionMask.data[i];
};
CAL.PhysicsObject.prototype.setDensity = function (density) {
	this.density = density;
	this.mass = this.area*density;
	this.inertia = this.mass*this.area;
};
CAL.PhysicsObject.prototype.updateMass = function () {
	var boundingBox = this.calculateBoundingBox(new CAL.Matrix());
	var surface = new CAL.Surface({x: boundingBox.maxX - boundingBox.minX, y: boundingBox.maxY - boundingBox.minY});
	this.shape.clip(surface.context, new CAL.Matrix({x: -boundingBox.minX, y: -boundingBox.minY}));
	surface.context.fillStyle = "black";
	surface.context.fillRect(0, 0, surface.width, surface.height);

	var imageData = surface.getImageData();

	var point = new CAL.Vector();
	var area = 0;
	this.collisionMask = {
		data: [],
		width: imageData.width,
		height: imageData.height,
		offsetX: boundingBox.minX,
		offsetY: boundingBox.minY
	};
	for (var i = 0; i < imageData.data.length; i += 4) {
		var alpha = imageData.data[i + 3];
		if (alpha > 0) {
			point = point.add(new CAL.Vector(i/4 % imageData.width, Math.floor(i/4/imageData.width)));
			area ++;
			this.collisionMask.data.push(true);
		}
		else {
			this.collisionMask.data.push(false);
		}
	}
	this.area = area/**this.sx*this.sy*/;
	this.mass = area*this.density;
	this.inertia = this.mass*area;
	this.centerOfMass = point.scale(1/area).add(new CAL.Vector(boundingBox.minX, boundingBox.minY));
};
CAL.PhysicsObject.prototype.getSupport = function (n) {
	var bestProjection = -Infinity;
	var bestPoint;

	for (var i = 0; i < this.shape.points.length; i ++) {
		var point = this.shape.points[i].applyMatrix(this.shape);
		var projection = point.dot(n);

		if (projection > bestProjection) {
			bestPoint = point;
			bestProjection = projection;
		}
	}

	return bestPoint;
};
CAL.PhysicsObject.prototype.getPointVelocity = function (point) {

	var relativePoint = point.subtract(this.centerOfMass.applyMatrix(this.shape));
	var rotatedPoint = relativePoint.rotate(this.angularVelocity);

	return rotatedPoint.subtract(relativePoint);
};
CAL.PhysicsObject.prototype.findCollisionFace = function (point) {

};
CAL.PhysicsObject.prototype.step = function (dt) {
	//this.rotateAroundRelative(this.torque*dt, this.centerOfMass);

	//this.angularVelocity += torque * (1.0 / this.inertia) * dt

	/*if (this.velocity.length < 0.0001) {
		this.velocity = new CAL.Vector();
	}
	if (Math.abs(this.angularVelocity) < 0.00001) {
		this.angularVelocity = 0;
	}*/

	this.shape._x += this.velocity.x*dt;
	this.shape._y += this.velocity.y*dt;
	this.shape.updateMatrix();

	//this.shape.rotateAroundRelative(this.angularVelocity*dt, this.centerOfMass);
};

CAL.PhysicsObject.prototype.debugDraw = function (context) {
	context.lineWidth = 1;
	context.strokeStyle = "black";

	var minX = Infinity;
	var minY = Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;
	context.beginPath();
	this.shape.points.foreach(function (point) {
		var point = point.applyMatrix(this.shape);

		context.lineTo(point.x, point.y);
		context.arc(point.x, point.y, 3, 0, 2*Math.PI*2);
		context.lineTo(point.x, point.y);

		minX = (point.x < minX) ? point.x : minX
		minY = (point.y < minY) ? point.y : minY
		maxX = (point.x > maxX) ? point.x : maxX
		maxY = (point.y > maxY) ? point.y : maxY
	}, this);
	context.closePath();
	context.stroke();

	this.shape.points.foreach(function (point, i) {
		var point = point.applyMatrix(this.shape);
		var text = new CAL.Text();
		text.drawText(context, i, point.x + 10, point.y - 10);
		//this.getPointVelocity(point).scale(1000).draw(context, point.x, point.y);
	}, this);


	context.beginPath();
	context.moveTo(minX, minY);
	context.lineTo(minX, maxY);
	context.lineTo(maxX, maxY);
	context.lineTo(maxX, minY);
	context.closePath();

	var centerOfMass = this.centerOfMass.applyMatrix(this.shape);
	context.moveTo(centerOfMass.x-5, centerOfMass.y-5);
	context.lineTo(centerOfMass.x+5, centerOfMass.y+5);
	context.moveTo(centerOfMass.x+5, centerOfMass.y-5);
	context.lineTo(centerOfMass.x-5, centerOfMass.y+5);
	context.strokeStyle = "red";
	context.stroke();

	var center = this.centerOfMass.applyMatrix(this.shape);
	this.velocity.scale(1000).draw(context, center.x, center.y);
};

CAL.Force = function (options) {

	this.objects = options.objects || [];
	this.velocity = options.velocity || new CAL.Vector();
}
CAL.Force.prototype.add = function () {
	for (var i = 0; i < arguments.length; i ++) {
		var argument = arguments[i];

		this.objects.push(argument);
	}
};
CAL.Force.prototype.step = function (dt) {
	
	for (var i = 0; i < this.objects.length; i ++) {
		var object = this.objects[i];

		object.velocity = object.velocity.add(this.velocity.scale(dt));
	}
};
