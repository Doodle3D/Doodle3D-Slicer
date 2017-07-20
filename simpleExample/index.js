import * as THREE from 'three';
import { defaultSettings, Slicer } from 'doodle3d-slicer';

const settings = {
  ...defaultSettings.base,
  ...defaultSettings.material.pla,
  ...defaultSettings.printer.ultimaker2go,
  ...defaultSettings.quality.high
};

const geometry = new THREE.TorusGeometry(20, 10, 30, 30).clone();

const slicer = new Slicer();
slicer.setGeometry(geometry);
slicer.slice(settings, onProgress).then(gcode => {
  document.body.innerHTML = gcode.replace(/(?:\r\n|\r|\n)/g, '<br />');
});
function onProgress(data) {
  console.log('progress: ', data);
}