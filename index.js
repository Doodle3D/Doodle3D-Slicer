import React from 'react';
import * as THREE from 'three';
import { Interface } from 'doodle3d-slicer';
import fileURL from '!url-loader!./models/shape.json';
import { render } from 'react-dom';
import fileSaver from 'file-saver';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.height = '100%';
document.documentElement.style.height = '100%'
document.getElementById('app').style.height = '100%';

const downloadGCode = ({ gcode: { gcode } }) => {
  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  fileSaver.saveAs(file);
};

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load(fileURL, geometry => {
  render((
    <MuiThemeProvider>
      <Interface
        geometry={geometry}
        onCompleteActions={[{ title: 'Download', callback: downloadGCode }]}
      />
    </MuiThemeProvider>
  ), document.getElementById('app'));
});
