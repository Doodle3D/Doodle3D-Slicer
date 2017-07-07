# Doodle3D-Slicer
JavaScript gcode slicer, Intended to use with the Doodle3D WiFi-Box
# Usage

```javascript
import 'three.js';
import * as SLICER from 'doodle3d-slicer';

const settings = new SLICER.Settings({
  ...SLICER.printerSettings['ultimaker2go'],
  ...SLICER.userSettings.low
});

const geometry = new THREE.TorusGeometry(20, 10, 30, 30).clone();

const slicer = new SLICER.Slicer();

slicer.setGeometry(geometry);
slicer.slice(settings, false).then(gcode => {
  document.getElementById('gcode').innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
});
```
