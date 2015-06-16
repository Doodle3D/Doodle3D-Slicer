function DrawCanvas (scene) {
	"use strict";

	this.domElement = document.createElement("canvas");

	paper.setup(this.domElement);

	var path = new paper.Path();

	this.scene = scene;
	this.test();
};
DrawCanvas.prototype.test = function () {
	"use strict";
	var scope = this;

	var a = [];

	var tool = new paper.Tool();

	var path;

	tool.onMouseDown = function (event) {
		if (path) {
			path.selected = false;
		}

		a.push(event.point);

		path = new paper.Path({
			segments: [event.point],
			strokeColor: 'black',
			fullySelected: true
		});
	}

	tool.onMouseDrag = function(event) {
		path.add(event.point);

		a.push(event.point);
	}

	tool.onMouseUp = function (event) {
		console.log(path);

		var shape = new THREE.Shape();

		for (var i = 0; i < a.length; i ++) {
			var point = a[i % a.length];

			if (i === 0) {
				shape.moveTo(point.y, point.x);
			}
			else {
				shape.lineTo(point.y, point.x);
			}
		}
		var geometry = new THREE.ExtrudeGeometry(shape, {
			amount: 40,
			bevelEnabled: true,
			bevelSegments: 2,
			steps: 2,
			bevelSize: 1,
			bevelThickness: 1
		});
		var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0xff0000}));
		mesh.rotation.x = -Math.PI/2;

		mesh.position.x = -400;
		mesh.position.z = 200;

		a = [];

		scope.scene.add(mesh);

		// Select the path, so we can see its segments:
		path.fullySelected = true;
	}
};
DrawCanvas.prototype.setSize = function (width, height) {
	"use strict";

	paper.view.viewSize = new paper.Size(width, height);
	paper.view.draw();

};