import React from 'react';
import { Interface } from 'doodle3d-slicer';
import doodleURL from '!url-loader!./models/Doodle_2.d3sketch';
import { render } from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';
import JSONToSketchData from 'doodle3d-core/shape/JSONToSketchData';
import createSceneData from 'doodle3d-core/d3/createSceneData.js';

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

function init(sketch) {
  render((
    <MuiThemeProvider>
      <Interface sketch={sketch} name="doodle"/>
    </MuiThemeProvider>
  ), document.getElementById('app'));
}

fetch(doodleURL)
  .then(resonse => resonse.json())
  .then(json => JSONToSketchData(json))
  .then(file => createSceneData(file))
  .then(init);
