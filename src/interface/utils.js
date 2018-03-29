import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import { sliceGeometry } from '../slicer.js';
import { grey800, red500 } from 'material-ui/styles/colors';
import React from 'react';
import PropTypes from 'prop-types';
import fileSaver from 'file-saver';
import { Doodle3DBox } from 'doodle3d-api';

export function placeOnGround(mesh) {
  const boundingBox = new THREE.Box3().setFromObject(mesh);

  mesh.position.y -= boundingBox.min.y;
  mesh.updateMatrix();
}

export function centerGeometry(mesh) {
  // center geometry
  mesh.geometry.computeBoundingBox();
  const center = mesh.geometry.boundingBox.getCenter();
  mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
}

export function createScene({ pixelRatio, muiTheme }) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
  camera.position.set(0, 400, 300);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const directionalLightA = new THREE.DirectionalLight(0xa2a2a2);
  directionalLightA.position.set(1, 1, 1);
  scene.add(directionalLightA);

  const directionalLightB = new THREE.DirectionalLight(0xa2a2a2);
  directionalLightB.position.set(-1, 1, -1);
  scene.add(directionalLightB);

  const light = new THREE.AmbientLight(0x656565);
  scene.add(light);

  const material = new THREE.MeshPhongMaterial({ color: muiTheme.palette.primary2Color, side: THREE.DoubleSide, specular: 0xc5c5c5, shininess: 5, flatShading: false });
  const mesh = new THREE.Mesh(new THREE.Geometry(), material);
  scene.add(mesh);

  const box = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0))), muiTheme.palette.primary2Color);
  scene.add(box);

  let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  let editorControls = new THREE.EditorControls(camera, renderer.domElement);

  box.scale.set(1., 1., 1.);
  box.updateMatrix();

  const render = () => renderer.render(scene, camera);

  const setSize = (width, height, pixelRatio = 1) => {
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const updateCanvas = (canvas) => {
    if (!renderer || renderer.domElement !== canvas) {
      if (renderer) renderer.dispose();
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setClearColor(0xffffff, 0);
    }
    if (!editorControls || editorControls.domElement !== canvas) {
      if (editorControls) editorControls.dispose();
      editorControls = new THREE.EditorControls(camera, canvas);
      editorControls.addEventListener('change', render);
    }

    render();
  };

  const focus = () => editorControls.focus(mesh);

  return { editorControls, scene, mesh, camera, renderer, render, box, setSize, updateCanvas, focus };
}

export function fetchProgress(url, data = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new Request(url, data);
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(new Response(xhr.response));
      // const headers = new Headers(xhr.getAllResponseHeaders() || '');
      // const { status, statusText, response, responseText, responseURL: url = headers.get('X-Request-URL') } = xhr;
      // resolve(new Response(response || responseText, { headers, status, statusText, url }));
    }
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.ontimeout = () => reject(new TypeError('Network request failed'));

    xhr.open(request.method, url, true);

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }
    if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress;
    if (xhr.responseType) xhr.responseType = 'blob';

    // request.headers.forEach((value, name) => xhr.setRequestHeader(name, value));

    xhr.send(data.body);
  });
}

export function getMalyanStatus(ip) {
  return fetch(`http://${ip}/inquiry`, { method: 'GET' })
    .then(response => response.text())
    .then(statusText => {
      const [nozzleTemperature, nozzleTargetTemperature, bedTemperature, bedTargetTemperature, progress] = statusText.match(/\d+/g);
      const status = { nozzleTemperature, nozzleTargetTemperature, bedTemperature, bedTargetTemperature, progress };

      switch (statusText.charAt(statusText.length - 1)) {
        case 'I':
          status.state = 'idle';
          break;
        case 'P':
          status.state = 'printing';
          break;
        default:
          status.state = 'unknown';
          break;
      }
      return status;
    })
}

export function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const GCODE_SERVER_URL = 'https://gcodeserver.doodle3d.com';

