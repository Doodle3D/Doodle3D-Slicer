//canvas cheat sheet
//http://cheatsheetworld.com/programming/html5-canvas-cheat-sheet/

//TODO
//Global Composite Operation
//Linear Gradient
//Radial Gradient

"use strict";

var CAL = {
	name: "Canvas Abstraction Layer",
	version: "1.0",
	author: "Casper Lamboo",
	contact: "casperlamboo@gmail.com"
};

CAL.Math = {
	clamb: function clamb(value, min, max) {
		"use strict";

		return value > min ? value < max ? value : max : min;
	},
	randomInt: function randomInt(min, max) {
		"use strict";

		return Math.floor(CAL.Math.random(min, max + 1));
	},
	random: function random(min, max) {
		"use strict";

		min = min === undefined ? 0 : min;
		max = max === undefined ? 1 : max;

		return Math.random() * (max - min) + min;
	},
	sign: function sign(value) {
		"use strict";

		return value > 0 ? 1 : value < 0 ? -1 : 0;
	},
	lineCollision: function lineCollision(v1, v2, v3, v4) {
		"use strict";

		//bron: http://mathworld.wolfram.com/Line-LineIntersection.html
		var intersection = new CAL.Vector(((v1.x * v2.y - v1.y * v2.x) * (v3.x - v4.x) - (v1.x - v2.x) * (v3.x * v4.y - v3.y * v4.x)) / ((v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x)), ((v1.x * v2.y - v1.y * v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x * v4.y - v3.y * v4.x)) / ((v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x)));

		var line1 = v1.subtract(v2).length();
		var line2 = v3.subtract(v4).length();

		var a = line1 >= v1.subtract(intersection).length();
		var b = line1 >= v2.subtract(intersection).length();
		var c = line2 >= v3.subtract(intersection).length();
		var d = line2 >= v4.subtract(intersection).length();

		return a && b && c && d ? intersection : false;
	}
};

CAL.Easings = {
	bounceEaseOut: function bounceEaseOut(dt, b, c, d) {
		"use strict";

		if ((dt /= d) < 1 / 2.75) {
			return c * (7.5625 * dt * dt) + b;
		} else if (dt < 2 / 2.75) {
			return c * (7.5625 * (dt -= 1.5 / 2.75) * dt + 0.75) + b;
		} else if (dt < 2.5 / 2.75) {
			return c * (7.5625 * (dt -= 2.25 / 2.75) * dt + 0.9375) + b;
		} else {
			return c * (7.5625 * (dt -= 2.625 / 2.75) * dt + 0.984375) + b;
		}
	},
	easeIn: function easeIn(dt, b, c, d) {
		"use strict";

		return c * (dt /= d) * dt + b;
	},
	easeOut: function easeOut(dt, b, c, d) {
		"use strict";

		return -c * (dt /= d) * (dt - 2) + b;
	},
	easeInOut: function easeInOut(dt, b, c, d) {
		"use strict";

		if ((dt /= d / 2) < 1) {
			return c / 2 * dt * dt + b;
		}
		return -c / 2 * (--dt * (dt - 2) - 1) + b;
	},
	strongEaseIn: function strongEaseIn(dt, b, c, d) {
		"use strict";

		return c * (dt /= d) * dt * dt * dt * dt + b;
	},
	strongEaseOut: function strongEaseOut(dt, b, c, d) {
		"use strict";

		return c * ((dt = dt / d - 1) * dt * dt * dt * dt + 1) + b;
	},
	strongEaseInOut: function strongEaseInOut(dt, b, c, d) {
		"use strict";

		if ((dt /= d / 2) < 1) {
			return c / 2 * dt * dt * dt * dt * dt + b;
		}
		return c / 2 * ((dt -= 2) * dt * dt * dt * dt + 2) + b;
	},
	linear: function linear(dt, b, c, d) {
		"use strict";

		return c * dt / d + b;
	}
};

/*Object.prototype.clone = function () {
	'use strict';

	var object = {};
	for (var i in this) {
		if (this[i] && this.hasOwnProperty(i)) {
			var element = this[i];

			if (element.hasOwnProperty('clone')) {
				console.log(element);
			}

			object[i] = element.hasOwnProperty('clone') ? element.clone() : element;
		}
	}
	return object;
};

String.prototype.clone = Boolean.prototype.clone = Number.prototype.clone = Function.prototype.clone = null;

//doesn't clone it actualy
Uint16Array.prototype.clone = function () {
	'use strict';

	var array = new Uint16Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Uint32Array.prototype.clone = function () {
	'use strict';

	var array = new Uint32Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Uint8Array.prototype.clone = function () {
	'use strict';

	var array = new Uint8Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Uint8ClampedArray.prototype.clone = function () {
	'use strict';

	var array = new Uint8ClampedArray(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Int16Array.prototype.clone = function () {
	'use strict';

	var array = new Int16Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Int32Array.prototype.clone = function () {
	'use strict';

	var array = new Int32Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Int8Array.prototype.clone = function () {
	'use strict';

	var array = new Int8Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Float32Array.prototype.clone = function () {
	'use strict';

	var array = new Float32Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};
Float64Array.prototype.clone = function () {
	'use strict';

	var array = new Float64Array(this.length);
	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};*/

Array.prototype.max = function () {
	"use strict";

	var max = -Infinity;
	for (var i = 0; i < this.length; i++) {
		var element = this[i];

		if (element > max) {
			max = element;
		}
	};
	return max;
};
Array.prototype.min = function () {
	"use strict";

	var min = Infinity;
	for (var i = 0; i < this.length; i++) {
		var element = this[i];

		if (element < min) {
			min = element;
		}
	};
	return min;
};
Array.prototype.clone = function () {
	"use strict";

	var array = [];
	for (var i = 0; i < this.length; i++) {
		var element = this[i];

		array.push(element.clone !== undefined ? element.clone() : element);
	};
	return array;
};
Array.prototype.remove = function (element) {
	"use strict";

	var index = this.indexOf(element);
	if (index !== -1) {
		this.splice(index, 1);
	}

	return index;
};

