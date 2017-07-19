# Doodle3D-Slicer
JavaScript gcode slicer, Intended to use with the Doodle3D WiFi-Box
# Usage

```javascript
import * as THREE from 'three';
import { defaultSettings, Slicer } from 'Doodle3D/Doodle3D-Slicer';

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const geometry = new THREE.TorusGeometry(20, 10, 30, 30);

const slicer = new SLICER.Slicer();
slicer.setGeometry(geometry);
const gcode = await slicer.slice(settings, ({ progress: { done, total, action } }) => {
  const percentage = `${(done / total * 100).toFixed()}%`
  console.log(action, percentage);
}));
```
