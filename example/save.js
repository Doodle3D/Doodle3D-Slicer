import 'three.js';
import 'three.js/loaders/STLLoader';
import { Settings, printerSettings, userSettings, Slicer } from 'src/index.js';
import { saveAs } from 'file-saver';

const settings = new Settings({
  ...printerSettings['ultimaker2go'],
  ...userSettings
});

const stlLoader = new THREE.STLLoader();
stlLoader.load('stl/traktor.stl', async (geometry) => {
  geometry = new THREE.Geometry().fromBufferGeometry(geometry);

  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / -2));
  geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(50, -0.1, 50)));
  geometry.mergeVertices();
  geometry.computeFaceNormals();

  const slicer = new Slicer().setGeometry(geometry);
  const gcode = await slicer.slice(settings);

  const file = new File([gcode], 'traktor.gcode', { type: 'text/plain' });
  saveAs(file);
});
