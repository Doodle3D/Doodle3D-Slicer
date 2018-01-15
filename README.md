# Doodle3D-Slicer

JavaScript gcode slicer, Intended to use with the Doodle3D WiFi-Box

# Usage

```javascript
import * as THREE from 'three';
import { defaultSettings, sliceGeometry } from 'Doodle3D/Doodle3D-Slicer';

const settings = {
  ...defaultSettings.default,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const geometry = new THREE.TorusGeometry(20, 10, 30, 30).clone();

const gcode = await sliceGeometry(settings, geometry);
```

# API

**Settings**
```javascript
import { defaultSettings } from 'Doodle3D/Doodle3D-Slicer';

const settings = {
  ...defaultSettings.default,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};
```
Create settings object to be used by the slicer

**Slice Mesh**
```javascript
import { sliceMesh } from 'Doodle3D/Doodle3D-Slicer';

GCode: String = sliceMesh(settings: Object, mesh: THREE.Mesh, [sync: Boolean = false, onProgress: Func ])
```
Slice function that accepts Meshes
  - Settings: settings object (see [settings](#settings))
  - Mesh: THREE.Mesh instance that contains the geometry
  - Sync: determines if the slicing progress will be sync (blocking) or async (non-blocking). A webworker is used to slice async
  - onProgress: progress callback

**Slice Geometry**
```javascript
import { sliceGeometry } from 'Doodle3D/Doodle3D-Slicer';

GCode: String = sliceGeometry(settings: Object, geometry: THREE.Geometry | THREE.BufferGeometry, [matrix: THREE.Matrix, sync: Boolean = false, onProgress: Func ])
```

Slice function that accepts Geometry
  - Settings: settings object (see [settings](#settings))
  - Geometry: THREE.Geometry instance
  - matrix: matrix that can control the scale, rotation and position of the model
  - Sync: determines if the slicing progress will be sync (blocking) or async (non-blocking). A webworker is used to slice async
  - onProgress: progress callback
