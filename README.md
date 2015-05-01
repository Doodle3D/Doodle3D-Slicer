# Doodle3D-Slicer

The Doodle3D Slicer is designed for developers to make it easier to export 3d models to the Doodle3D WiFi-Box. The slicers includes a slicer and a class designed for communication with the WiFi-Box. All the classes are in the D3D name space.

Three.js, Clipper.js and jQuery are required to run the Doodl3D slicer. All are included in the source.

This is an example of code.

```javascript
var localIp = "192.168.5.1";
var doodleBox = new D3D.Box(localIp);

doodleBox.onload = function () {
  "use strict";
  
  var geometry = new THREE.TorusGeometry(40, 20, 10, 10);

  var slicer = new D3D.Slicer().setGeometry(geometry);
  var gcode = slicer.getGcode(doodlBox.printer);
  
  doodleBox.print(gcode);
};
```

For more information see http://www.doodle3d.com/help/api-documentation
