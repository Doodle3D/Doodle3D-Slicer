import * as THREE from 'three';
import { defaultSettings, sliceGeometry } from 'doodle3d-slicer';

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const geometry = new THREE.TorusGeometry(20, 10, 30, 30).clone();
geometry.mergeVertices();

const onProgress = ({ progress: { done, total, action } }) => {
  const percentage = `${(done / total * 100).toFixed()}%`
  document.write(`<p>${action}, ${percentage}</p>`);
};

sliceGeometry(settings, geometry, null, false, onProgress).then(gcode => {
  document.body.innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
});
