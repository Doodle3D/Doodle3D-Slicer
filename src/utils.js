/******************************************************
*
* Utils
* dependices Three.js
*
******************************************************/

var D3D = {
	"version": "0.1", 
	"website": "http://www.doodle3d.com/", 
	"contact": "develop@doodle3d.com"
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
					callback(null, response.data);
				}
			}
			else {
				callback(response.msg);
			}
		}
	}).fail(function () {
		callback("Failed connecting to " + url);
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
					callback(null, response.data);
				}
			}
			else {
				callback(response.msg);
			}
		}
	}).fail(function () {
		callback("Failed connecting to " + url);
	});	
}

function loadSettings (url, callback) {
	"use strict";

	$.ajax({
		url: url, 
		dataType: "json", 
		success: function (response) {
			if (callback !== undefined) {
				callback(response);
			}
		}
	});
}

function downloadFile (file, data) {
	"use strict";

	var blob = new Blob([data], {type:'text/plain'});

	var button = document.createElement("a");
	button.download = file;
	button.href = window.URL.createObjectURL(blob);
	button.click();
}

Array.prototype.clone = function () {
	"use strict";
	var array = [];

	for (var i = 0; i < this.length; i ++) {
		array[i] = this[i];
	}

	return array;
}