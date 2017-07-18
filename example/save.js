import 'three.js';
import { Settings, printerSettings, userSettings, Slicer } from 'src/index.js';
import { saveAs } from 'file-saver';

const settings = new Settings({
  ...printerSettings['ultimaker2go'],
  ...userSettings
});

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load('models/airplane.json', async geometry => {
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / -2));
  geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(50, 0.1, 50)));
  geometry.computeFaceNormals();

  const slicer = new Slicer().setGeometry(geometry);
  const gcode = slicer.sliceSync(settings);

  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  saveAs(file);
});
