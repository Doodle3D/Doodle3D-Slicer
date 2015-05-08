/******************************************************
*
* Utils
* requires jQuery, Three.js
*
******************************************************/

var D3D = {
	"version": "0.1", 
	"website": "http://www.doodle3d.com/", 
	"contact": "develop@doodle3d.com"
};

//add normal function to Three.js Vector class
THREE.Vector2.prototype.normal = function () {
	"use strict";

	var x = this.y;
	var y = -this.x;

	return this.set(x, y);
};

function sendAPI (url, data, callback) {
	"use strict";

	$.ajax({
		url: url, 
		type: "POST", 
		data: data, 
		dataType: "json", 
		timeout: 10000, 
		success: function (response) {
			if (response.status === "success") {
				if (callback !== undefined) {
					callback(response.data);
				}
			}
			else {
				console.warn(response.msg);
			}
		}
	}).fail(function () {
		console.warn("Failed connecting to " + url);
		sendAPI(url, data, callback);
	});
}

function getAPI (url, callback) {
	"use strict";

	$.ajax({
		url: url, 
		dataType: "json", 
		timeout: 5000, 
		success: function (response) {
			if (response.status === "success") {
				if (callback !== undefined) {
					callback(response.data);
				}
			}
			else {
				console.warn(response.msg);
			}
		}
	}).fail(function () {
		console.warn("Failed connecting to " + url);
		getAPI(url, callback);
	});
}

function downloadFile (file, data) {
	"use strict";
	
	$(document.createElement("a")).attr({
		download: file, 
		href: "data:text/plain," + data
	})[0].click();
}

Array.prototype.clone = function () {
	"use strict";
	
	var array = [];

	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
};

function applyMouseControls (renderer, camera, center, maxDistance) {
	"use strict";
	//TODO
	//impliment touch controls
	//windows mouse wheel fix

	var distance = 20;
	var rotX = 0;
	var rotY = 0;
	var moveCamera = false;

	function updateCamera () {
		camera.position.set(
			Math.cos(rotY)*Math.sin(rotX)*distance,
			Math.sin(rotY)*distance,
			Math.cos(rotY)*Math.cos(rotX)*distance
		).add(center);
		camera.lookAt(center);
	}

	$(renderer.domElement).on("mousedown", function (e) {
		moveCamera = true;
	}).on("wheel", function (e) {
		var event = e.originalEvent;

		event.preventDefault();
		distance = THREE.Math.clamp(distance - event.wheelDelta, 1, maxDistance);

		updateCamera();
	});

	$(window).on("mouseup", function (e) {
		moveCamera = false;
	}).on("mousemove", function (e) {
		var event = e.originalEvent;

		if (moveCamera === true) {
			rotX = (rotX - event.webkitMovementX/100) % (2*Math.PI);
			rotY = THREE.Math.clamp(rotY + event.webkitMovementY/100, -Math.PI/2, Math.PI/2);

			updateCamera();
		}
	});
	
	updateCamera();
}

var requestAnimFrame = (function () {
	"use strict";

	return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || function (callback) {
		setTimeout(callback, 1000/60);
	};
})();