var requestAnimFrame = (function () {
	"use strict";

	return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || function (callback) {
		setTimeout(callback, 1000 / 60);
	};
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.Vector = (function () {
	var _class = function _class(x, y) {
		_classCallCheck(this, _class);

		this.x = x || 0;
		this.y = y || 0;
	};

	_createClass(_class, [{
		key: "identity",
		value: function identity(x, y) {
			this.x = 0;
			this.y = 0;

			return this;
		}
	}, {
		key: "set",
		value: function set(x, y) {
			this.x = x;
			this.y = y;

			return this;
		}
	}, {
		key: "copy",
		value: function copy(vector) {
			this.x = vector.x;
			this.y = vector.y;

			return this;
		}
	}, {
		key: "add",
		value: function add(vector) {
			var x = this.x + vector.x;
			var y = this.y + vector.y;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "subtract",
		value: function subtract(vector) {
			var x = this.x - vector.x;
			var y = this.y - vector.y;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "scale",
		value: function scale(scalar) {
			var x = this.x * scalar;
			var y = this.y * scalar;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "rotate",
		value: function rotate(angle) {
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);

			var x = cos * this.x - sin * this.y;
			var y = sin * this.x + cos * this.y;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "multiply",
		value: function multiply(vector) {
			var x = this.x * vector.x;
			var y = this.y * vector.y;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "setLength",
		value: function setLength(length) {
			return new CAL.Vector(this.x, this.y).normalize().scale(length);
		}
	}, {
		key: "length",
		value: function length() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}
	}, {
		key: "normal",
		value: function normal() {
			return new CAL.Vector(this.y, -this.x);
		}
	}, {
		key: "normalize",
		value: function normalize() {
			var length = this.length();

			var x = this.x / length;
			var y = this.y / length;

			return new CAL.Vector(x, y);
		}
	}, {
		key: "angle",
		value: function angle() {
			return Math.atan2(this.y, this.x);
		}
	}, {
		key: "dot",
		value: function dot(vector) {
			return this.x * vector.x + this.y * vector.y;
		}
	}, {
		key: "cross",
		value: function cross(vector) {
			return this.x * vector.y - this.y * vector.x;
		}
	}, {
		key: "round",
		value: function round() {
			var x = Math.round(this.x);
			var y = Math.round(this.y);

			return new CAL.Vector(x, y);
		}
	}, {
		key: "applyMatrix",
		value: function applyMatrix(matrix) {
			var m = matrix.matrix;

			var x = m[0] * this.x + m[1] * this.y + m[2];
			var y = m[3] * this.x + m[4] * this.y + m[5];

			return new CAL.Vector(x, y);
		}
	}, {
		key: "distanceTo",
		value: function distanceTo(vector) {
			return this.subtract(vector).length();
		}
	}, {
		key: "clone",
		value: function clone() {
			return new CAL.Vector(this.x, this.y);
		}
	}, {
		key: "equals",
		value: function equals(vector) {
			return this.x === vector.x && this.y === vector.y;
		}
	}, {
		key: "draw",
		value: function draw(context, x, y) {
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
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.Matrix = (function () {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		if (options === undefined) {
			this.identity();
		} else if (options instanceof Array) {
			this.matrix = options;
		} else {
			if (options.matrix !== undefined) {
				this.matrix = options.matrix;
			}
			if (options.x !== undefined) {
				this._x = options.x;
			}
			if (options.y !== undefined) {
				this._y = options.y;
			}
			if (options.sx !== undefined) {
				this._sx = options.sx;
			}
			if (options.sy !== undefined) {
				this._sy = options.sy;
			}
			if (options.rotation !== undefined) {
				this._rotation = options.rotation;
			}

			if (this._matrix === undefined) {
				this._x = this._x || 0;
				this._y = this._y || 0;
				this._sx = this._sx !== undefined ? this._sx : 1;
				this._sy = this._sy !== undefined ? this._sy : 1;
				this._rotation = this._rotation || 0;
			}
		}
	};

	_createClass(_class, [{
		key: "identity",
		value: function identity() {
			this._matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

			this._x = 0;
			this._y = 0;
			this._sx = 1;
			this._sy = 1;
			this._rotation = 0;

			return this;
		}
	}, {
		key: "_updateMatrix",
		value: function _updateMatrix() {
			var sin = Math.sin(this._rotation);
			var cos = Math.cos(this._rotation);

			this._matrix = [this._sx * cos, this._sy * -sin, this._x, this._sx * sin, this._sy * cos, this._y, 0, 0, 1];

			this._x = this._matrix[2];
			this._y = this._matrix[5];
		}
	}, {
		key: "multiplyMatrix",
		value: function multiplyMatrix(m) {
			var a = this.matrix;
			var b = m.matrix;
			var translation = new CAL.Vector(b[2], b[5]).applyMatrix(this);

			return new CAL.Matrix([a[0] * b[0] + a[3] * b[1] + a[6] * b[2], a[1] * b[0] + a[4] * b[1] + a[7] * b[2], a[2] * b[0] + a[5] * b[1] + a[8] * b[2], a[0] * b[3] + a[3] * b[4] + a[6] * b[5], a[1] * b[3] + a[4] * b[4] + a[7] * b[5], a[2] * b[3] + a[5] * b[4] + a[8] * b[5], a[0] * b[6] + a[3] * b[7] + a[6] * b[8], a[1] * b[6] + a[4] * b[7] + a[7] * b[8], a[2] * b[6] + a[5] * b[7] + a[8] * b[8]]);
		}
	}, {
		key: "inverseMatrix",
		value: function inverseMatrix() {
			var m = this.matrix;

			var det = 1 / (m[0] * m[4] * m[8] + m[1] * m[5] * m[6] + m[2] * m[3] * m[7] - m[1] * m[3] * m[8] - m[0] * m[5] * m[7] - m[2] * m[4] * m[6]);

			return new CAL.Matrix([det * (m[4] * m[8] - m[5] * m[7]), -det * (m[1] * m[8] - m[2] * m[7]), det * (m[1] * m[5] - m[2] * m[4]), -det * (m[3] * m[8] - m[5] * m[6]), det * (m[0] * m[8] - m[2] * m[6]), -det * (m[0] * m[5] - m[2] * m[3]), det * (m[3] * m[7] - m[4] * m[6]), -det * (m[0] * m[7] - m[1] * m[6]), det * (m[0] * m[4] - m[1] * m[3])]);

			/*var m = this._matrix;
   	var det = 1 / (m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7] - m[2]*m[4]*m[6] - m[0]*m[5]*m[7] - m[1]*m[3]*m[8]);
   	return new CAL.Matrix([
   	det * (m[4]*m[8] - m[5]*m[7]),
   	det * (m[3]*m[8] - m[5]*m[6]),
   	det * (m[3]*m[7] - m[4]*m[6]),
   		det * (m[1]*m[8] - m[2]*m[7]),
   	det * (m[0]*m[8] - m[2]*m[6]),
   	det * (m[0]*m[7] - m[1]*m[6]),
   		det * (m[1]*m[5] - m[2]*m[4]), 
   	det * (m[0]*m[5] - m[2]*m[3]), 
   	det * (m[0]*m[4] - m[1]*m[3])
   ]);*/
		}
	}, {
		key: "translate",
		value: function translate(x, y) {
			this.x += x;
			this.y += y;

			return this;
		}
	}, {
		key: "setMatrix",
		value: function setMatrix(matrix) {
			this._matrix = matrix.matrix;
			this._x = matrix.x;
			this._y = matrix.y;
			this._sx = matrix.sx;
			this._sy = matrix.sy;
			this._rotation = matrix.rotation;

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}

			return this;
		}
	}, {
		key: "setMatrixContext",
		value: function setMatrixContext(context) {
			var m = this.matrix;
			context.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
		}
	}, {
		key: "rotateAroundAbsolute",
		value: function rotateAroundAbsolute(angle, center) {
			this.rotateAroundRelative(angle, center.applyMatrix(this.inverseMatrix()));

			return this;
		}
	}, {
		key: "rotateAroundRelative",
		value: function rotateAroundRelative(angle, center) {
			if (angle !== 0) {
				var before = center.applyMatrix(this);

				this.rotation = angle;

				var after = center.applyMatrix(this);

				var offset = before.subtract(after);

				this.x += offset.x;
				this.y += offset.y;
			}

			return this;
		}
	}, {
		key: "scaleAroundAbsolute",
		value: function scaleAroundAbsolute(sx, sy, center) {
			this.scaleAroundRelative(sx, sy, center.applyMatrix(this.inverseMatrix()));

			return this;
		}
	}, {
		key: "scaleAroundRelative",
		value: function scaleAroundRelative(sx, sy, center) {
			var before = center.applyMatrix(this);

			this.sx = sx;
			this.sy = sy;

			var after = center.applyMatrix(this);

			var offset = before.subtract(after);

			this.x += offset.x;
			this.y += offset.y;

			return this;
		}
	}, {
		key: "clone",
		value: function clone() {
			var m = {};

			if (this._matrix !== undefined) {
				m.matrix = this._matrix;
			}
			if (this._x !== undefined) {
				m.x = this._x;
			}
			if (this._y !== undefined) {
				m.y = this._y;
			}
			if (this._rotation !== undefined) {
				m.rotation = this._rotation;
			}
			if (this._sx !== undefined) {
				m.sx = this._sx;
			}
			if (this._sy !== undefined) {
				m.sy = this._sy;
			}

			return new CAL.Matrix(m);
		}
	}, {
		key: "sx",
		get: function get() {
			if (this._sx === undefined) {
				this._sx = /*CAL.Math.sign(this._matrix[0]) * */Math.sqrt(Math.pow(this._matrix[0], 2) + Math.pow(this._matrix[1], 2));
			}

			return this._sx;
		},
		set: function set(sx) {
			this._sx = sx;

			delete this._matrix;

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}
		}
	}, {
		key: "sy",
		get: function get() {
			if (this._sy === undefined) {
				this._sy = /*CAL.Math.sign(this._matrix[4]) * */Math.sqrt(Math.pow(this._matrix[3], 2) + Math.pow(this._matrix[4], 2));
			}

			return this._sy;
		},
		set: function set(sy) {
			this._sy = sy;

			delete this._matrix;

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}
		}
	}, {
		key: "rotation",
		get: function get() {
			if (this._rotation === undefined) {
				var p = new CAL.Vector(1, 0).applyMatrix(this).subtract(new CAL.Vector(this.x, this.y));
				this._rotation = Math.atan2(p.y, p.x);

				//this._rotation = Math.atan(-this._matrix[1], this._matrix[0]);
			}

			return this._rotation;
		},
		set: function set(rotation) {
			this._rotation = rotation;

			delete this._matrix;

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}
		}
	}, {
		key: "x",
		get: function get() {
			if (this._x === undefined) {
				this._x = this._matrix[2];
			}

			return this._x;
		},
		set: function set(x) {
			this._x = x;

			if (this._matrix !== undefined) {
				this._matrix[2] = x;
			}

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}
		}
	}, {
		key: "y",
		get: function get() {
			if (this._y === undefined) {
				this._y = this._matrix[5];
			}

			return this._y;
		},
		set: function set(y) {
			this._y = y;

			if (this._matrix !== undefined) {
				this._matrix[5] = y;
			}
		}
	}, {
		key: "matrix",
		get: function get() {
			if (this._matrix === undefined) {
				this._updateMatrix();
			}

			return this._matrix;
		},
		set: function set(m) {
			if (m instanceof Array) {
				this._matrix = m;

				delete this._sx;
				delete this._sy;
				delete this._rotation;
			} else {
				this.set(m);
			}

			if (this.onchangetransfrom !== undefined) {
				this.onchangetransfrom();
			}
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.Color = (function () {
	var _class = function _class() {
		_classCallCheck(this, _class);

		if (typeof arguments[0] === "number" && typeof arguments[1] === "number" && typeof arguments[2] === "number") {
			this.r = arguments[0];
			this.g = arguments[1];
			this.b = arguments[2];
			this.a = typeof arguments[3] === "number" ? arguments[3] : 1;
		} else if (typeof arguments[0] === "number") {
			var hex = Math.floor(arguments[0]);

			this.r = hex >> 16 & 255;
			this.g = hex >> 8 & 255;
			this.b = hex & 255;
			this.a = typeof arguments[1] === "number" ? arguments[1] : 1;
		} else {
			this.r = 0;
			this.g = 0;
			this.b = 0;
			this.a = 1;
		}
	};

	_createClass(_class, [{
		key: "setStroke",
		value: function setStroke(context) {
			context.strokeStyle = "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";

			return this;
		}
	}, {
		key: "setFill",
		value: function setFill(context) {
			context.fillStyle = "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";

			return this;
		}
	}, {
		key: "setColor",
		value: function setColor(context) {
			this.setStroke(context);
			this.setFill(context);

			return this;
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Draw = (function (_CAL$Matrix) {
	var _class = function _class(centerX, centerY, numberWidth, numberHeight, options) {
		_classCallCheck(this, _class);

		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.visible = options.visible !== undefined ? options.visible : true;
		this.active = false;
		this.depth = options.depth || 0;

		this.alpha = typeof options.alpha === "number" ? options.alpha : 1;

		this.centerX = centerX || 0;
		this.centerY = centerY || 0;
		this.index = 0;

		this.numberWidth = numberWidth || 1;
		this.numberHeight = numberHeight || 1;
		this.length = this.numberWidth * this.numberHeight;
	};

	_inherits(_class, _CAL$Matrix);

	_createClass(_class, [{
		key: "getBoundingBox",
		value: function getBoundingBox() {
			return {
				top: -this.centerX,
				left: -this.centerY,
				right: this.width - this.centerX,
				bottom: this.height - this.centerY,
				width: this.width,
				height: this.height
			};
		}
	}, {
		key: "draw",
		value: function draw(context, matrix) {
			console.log("Test");
			context.save();
			(matrix || this).setMatrixContext(context);
			context.globalAlpha = this.alpha;
			this.drawSimple(context, this.index, 0, 0);
			context.restore();

			return this;
		}
	}, {
		key: "drawSimple",
		value: function drawSimple(context, index, x, y) {
			var sx = index % this.numberWidth * this.width;
			var sy = Math.floor(index / this.numberWidth) * this.height;

			var offsetX = x - this.centerX;
			var offsetY = y - this.centerY;

			context.drawImage(this.image, sx, sy, this.width, this.height, offsetX, offsetY, this.width, this.height);

			return this;
		}
	}, {
		key: "drawAlpha",
		value: function drawAlpha(context, index, x, y, alpha) {
			context.globalAlpha = alpha;
			this.drawSimple(context, index, x, y);
			context.globalAlpha = 1;

			return this;
		}
	}, {
		key: "drawAngle",
		value: function drawAngle(context, index, x, y, angle) {
			context.save();
			context.translate(x, y);
			context.rotate(angle);
			this.drawSimple(context, index, 0, 0);
			context.restore();

			return this;
		}
	}, {
		key: "drawScale",
		value: function drawScale(context, index, x, y, width, height) {
			var sx = index % this.length * this.width;
			var sy = Math.floor(index / this.length) * this.height;

			var offsetX = x - this.centerX;
			var offsetY = y - this.centerY;

			context.drawImage(this.image, sx, sy, this.width, this.height, offsetX, offsetY, width, height);

			return this;
		}
	}, {
		key: "drawContain",
		value: function drawContain(context, index, x, y, width, height) {
			if (width / height > this.width / this.height) {
				x = x + (width - height / this.height * this.width) / 2;
				width = height / this.height * this.width;
			} else {
				y = y + (height - width / this.width * this.height) / 2;
				height = width / this.width * this.height;
			}

			this.drawScale(context, index, x, y, width, height);

			return this;
		}
	}]);

	return _class;
})(CAL.Matrix);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Surface = (function (_CAL$Draw) {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};
		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options.centerX, options.centerY, options.numberWidth, options.numberHeight, options);

		this.clearColor = options.clearColor || false;

		this.setCanvas(options.canvas || document.createElement("canvas"));

		this.setSize(options.width, options.height, options.pixelRatio);
	};

	_inherits(_class, _CAL$Draw);

	_createClass(_class, [{
		key: "setSize",
		value: function setSize(width, height, pixelRatio) {
			var width = width || this.image.width;
			var height = height || this.image.height;
			var pixelRatio = pixelRatio ? pixelRatio : 1;

			this.image.width = width * pixelRatio;
			this.image.height = height * pixelRatio;

			this.image.style.width = width + "px";
			this.image.style.height = height + "px";

			this.width = this.image.width / this.numberWidth;
			this.height = this.image.height / this.numberHeight;

			return this;
		}
	}, {
		key: "setCanvas",
		value: function setCanvas(canvas) {
			this.image = canvas;
			this.context = canvas.getContext("2d");

			return this;
		}
	}, {
		key: "clear",
		value: function clear() {
			if (this.clearColor) {
				this.clearColor.setColor(this.context);
				this.context.fillRect(0, 0, this.image.width, this.image.height);
			} else {
				this.context.clearRect(0, 0, this.image.width, this.image.height);
			}

			return this;
		}
	}, {
		key: "getImageData",
		value: function getImageData(x, y, width, height) {
			var x = x || 0;
			var y = y || 0;
			var width = width || this.image.width;
			var height = height || this.image.height;

			return this.context.getImageData(x, y, width, height);
		}
	}, {
		key: "getDataURL",
		value: function getDataURL() {
			return this.image.toDataURL();
		}

		/*
  blur = (function () {
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
  				/*
  			surface.setSize(this.width, this.height);
  			this.drawSimple(surface.context, number, this.centerX, this.centerY);
  			var imageData = surface.blur(radius);
  			
  			context.putImageData(imageData, x-this.centerX, y-this.centerY);
  			*/
		/*
  }
  else {
  this.drawSimple(context, number, x, y);
  }
  };
  })();
  */

	}]);

	return _class;
})(CAL.Draw);
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Group = (function (_CAL$Surface) {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};
		_get(Object.getPrototypeOf(_class.prototype), 'constructor', this).call(this, options);

		this.active = true;
		this.visible = true;

		this.objects = [];
		this.useCanvas = options.useCanvas !== undefined ? options.useCanvas : true;

		this.clearCanvas = true;
		this.drawCanvas = true;
		this.autoClearCanvas = options.autoClearCanvas || false;
		this.autoDrawCanvas = options.autoDrawCanvas || false;

		this.loop = false;
		this.itemsToAdd = [];
		this.itemsToRemove = [];

		this.mouse = {
			position: new CAL.Vector(),
			start: new CAL.Vector(),
			delta: new CAL.Vector(),
			length: 0,
			down: false
		};

		this.lastTime = new Date().getTime();

		this.keysDown = [];
		this.focus = true;

		window.addEventListener('keydown', this);
		window.addEventListener('keyup', this);
		window.addEventListener('blur', this);
		window.addEventListener('focus', this);
	};

	_inherits(_class, _CAL$Surface);

	_createClass(_class, [{
		key: 'init',
		value: function init() {
			this.useCanvas = false;
		}
	}, {
		key: 'handleEvent',
		value: function handleEvent(event) {
			if (this.useCanvas) {
				switch (event.type) {
					case 'mousedown':
						var offsetX = event.pageX - this.image.offsetLeft;
						var offsetY = event.pageY - this.image.offsetTop;

						var x = this.mouse.startX = Math.round(this.image.width / this.image.clientWidth * offsetX);
						var y = this.mouse.startY = Math.round(this.image.height / this.image.clientHeight * offsetY);

						this.mouse.position.copy(new CAL.Vector(x, y));
						this.mouse.start.copy(this.mouse.position);
						this.mouse.delta.identity();
						this.mouse.length = 0;
						this.mouse.down = true;

						this.mouseDown(this.mouse);
						break;

					case 'mouseup':
						var offsetX = event.pageX - this.image.offsetLeft;
						var offsetY = event.pageY - this.image.offsetTop;

						var x = Math.round(this.image.width / this.image.clientWidth * offsetX);
						var y = Math.round(this.image.height / this.image.clientHeight * offsetY);

						this.mouse.position.copy(new CAL.Vector(x, y));
						this.mouse.down = false;

						this.mouseUp(this.mouse);

						this.mouse.start.identity();
						this.mouse.delta.identity();
						this.mouse.length = 0;
						break;

					case 'mousemove':
						var offsetX = event.pageX - this.image.offsetLeft;
						var offsetY = event.pageY - this.image.offsetTop;

						var x = Math.round(this.image.width / this.image.clientWidth * offsetX);
						var y = Math.round(this.image.height / this.image.clientHeight * offsetY);

						var position = new CAL.Vector(x, y);

						this.mouse.length += this.mouse.position.distanceTo(position);

						this.mouse.position.copy(position);

						if (this.mouse.down) {
							this.mouse.delta.copy(this.mouse.position.subtract(this.mouse.start));
						}

						this.mouseMove(this.mouse);
						break;

					case 'touchstart':
						event.preventDefault();

						if (event.touches.length === 1) {
							var touch = event.touches[0];

							var offsetX = touch.pageX - this.image.offsetLeft;
							var offsetY = touch.pageY - this.image.offsetTop;

							var x = this.mouse.startX = Math.round(this.image.width / this.image.clientWidth * offsetX);
							var y = this.mouse.startY = Math.round(this.image.height / this.image.clientHeight * offsetY);

							this.mouse.position.copy(new CAL.Vector(x, y));
							this.mouse.start.copy(this.mouse.position);
							this.mouse.delta.identity();
							this.mouse.length = 0;
							this.mouse.down = true;

							this.mouseDown(this.mouse);
						}
						break;

					case 'touchmove':
						event.preventDefault();

						var touch = event.touches[0];

						var offsetX = touch.pageX - this.image.offsetLeft;
						var offsetY = touch.pageY - this.image.offsetTop;

						var x = Math.round(this.image.width / this.image.clientWidth * offsetX);
						var y = Math.round(this.image.height / this.image.clientHeight * offsetY);

						var position = new CAL.Vector(x, y);

						this.mouse.length += this.mouse.position.distanceTo(position);

						this.mouse.position.copy(position);

						if (this.mouse.down) {
							this.mouse.delta.copy(this.mouse.position.subtract(this.mouse.start));
						}

						this.mouseMove(this.mouse);
						break;

					case 'touchend':
						event.preventDefault();

						if (this.useCanvas && event.touches.length === 0) {
							this.mouse.down = false;

							this.mouseUp(this.mouse);

							this.mouse.start.identity();
							this.mouse.delta.identity();
							this.mouse.length = 0;
						}
						break;

					case 'keydown':
						if (!this.keysDown[event.keyCode]) {
							this.keysDown[event.keyCode] = true;
							this.keyDown(event.keyCode);
						}
						break;

					case 'keyup':
						this.keysDown[event.keyCode] = false;

						this.keyUp(event.keyCode);
						break;

					case 'blur':
						this.focus = false;
						break;

					case 'focus':
						this.lastTime = new Date().getTime();
						this.focus = true;
						break;
				}
			}
		}
	}, {
		key: '_addEventsListeners',
		value: function _addEventsListeners() {
			this.image.addEventListener('mousedown', this);
			this.image.addEventListener('mouseup', this);
			this.image.addEventListener('mousemove', this);
			this.image.addEventListener('touchstart', this);
			this.image.addEventListener('touchmove', this);
			this.image.addEventListener('touchend', this);
		}
	}, {
		key: '_removeEventListeners',
		value: function _removeEventListeners() {
			this.image.removeEventListener('mousedown', this);
			this.image.removeEventListener('mouseup', this);
			this.image.removeEventListener('mousemove', this);
			this.image.removeEventListener('touchstart', this);
			this.image.removeEventListener('touchmove', this);
			this.image.removeEventListener('touchend', this);
		}
	}, {
		key: 'setCanvas',
		value: function setCanvas(canvas) {
			if (this.image instanceof Node) {
				this._removeEventListeners();
				var imageData = this.context.getImageData(0, 0, this.width, this.height);
				this.clear();
			}

			this.image = canvas;
			this.context = canvas.getContext('2d');
			this.clear();

			this._addEventsListeners();

			if (imageData !== undefined) {
				this.context.putImageData(imageData, 0, 0);
			}

			return this;
		}
	}, {
		key: 'add',
		value: function add() {
			if (this.loop) {
				for (var i = 0; i < arguments.length; i++) {
					var object = arguments[i];
					this.itemsToAdd.push(object);
				}
			} else {
				for (var i = 0; i < arguments.length; i++) {
					var object = arguments[i];
					if (this.objects.indexOf(object) === -1) {
						object.parent = this;
						this.objects.push(object);
						if (object.init) {
							object.init(this);
						}
					}
				}
				this.sort();
			}

			return this;
		}
	}, {
		key: 'remove',
		value: function remove() {
			if (this.loop) {
				for (var i = 0; i < arguments.length; i++) {
					var object = arguments[i];
					this.itemsToRemove.push(object);
				}
			} else {
				for (var i = 0; i < arguments.length; i++) {
					var object = arguments[i];
					this.objects.remove(object);
					if (object.active && object.remove !== undefined) {
						object.parent = false;
						object.remove(this);
					}
				}
			}
		}
	}, {
		key: 'handleAdded',
		value: function handleAdded() {
			for (var i = 0; i < this.itemsToAdd.length; i++) {
				var object = this.itemsToAdd[i];
				this.add(object);
			}

			for (var i = 0; i < this.itemsToRemove.length; i++) {
				var object = this.itemsToRemove[i];
				this.remove(object);
			}
		}
	}, {
		key: 'sort',
		value: function sort() {
			this.objects.sort(function (a, b) {
				return (a.depth || 0) - (b.depth || 0);
			});
		}
	}, {
		key: 'keyDown',
		value: function keyDown(keyCode) {
			this.loop = true;
			for (var i = this.objects.length - 1; i >= 0; i--) {
				var object = this.objects[i];
				if (object.active && object.keyDown !== undefined) {
					if (object.keyDown(keyCode, this)) {
						break;
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}, {
		key: 'keyUp',
		value: function keyUp(keyCode) {
			this.loop = true;
			for (var i = this.objects.length - 1; i >= 0; i--) {
				var object = this.objects[i];
				if (object.active && object.keyUp !== undefined) {
					if (object.keyUp(keyCode, this)) {
						break;
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}, {
		key: 'mouseDown',
		value: function mouseDown(mouse) {
			var position = mouse.position.applyMatrix(this.inverseMatrix());
			var start = mouse.start.applyMatrix(this.inverseMatrix());

			var mouse = {
				position: position,
				start: start,
				delta: position.subtract(start),
				length: mouse.length * this.sx * this.sy,
				down: mouse.down
			};

			this.loop = true;
			for (var i = this.objects.length - 1; i >= 0; i--) {
				var object = this.objects[i];
				if (object.useCanvas !== true && object.active && object.mouseDown !== undefined) {
					if (object.mouseDown(mouse, this)) {
						break;
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}, {
		key: 'mouseUp',
		value: function mouseUp(mouse) {
			var position = mouse.position.applyMatrix(this.inverseMatrix());
			var start = mouse.start.applyMatrix(this.inverseMatrix());

			var mouse = {
				position: position,
				start: start,
				delta: position.subtract(start),
				length: mouse.length * this.sx * this.sy,
				down: mouse.down
			};

			this.loop = true;
			for (var i = this.objects.length - 1; i >= 0; i--) {
				var object = this.objects[i];
				if (object.useCanvas !== true && object.active && object.mouseUp !== undefined) {
					if (object.mouseUp(mouse, this)) {
						break;
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}, {
		key: 'mouseMove',
		value: function mouseMove(mouse) {
			var position = mouse.position.applyMatrix(this.inverseMatrix());
			var start = mouse.start.applyMatrix(this.inverseMatrix());

			var mouse = {
				position: position,
				start: start,
				delta: position.subtract(start),
				length: mouse.length * this.sx * this.sy,
				down: mouse.down
			};

			this.loop = true;
			for (var i = this.objects.length - 1; i >= 0; i--) {
				var object = this.objects[i];
				if (object.useCanvas !== true && object.active && object.mouseMove !== undefined) {
					if (object.mouseMove(mouse, this)) {
						break;
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}, {
		key: 'step',
		value: function step(deltaTime) {

			this.loop = true;
			for (var i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				if (object.active && object.step !== undefined) {
					if (object instanceof CAL.Group && !object.useCanvas) {
						if (object.clearCanvas || object.autoClearCanvas) {
							this.clearCanvas = true;
						}
						if (object.drawCanvas || object.autoDrawCanvas) {
							this.drawCanvas = true;
						}
					}

					object.step(deltaTime, this);
				}
			}
			this.loop = true;

			if ((this.clearCanvas || this.autoClearCanvas) && this.useCanvas) {
				this.clear();
			}
			if ((this.drawCanvas || this.autoDrawCanvas) && this.useCanvas) {
				this.draw();
			}

			this.clearCanvas = false;
			this.drawCanvas = false;
		}
	}, {
		key: 'cycle',
		value: function cycle() {
			if (this.focus) {
				var currentTime = new Date().getTime();
				var deltaTime = currentTime - this.lastTime;
				this.lastTime = currentTime;

				this.step(deltaTime);
			}
		}
	}, {
		key: 'draw',
		value: function draw(context, matrix) {
			context = this.useCanvas ? this.context : context;
			matrix = this.useCanvas ? this : matrix;

			this.loop = true;
			for (var i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				if (object.useCanvas !== true && object.visible && object.draw !== undefined) {
					if (object instanceof CAL.Matrix) {
						object.draw(context, object.multiplyMatrix(matrix));
					} else {
						object.draw(context, matrix);
					}
				}
			}
			this.loop = false;
			this.handleAdded();
		}
	}]);

	return _class;
})(CAL.Surface);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Image = (function (_CAL$Draw) {
	var _class = function _class(source, centerX, centerY, numberWidth, numberHeight, options) {
		_classCallCheck(this, _class);

		options = options || {};
		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, centerX, centerY, numberWidth, numberHeight, options);

		this.image = new Image();
		this.source = source;
	};

	_inherits(_class, _CAL$Draw);

	_createClass(_class, [{
		key: "load",
		value: function load(callback) {
			var scope = this;
			this.image.onload = function () {
				scope.loaded = true;

				scope.width = scope.image.width / scope.numberWidth;
				scope.height = scope.image.height / scope.numberHeight;

				if (callback !== undefined) {
					callback();
				}
			};
			this.image.src = this.source;

			return this;
		}
	}]);

	return _class;
})(CAL.Draw);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.Loader = (function () {
	var _class = function _class(objects) {
		_classCallCheck(this, _class);

		this.objects = objects || [];
	};

	_createClass(_class, [{
		key: "add",
		value: function add() {
			for (var i = 0; i < arguments.length; i++) {
				var object = arguments[i];
				if (this.objects.indexOf(object) === -1) {
					this.objects.push(object);
				}
			}

			return this;
		}
	}, {
		key: "remove",
		value: function remove() {
			for (var i = 0; i < arguments.length; i++) {
				var object = arguments[i];
				this.objects.remove(object);
			}

			return this;
		}
	}, {
		key: "load",
		value: function load(callback) {
			var objectsToLoad = this.objects.length;
			for (var i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				object.load(function () {
					objectsToLoad -= 1;
					if (objectsToLoad === 0 && callback !== undefined) {
						callback();
					}
				}, this);
			};

			return this;
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.Tween = (function () {
	var _class = function _class(object, attributes, duration, options) {
		_classCallCheck(this, _class);

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

	_createClass(_class, [{
		key: "start",
		value: function start() {
			this.t = 0;
			this.active = true;

			return this;
		}
	}, {
		key: "stop",
		value: function stop() {
			this.t = 0;
			this.active = false;

			return this;
		}
	}, {
		key: "pause",
		value: function pause() {
			this.active = false;

			return this;
		}
	}, {
		key: "resume",
		value: function resume() {
			this.active = true;

			return this;
		}
	}, {
		key: "step",
		value: function step(deltaTime, group) {
			this.timer += deltaTime;

			if (this.timer < this.duration) {
				for (var i in this.attributes) {
					var dt = this.timer;
					var d = this.duration;
					var b = this.begin[i];
					var c = this.change[i];

					this.object[i] = this.easing(dt, b, c, d);
				}
			} else {
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
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.TimeLine = (function () {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};

		this.visible = false;
		this.active = true;
		this.depth = -10000;

		this.moments = [];
		this.autoRemove = options.autoRemove !== undefined ? options.autoremove : true;
		this.loop = options.loop !== undefined ? options.loop : false;
		this.t = 0;
	};

	_createClass(_class, [{
		key: "addMoment",
		value: function addMoment(time, callback) {
			this.moments.push({
				time: time,
				callback: callback
			});

			return this;
		}
	}, {
		key: "removeMoment",
		value: function removeMoment(remove) {
			for (var i = 0; i < this.moments.length; i++) {
				var moment = this.moments[i];

				if (moment === remove || moment.time === remove || moment.callback === remove) {
					this.moments.remove(moment);
				}
			}

			return this;
		}
	}, {
		key: "start",
		value: function start() {
			this.t = 0;
			this.active = true;

			return this;
		}
	}, {
		key: "stop",
		value: function stop() {
			this.t = 0;
			this.active = false;

			return this;
		}
	}, {
		key: "pause",
		value: function pause() {
			this.active = false;

			return this;
		}
	}, {
		key: "resume",
		value: function resume() {
			this.active = true;

			return this;
		}
	}, {
		key: "step",
		value: function step(dt) {
			var newTime = this.t + dt;
			var remove = true;

			for (var i = 0; i < this.moments.length; i++) {
				var moment = this.moments[i];
				if (moment.time >= this.t) {
					if (moment.time < newTime) {
						moment.callback();
					} else {
						remove = false;
					}
				}
			}

			if (remove && this.loop) {
				this.t = 0;
			} else if (remove && this.autoRemove) {
				this.parent.remove(this);
			}

			this.t = newTime;
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.BezierPoint = (function () {
	var _class = function _class(position, handleIn, handleOut) {
		_classCallCheck(this, _class);

		this.position = position || new CAL.Vector();
		this.handleIn = handleIn || new CAL.Vector().copy(position);
		this.handleOut = handleOut || new CAL.Vector().copy(position);
	};

	_createClass(_class, [{
		key: "copy",
		value: function copy(bezierPoint) {
			this.position.copy(bezierPoint.position);
			this.handleIn.copy(bezierPoint.handleIn);
			this.handleOut.copy(bezierPoint.handleOut);
		}
	}, {
		key: "applyMatrix",
		value: function applyMatrix(matrix) {
			var position = this.position.applyMatrix(matrix);
			var handleIn = this.handleIn.applyMatrix(matrix);
			var handleOut = this.handleOut.applyMatrix(matrix);

			return new CAL.BezierPoint(position, handleIn, handleOut);
		}
	}, {
		key: "draw",
		value: function draw(context) {
			var handleIn = this.handleIn.add(this.position);
			var handleOut = this.handleOut.add(this.position);

			context.strokeStyle = "#09F";

			context.beginPath();
			context.moveTo(handleIn.x, handleIn.y);
			context.lineTo(this.position.x, this.position.y);
			context.lineTo(handleOut.x, handleOut.y);
			context.stroke();

			context.beginPath();
			context.arc(this.position.x, this.position.y, 10, 0, Math.PI * 2, true);
			context.stroke();

			context.beginPath();
			context.arc(handleIn.x, handleIn.y, 5, 0, Math.PI * 2, true);
			context.stroke();

			context.beginPath();
			context.arc(handleOut.x, handleOut.y, 5, 0, Math.PI * 2, true);
			context.stroke();
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Shape = (function (_CAL$Matrix) {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};
		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.visible = options.visible !== undefined ? options.visible : true;
		this.active = false;
		this.depth = options.depth || 0;
		this.lines = [];

		this.closePath = options.closePath !== undefined ? options.closePath : true;
		this.lineColor = options.lineColor !== undefined ? options.lineColor : new CAL.Color();
		this.shapeColor = options.shapeColor !== undefined ? options.shapeColor : new CAL.Color();
		this.lineWidth = options.lineWidth || 1;
		this.lineJoin = options.lineJoin || "round";
		this.lineCap = options.lineCap || "round";

		this.points = [];
		if (options.points) {
			for (var i = 0; i < options.points.length; i++) {
				var point = options.points[i];
				this.addPoint(point);
			}
		}
	};

	_inherits(_class, _CAL$Matrix);

	_createClass(_class, [{
		key: "addPoint",
		value: function addPoint() {
			for (var i = 0; i < arguments.length; i++) {
				var point = arguments[i];

				if (point instanceof CAL.Vector) {
					point = new CAL.BezierPoint(point);
				}

				this.points.push(point);
			}

			return this;
		}
	}, {
		key: "applyMatrix",
		value: function applyMatrix(matrix) {
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				point.copy(point.applyMatrix(matrix));
			}

			return this;
		}
	}, {
		key: "hit",
		value: function hit(vector, matrix) {
			if (matrix instanceof CAL.Matrix) {
				vector = vector.applyMatrix(matrix.multiplyMatrix(this.inverseMatrix()));
			} else {
				vector = vector.applyMatrix(this.inverseMatrix());
			}

			if (this.points.length <= 3) {
				return false;
			}

			for (var i = 0; i < this.points.length; i++) {
				if (vector.subtract(this.points[i].position).dot(this.getNormal(i)) > 0) {
					return false;
				}
			}

			return true;
		}
	}, {
		key: "getBoundingBox",
		value: function getBoundingBox() {
			var minX = Infinity;
			var minY = Infinity;
			var maxX = -Infinity;
			var maxY = -Infinity;

			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i].position;

				minX = point.x < minX ? point.x : minX;
				minY = point.y < minY ? point.y : minY;
				maxX = point.x > maxX ? point.x : maxX;
				maxY = point.y > maxY ? point.y : maxY;
			}

			return {
				top: minY,
				left: minX,
				bottom: maxY,
				right: maxX,
				width: maxX - minX,
				height: maxY - minY
			};
		}
	}, {
		key: "getNormal",
		value: function getNormal(i) {
			var pointA = this.points[(i + 1) % this.points.length].position;
			var pointB = this.points[i].position;

			return pointA.subtract(pointB).normal().normalize();
		}
	}, {
		key: "setContext",
		value: function setContext(context, matrix) {
			var matrix = matrix || this;

			context.beginPath();

			var currentPoint = this.points[0].applyMatrix(matrix);

			context.moveTo(currentPoint.position.x, currentPoint.position.y);

			var length = this.closePath ? this.points.length + 1 : this.points.length;
			for (var i = 1; i < length; i++) {
				var prevPoint = currentPoint;
				var currentPoint = this.points[i % this.points.length].applyMatrix(matrix);

				var handleOut = prevPoint.handleOut;
				var handleIn = currentPoint.handleIn;
				var position = currentPoint.position;

				context.bezierCurveTo(handleOut.x, handleOut.y, handleIn.x, handleIn.y, position.x, position.y);
			}

			return this;
		}
	}, {
		key: "clip",
		value: function clip(context, matrix) {
			this.setContext(context, matrix);
			context.clip();

			return this;
		}
	}, {
		key: "fill",
		value: function fill(context, matrix) {
			this.setContext(context, matrix);

			this.shapeColor.setFill(context);

			context.fill();

			return this;
		}
	}, {
		key: "stroke",
		value: function stroke(context, matrix) {
			this.setContext(context, matrix);

			context.lineColor = this.lineColor;
			context.lineWidth = this.lineWidth;
			context.lineJoin = this.lineJoin;
			context.lineCap = this.lineCap;

			this.lineColor.setStroke(context);

			context.stroke();

			return this;
		}
	}, {
		key: "draw",
		value: function draw(context, matrix) {
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
		}
	}]);

	return _class;
})(CAL.Matrix);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Text = (function (_CAL$Matrix) {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};
		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.visible = options.visible !== undefined ? options.visible : true;
		this.active = options.active !== undefined ? options.active : true;
		this.depth = options.depth || 0;
		this.text = options.text || "";
		this.style = options.style || "normal";
		this.variant = options.variant || "normal";
		this.weight = options.weight || "normal";
		this.size = options.size || 12;
		this.font = options.font || "Arial";
		this.align = options.align || "left";
		this.baseline = options.baseline || "bottom";

		this.textAlign = options.textAlign || "left";

		this.color = options.color || new CAL.Color();
		this.alpha = typeof options.alpha === "number" ? options.alpha : 1;
	};

	_inherits(_class, _CAL$Matrix);

	_createClass(_class, [{
		key: "measure",
		value: function measure(text) {
			text = text || this.text;

			context.font = [this.style, this.variant, this.weight, this.size + "px", this.font].join(" ");

			return context.measureText(text).width;
		}
	}, {
		key: "drawText",
		value: function drawText(context, text, x, y) {
			context.font = [this.style, this.variant, this.weight, this.size + "px", this.font].join(" ");

			context.textAlign = this.align;
			context.textBaseline = this.baseline;

			this.color.setColor(context);

			context.fillText(text, x, y);
		}
	}, {
		key: "drawTextAlpha",
		value: function drawTextAlpha(context, text, x, y, apha) {
			context.globalAlpha = apha;

			this.drawText(context, text, x, y);

			context.globalAlpha = 1;
		}
	}, {
		key: "draw",
		value: function draw(context, matrix) {
			context.save();

			context.globalAlpha = this.alpha;
			matrix.setMatrixContext(context);

			this.drawText(context, this.text, 0, 0);

			context.restore();
		}
	}, {
		key: "clone",
		value: function clone() {
			return new CAL.text({
				style: this.style,
				variant: this.variant,
				weight: this.weight,
				size: this.size,
				font: this.font,
				color: this.color.clone()
			});
		}
	}]);

	return _class;
})(CAL.Matrix);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

CAL.KeyListener = (function () {
	var _class = function _class(options) {
		_classCallCheck(this, _class);

		options = options || {};

		this.visible = false;
		this.active = options.active !== undefined ? options.active : true;
		this.depth = -10000;

		this.actions = options.actions || {};
	};

	_createClass(_class, [{
		key: "add",
		value: function add(key, callback) {
			this.actions[key] = callback;

			return this;
		}
	}, {
		key: "keyDown",
		value: function keyDown(key) {
			if (this.actions[key]) {
				this.actions[key]();
			}
		}
	}]);

	return _class;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Star = (function (_CAL$Shape) {
	var _class = function _class(rays, outerRadius, innerRadius, options) {
		_classCallCheck(this, _class);

		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.set(rays, outerRadius, innerRadius);
	};

	_inherits(_class, _CAL$Shape);

	_createClass(_class, [{
		key: "set",
		value: function set(rays, outerRadius, innerRadius) {
			this.rays = rays || 5;
			this.outerRadius = outerRadius || 100;
			this.innerRadius = innerRadius || 50;

			this.points = [];

			var even = true;
			for (var rad = 0; rad < Math.PI * 2; rad += Math.PI / this.rays) {
				var radius = even ? this.outerRadius : this.innerRadius;

				var x = Math.cos(rad) * radius;
				var y = Math.sin(rad) * radius;

				this.addPoint(new CAL.BezierPoint(new CAL.Vector(x, y), null, null));

				even = !even;
			}
		}
	}, {
		key: "toShape",
		value: function toShape() {
			return new CAL.Shape({
				points: this.points,
				closedPath: true,
				lineColor: this.lineColor,
				shapeColor: this.shapeColor,
				lineWidth: this.lineWidth,
				lineJoin: this.lineJoin,
				lineCap: this.lineCap,
				matrix: this.matrix
			});
		}
	}]);

	return _class;
})(CAL.Shape);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Circle = (function (_CAL$Shape) {
	var _class = function _class(radius, options) {
		_classCallCheck(this, _class);

		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.set(radius);
	};

	_inherits(_class, _CAL$Shape);

	_createClass(_class, [{
		key: "set",
		value: function set(radius) {
			this.points = [];

			this.radius = typeof radius === "number" ? radius : 100;
			var offset = 4 * (Math.sqrt(2) - 1) / 3 * radius;

			this.addPoint(new CAL.BezierPoint(new CAL.Vector(0, radius), new CAL.Vector(-offset, radius), new CAL.Vector(offset, radius)), new CAL.BezierPoint(new CAL.Vector(radius, 0), new CAL.Vector(radius, offset), new CAL.Vector(radius, -offset)), new CAL.BezierPoint(new CAL.Vector(0, -radius), new CAL.Vector(offset, -radius), new CAL.Vector(-offset, -radius)), new CAL.BezierPoint(new CAL.Vector(-radius, 0), new CAL.Vector(-radius, -offset), new CAL.Vector(-radius, offset)));
		}
	}, {
		key: "toShape",
		value: function toShape() {
			return new CAL.Shape({
				points: this.points,
				closedPath: true,
				lineColor: this.lineColor,
				shapeColor: this.shapeColor,
				lineWidth: this.lineWidth,
				lineJoin: this.lineJoin,
				lineCap: this.lineCap,
				matrix: this.matrix
			});
		}
	}]);

	return _class;
})(CAL.Shape);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.Polygon = (function (_CAL$Shape) {
	var _class = function _class(angles, radius, options) {
		_classCallCheck(this, _class);

		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.set(angles);
	};

	_inherits(_class, _CAL$Shape);

	_createClass(_class, [{
		key: "set",
		value: function set(angles, radius) {
			this.points = [];

			this.angles = angles || 8;
			this.radius = radius || 100;

			for (var rad = 0; rad < Math.PI * 2; rad += Math.PI * 2 / this.angles) {
				var x = Math.cos(rad) * this.radius;
				var y = Math.sin(rad) * this.radius;

				this.addPoint(new CAL.BezierPoint(new CAL.Vector(x, y), null, null));
			}
		}
	}, {
		key: "toShape",
		value: function toShape() {
			return new CAL.Shape({
				points: this.points,
				closedPath: true,
				lineColor: this.lineColor,
				shapeColor: this.shapeColor,
				lineWidth: this.lineWidth,
				lineJoin: this.lineJoin,
				lineCap: this.lineCap,
				matrix: this.matrix
			});
		}
	}]);

	return _class;
})(CAL.Shape);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

CAL.RoundRect = (function (_CAL$Shape) {
	var _class = function _class(radius, width, height, options) {
		_classCallCheck(this, _class);

		_get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, options);

		this.set(radius, width, height);
	};

	_inherits(_class, _CAL$Shape);

	_createClass(_class, [{
		key: "set",
		value: function set(radius, width, height) {
			this.points = [];

			this.radius = typeof radius === "number" ? radius : 50;
			this.width = typeof width === "number" ? width : 200;
			this.height = typeof height === "number" ? height : 200;

			this.addPoint(new CAL.Vector(-this.width / 2, -this.height / 2), new CAL.Vector(-this.width / 2, this.height / 2), new CAL.Vector(this.width / 2, this.height / 2), new CAL.Vector(this.width / 2, -this.height / 2));
		}
	}, {
		key: "toShape",
		value: function toShape() {
			var points = [];

			var prevPoint;
			var currentPoint = this.points[this.points.length - 1].position.applyMatrix(this);
			var nextPoint = this.points[0].position.applyMatrix(this);

			for (var i = 0; i < this.points.length; i++) {
				prevPoint = currentPoint;
				currentPoint = nextPoint;
				var nextPoint = this.points[(i + 1) % this.points.length].position.applyMatrix(this);

				var maxRadius = Math.min(prevPoint.subtract(currentPoint).length(), nextPoint.subtract(currentPoint).length()) / 2;
				var radius = Math.min(this.radius, maxRadius);

				var start = currentPoint.add(prevPoint.subtract(currentPoint).setLength(radius));
				var end = currentPoint.add(nextPoint.subtract(currentPoint).setLength(radius));

				var handleIn = currentPoint.add(prevPoint.subtract(currentPoint).setLength(radius / 3));
				var handleOut = currentPoint.add(nextPoint.subtract(currentPoint).setLength(radius / 3));

				var inverseMatrix = this.inverseMatrix();

				points.push(new CAL.BezierPoint(new CAL.Vector().copy(start).applyMatrix(inverseMatrix), null, new CAL.Vector().copy(handleIn).applyMatrix(inverseMatrix)));
				points.push(new CAL.BezierPoint(new CAL.Vector().copy(end).applyMatrix(inverseMatrix), new CAL.Vector().copy(handleOut).applyMatrix(inverseMatrix), null));
			}

			return new CAL.Shape({
				points: points,
				closedPath: true,
				lineColor: this.lineColor,
				shapeColor: this.shapeColor,
				lineWidth: this.lineWidth,
				lineJoin: this.lineJoin,
				lineCap: this.lineCap,
				matrix: this.matrix
			});
		}
	}, {
		key: "setContext",
		value: function setContext(context, matrix) {
			var matrix = matrix || this;
			context.beginPath();

			var prevPoint;
			var currentPoint = this.points[this.points.length - 1].position.applyMatrix(matrix);
			var nextPoint = this.points[0].position.applyMatrix(matrix);

			for (var i = 0; i < this.points.length; i++) {
				prevPoint = currentPoint;
				currentPoint = nextPoint;
				var nextPoint = this.points[(i + 1) % this.points.length].position.applyMatrix(matrix);

				var maxRadius = Math.min(prevPoint.subtract(currentPoint).length(), nextPoint.subtract(currentPoint).length()) / 2;
				var radius = Math.min(this.radius, maxRadius);

				var start = currentPoint.add(prevPoint.subtract(currentPoint).setLength(radius));
				var end = currentPoint.add(nextPoint.subtract(currentPoint).setLength(radius));

				context.lineTo(start.x, start.y);
				context.quadraticCurveTo(currentPoint.x, currentPoint.y, end.x, end.y);
			}
			context.closePath();
		}
	}]);

	return _class;
})(CAL.Shape);