import 'three.js';
import { defaultSettings, Slicer } from 'src/index.js';
import { saveAs } from 'file-saver';

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load('models/airplane.json', async geometry => {
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / -2));
  geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(50, -0.1, 50)));
  geometry.computeFaceNormals();

  const slicer = new Slicer().setGeometry(geometry);
  const gcode = await slicer.slice(settings)
    .progress(({ done, total, action }) => {
      const percentage = `${(done / total * 100).toFixed()}%`
      document.write(`<p>${action}, ${percentage}</p>`);
    });

  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  saveAs(file);
});
