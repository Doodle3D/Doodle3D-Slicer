import * as THREE from 'three';
import { defaultSettings, sliceGeometry } from 'doodle3d-slicer';
import fileURL from '!url-loader!./models/combingtest.json';
import fileSaver from 'file-saver';

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load(fileURL, geometry => {
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / -2));
  geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(50, -0.0, 50)));

  const onProgress = ({ progress: { done, total, action } }) => {
    const percentage = `${(done / total * 100).toFixed()}%`
    document.write(`<p>${action}, ${percentage}</p>`);
  };

  const { filament, duration, gcode } = sliceGeometry(settings, geometry, null, true, onProgress);
  // console.log('filament: ', filament);
  // console.log('duration: ', duration);
  // document.body.innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  fileSaver.saveAs(file);
});
