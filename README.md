# Doodle3D-Slicer

The Doodle3D Slicer is designed for developers to make it easier to export 3d models to the Doodle3D WiFi-Box. The slicers includes a gcode slicer and a class designed for communication with the WiFi-Box. All the classes are in the D3D name space.

Three.js, Clipper.js and jQuery are required to run the Doodl3D slicer. All are included in the source.

This is an example of code.

```javascript
var localIp = "192.168.5.1";
var doodleBox = new D3D.Box(localIp);

doodleBox.onload = function () {
  "use strict";
	
  var printer = new D3D.Printer(printerSettings, userSettings);

  var geometry = new THREE.BoxGeometry(20, 20, 20, 1, 1, 1);
  var material = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = 100;
  mesh.position.z = 100;
  mesh.position.y = 10;
  
  var slicer = new D3D.Slicer().setMesh(mesh);
  var gcode = slicer.getGcode(printer);
  
  doodleBox.print(gcode);
};
```

For more information see http://www.doodle3d.com/
