import 'babel-polyfill'
import React from 'react';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
// import './fetch.js';

injectTapEventPlugin();

const IP = 'http://10.0.0.109';
const DEFAULT_GCODE = `; Generated with Doodle3D Slicer V0.0.18
G28
G1 X30 Y30
G1 X90 Y30
G1 X30 Y30
G1 X90 Y30
G1 X30 Y30
G1 X90 Y30
G1 X30 Y30
G1 X90 Y30
G1 X30 Y30
G1 X90 Y30
G1 X30 Y30
G1 X90 Y30
; test
`;

const CIRCLE = `; Generated with Doodle3D Slicer V0.0.18
G28
G1 X50 Y70
G1 X56.180339887498945 Y69.02113032590307
G1 X61.75570504584947 Y66.18033988749895
G1 X66.18033988749895 Y61.75570504584947
G1 X69.02113032590307 Y56.180339887498945
G1 X70 Y50
G1 X69.02113032590307 Y43.819660112501055
G1 X66.18033988749895 Y38.24429495415054
G1 X61.75570504584947 Y33.819660112501055
G1 X56.18033988749895 Y30.97886967409693
G1 X50 Y30
G1 X43.819660112501055 Y30.978869674096927
G1 X38.24429495415054 Y33.819660112501055
G1 X33.819660112501055 Y38.24429495415053
G1 X30.97886967409693 Y43.81966011250105
G1 X30 Y49.99999999999999
G1 X30.978869674096927 Y56.180339887498945
G1 X33.81966011250105 Y61.75570504584946
G1 X38.24429495415053 Y66.18033988749895
G1 X43.81966011250105 Y69.02113032590307
; test
`;

// export function fetch(url, data = {}, onProgress) {
//   return new Promise((resolve, reject) => {
//     const request = new Request(url, data);
//     const xhr = new XMLHttpRequest();
//
//     xhr.onload = () => {
//       const { status, statusText, responseURL: url } = xhr;
//       resolve(new Response(xhr.response, { status, statusText, url }));
//     }
//     xhr.onerror = () => reject(new TypeError('Network request failed'));
//     xhr.ontimeout = () => reject(new TypeError('Network request failed'));
//
//     xhr.open(request.method, url);
//
//     if (request.credentials === 'include') {
//       xhr.withCredentials = true
//     } else if (request.credentials === 'omit') {
//       xhr.withCredentials = false
//     }
//     if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress;
//     if (xhr.responseType) xhr.responseType = 'blob';
//
//     request.headers.forEach((value, name) => {
//       xhr.setRequestHeader(name, value)
//     });
//
//     xhr.send(data.body);
//   });
// }

class Print extends React.Component {
  home = () => fetch(`${IP}/set?code=G28`, { method: 'GET', mode: 'no-cors' });
  status = () => fetch(`${IP}/inquiry`, { method: 'GET', mode: 'no-cors' })
    .then(response => response.text())
    .then(result => console.log('result: ', result));
  start = () => fetch(`${IP}/set?code=M565`, { method: 'GET', mode: 'no-cors' });
  stop = () => fetch(`${IP}/set?cmd={P:X}`, { method: 'GET', mode: 'no-cors' });
  upload = async () => {
    const gcode = this.refs.gcode.value;

    const headers = new Headers();
    headers.append('Content-Disposition', 'form-data; name="file"; filename="doodle.gcode"');
    headers.append('Content-Type', 'application/octet-stream');
    headers.append('Accept', 'application/json');

    const body = new FormData();
    const file = new File([gcode], 'doodle.gcode', { type: 'application/octet-stream' });
    body.append('file', file);

    const result = await fetch(`${IP}/upload`, { method: 'POST', mode: 'no-cors', headers, body });
  };

  render() {
    return (
      <span>
        <button onTouchTap={this.home} type="button">Home</button>
        <button onTouchTap={this.status} type="button">Status</button>
        <button onTouchTap={this.start} type="button">Start</button>
        <button onTouchTap={this.stop} type="button">Stop</button>
        <div>
          <textarea ref="gcode" cols="80" rows="20" defaultValue={CIRCLE} />
          <button onTouchTap={this.upload} type="button">Upload</button>
        </div>
      </span>
    );
  }
}

render((
  <Print />
), document.getElementById('app'));