export async function slice(action, name, mesh, settings, updateProgress) {
  let steps;
  let currentStep = 0;
  let wifiBox;
  switch (action.target) {
    case 'DOWNLOAD':
      steps = 1;
      break;
    case 'WIFI_PRINT':
      if (settings.printer === 'doodle3d_printer') {
        const { state } = await getMalyanStatus(settings.ip);
        if (state !== 'idle') throw { message: 'printer is busy', code: 0 };

      } else {
        wifiBox = new Doodle3DBox(settings.ip);
        if (!await wifiBox.checkAlive()) throw { message: `can't connect to printer`, code: 4 }

        const { state } = await wifiBox.info.status();
        if (state !== 'idle') throw { message: 'printer is busy', code: 0 };
      }
      steps = 2;
      break;
    case 'CUSTOM_UPLOAD':
      steps = 2;
      break;
    default:
      throw { message: 'unknown target', code: 1 };
      break;
  }

  const { dimensions } = settings;
  const centerX = dimensions.x / 2;
  const centerY = dimensions.y / 2;

  const matrix = new THREE.Matrix4().makeTranslation(centerY, 0, centerX)
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2.0))
    .multiply(mesh.matrix);

  const { gcode } = await sliceGeometry(settings, mesh.geometry, mesh.material, matrix, false, false, ({ progress }) => {
    updateProgress({
      action: progress.action,
      percentage: (currentStep + progress.done / progress.total) / steps
    });
  }).catch(error => {
    throw { message: `error during slicing: ${error.message}`, code: 2 };
  });
  currentStep ++;

  switch (action.target) {
    case 'DOWNLOAD': {
      const file = new Blob([gcode], { type: 'text/plain' });
      fileSaver.saveAs(file, `${name}.gcode`);
      break;
    }

    case 'WIFI_PRINT': {
      if (settings.printer === 'doodle3d_printer') {
        const body = new FormData();
        const file = new Blob([gcode], { type: 'plain/text' });
        body.append('file', file, 'doodle.gcode');

        // because fetch has no way of retrieving progress we fake progress
        let loaded = 0;
        const interval = setInterval(() => {
          loaded += 15 * 1024;
          updateProgress({
            action: 'Uploading to printer',
            percentage: (currentStep + loaded / file.size) / steps
          });
        }, 1000);

        // await fetchProgress(`http://${settings.ip}/set?code=M563 S4`, { method: 'GET' });
        await fetch(`http://${settings.ip}/upload`, { method: 'POST', body, mode: 'no-cors' }, (progress) => {
          updateProgress({
            action: 'Uploading to printer',
            percentage: (currentStep + progress.loaded / progress.total) / steps
          });
        });
        clearInterval(interval);
        await fetch(`http://${settings.ip}/set?code=M566 ${name}.gcode`, { method: 'GET', mode: 'no-cors' });
        await fetch(`http://${settings.ip}/set?code=M565`, { method: 'GET', mode: 'no-cors' });

        currentStep ++;
      } else {
        // upload G-code file to AWS S3
        const { data: { reservation: { fields, url }, id } } = await fetch(`${GCODE_SERVER_URL}/upload`, { method: 'POST' })
          .then(response => response.json());

        const body = new FormData();
        for (const key in fields) {
          body.append(key, fields[key]);
        }

        const file = new Blob([`;${JSON.stringify({
          ...settings,
          name: `${name}.gcode`,
          printer: { type: settings.printers, title: printerSettings[settings.printer].title },
          material: { type: settings.material, title: materialSettings[settings.material].title },
          quality: { type: settings.quality, title: qualitySettings[settings.quality].title }
        }).trim()}\n${gcode}`]);
        body.append('file', file, 'doodle.gcode');

        await fetchProgress(url, { method: 'POST', body }, progress => {
          updateProgress({
            action: 'Uploading',
            percentage: (currentStep + progress.loaded / progress.total) / steps
          });
        });
        currentStep ++;

        const result = await wifiBox.printer.fetch(id);
      }
      break;
    }
    case 'CUSTOM_UPLOAD': {
      const body = new FormData();
      const file = new Blob([`;${JSON.stringify({
        ...settings,
        name: `${name}.gcode`,
        printer: { type: settings.printers, title: printerSettings[settings.printer].title },
        material: { type: settings.material, title: materialSettings[settings.material].title },
        quality: { type: settings.quality, title: qualitySettings[settings.quality].title }
      }).trim()}\n${gcode}`]);
      body.append('file', file, 'doodle.gcode');

      await fetchProgress(action.url, { method: 'POST', body }, progress => {
        updateProgress({
          action: 'Uploading',
          percentage: (currentStep + progress.loaded / progress.total) / steps
        });
      });
      currentStep ++;
      break;
    }

    default:
      throw { message: 'unknown target', code: 1 };
      break;
  }
}

export const TabTemplate = ({ children, selected, style }) => {
  const templateStyle = {
    width: '100%',
    position: 'relative',
    textAlign: 'initial',
    ...style,
    ...(selected ? {} : {
      height: 0,
      width: 0,
      overflow: 'hidden'
    })
  };

  return (
    <div style={templateStyle}>
      {children}
    </div>
  );
};

TabTemplate.propTypes = {
  children: PropTypes.node,
  selected: PropTypes.bool,
  style: PropTypes.object,
};
