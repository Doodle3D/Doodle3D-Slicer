import 'babel-polyfill';
import React from 'react';
import { Interface } from './src/index.js';
import { render } from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';
import queryString from 'query-string';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { grey400, blue500, blue700 } from 'material-ui/styles/colors';
import bunny_url from './data/bunny.stl';
import * as THREE from 'three';
import 'three/examples/js/loaders/STLLoader.js';
import fileSaver from 'file-saver';

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: blue500,
    primary2Color: blue700,
    accent1Color: blue500,
  }
});

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

new THREE.STLLoader().load(bunny_url, geometry => {
  const material = new THREE.MeshPhongMaterial({ color: 0xff5533, specular: 0x111111, shininess: 200 });
  const mesh = new THREE.Mesh(geometry, material);
  render((
    <MuiThemeProvider muiTheme={muiTheme}>
      <Interface
        mesh={mesh}
        onSliceSucces={({ gcode }) => fileSaver.saveAs(gcode, 'bunny.gcode')}
      />
    </MuiThemeProvider>
  ), document.getElementById('app'));
});
