import React from 'react';
import * as THREE from 'three';
import { Interface } from 'doodle3d-slicer';
import fileURL from '!url-loader!./models/shape.json';
import { render } from 'react-dom';
import fileSaver from 'file-saver';

const downloadGCode = gcode => {
  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  fileSaver.saveAs(file);
};

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load(fileURL, geometry => {
  render((
    <div style={{ position: 'absolute', border: '1px solid black' }}>
      <Interface
        geometry={geometry}
        onCompleteActions={[{ title: 'Download', callback: downloadGCode }]}
      />
    </div>
  ), document.getElementById('app'));
});
