import 'babel-polyfill'
import React from 'react';
import { Interface } from 'doodle3d-slicer';
import { render } from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';
import queryString from 'query-string';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { blue400, blue500, blue700 } from 'material-ui/styles/colors';

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: blue500,
    primary2Color: blue700,
    primary3Color: blue400,
    accent1Color: blue500,
  }
});

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

const { file } = queryString.parse(location.search);

render((
  <MuiThemeProvider muiTheme={muiTheme}>
    <Interface file={file} name="doodle"/>
  </MuiThemeProvider>
), document.getElementById('app'));
