import React from 'react';
import { JSONLoader } from 'three/src/loaders/JSONLoader.js';
import { Interface } from 'doodle3d-slicer';
import fileURL from '!url-loader!./models/shape.json';
import { render } from 'react-dom';
import fileSaver from 'file-saver';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';

injectTapEventPlugin();

jss.setup(preset());
jss.createStyleSheet(normalize).attach();
jss.createStyleSheet({
  '@global': {
    '*': { margin: 0, padding: 0 },
    '#app, body, html': { height: '100%', fontFamily: 'sans-serif' },
    body: { overflow: 'auto' },
    html: { overflow: 'hidden' }
  }
}).attach();

const downloadGCode = ({ gcode: { gcode } }) => {
  const file = new File([gcode], 'gcode.gcode', { type: 'text/plain' });
  fileSaver.saveAs(file);
};

const jsonLoader = new JSONLoader();
jsonLoader.load(fileURL, geometry => {
  render((
    <MuiThemeProvider>
      <Interface geometry={geometry} name="Doodle3D"/>
    </MuiThemeProvider>
  ), document.getElementById('app'));
});
