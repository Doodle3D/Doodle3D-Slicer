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