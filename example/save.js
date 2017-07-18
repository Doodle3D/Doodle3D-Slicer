import 'three.js';
import { Settings, defaultSettings, Slicer } from 'src/index.js';
import { saveAs } from 'file-saver';

console.log('defaultSettings: ', defaultSettings);

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high,
  startCode: '',
  endCode: ''
};

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
