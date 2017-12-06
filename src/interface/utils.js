import * as THREE from 'three';
import { Box3 } from 'three/src/math/Box3.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { AmbientLight } from 'three/src/lights/AmbientLight.js';
import { DirectionalLight } from 'three/src/lights/DirectionalLight.js';
import { MeshPhongMaterial } from 'three/src/materials/MeshPhongMaterial.js';
import { BoxGeometry } from 'three/src/geometries/BoxGeometry.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { BoxHelper } from 'three/src/helpers/BoxHelper.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { DoubleSide } from 'three/src/constants.js';
import 'three/examples/js/controls/EditorControls';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import { sliceGeometry } from '../slicer.js';
import React from 'react';
import PropTypes from 'prop-types';

export function placeOnGround(mesh) {
  const boundingBox = new Box3().setFromObject(mesh);

  mesh.position.y -= boundingBox.min.y;
  mesh.updateMatrix();
}

export function createScene(canvas, props, state) {
  const { geometry, pixelRatio } = props;
  const { controlMode, settings } = state;

  // center geometry
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter();
  geometry.applyMatrix(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));

  const scene = new Scene();

  const camera = new PerspectiveCamera(50, 1, 1, 10000);
  camera.position.set(0, 400, 300);

  const directionalLightA = new DirectionalLight(0xa2a2a2);
  directionalLightA.position.set(1, 1, 1);
  scene.add(directionalLightA);

  const directionalLightB = new DirectionalLight(0xa2a2a2);
  directionalLightB.position.set(-1, 1, -1);
  scene.add(directionalLightB);

  const light = new AmbientLight(0x656565);
  scene.add(light);

  const material = new MeshPhongMaterial({ color: 0x2194ce, side: DoubleSide, specular: 0xc5c5c5, shininess: 5 });
  const mesh = new Mesh(geometry, material);
  placeOnGround(mesh);
  scene.add(mesh);

  const box = new BoxHelper(new Mesh(new BoxGeometry(1, 1, 1).applyMatrix(new Matrix4().makeTranslation(0, 0.5, 0))), 0x72bcd4);
  scene.add(box);

  const { dimensions } = settings;
  box.scale.set(dimensions.y, dimensions.z, dimensions.x);
  box.updateMatrix();

  const render = () => renderer.render(scene, camera);

  const setSize = (width, height, pixelRatio = 1) => {
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  let editorControls;
  let renderer;
  const updateCanvas = (canvas) => {
    if (!renderer || renderer.domElement !== canvas) {
      if (renderer) renderer.dispose();
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setClearColor(0xffffff, 0);
    }
    if (!editorControls || editorControls.domElement !== canvas) {
      if (editorControls) editorControls.dispose();
      editorControls = new THREE.EditorControls(camera, canvas);
      editorControls.focus(mesh);
      editorControls.addEventListener('change', render);
    }

    render();
  };
  updateCanvas(canvas);

  const focus = () => editorControls.focus(mesh);

  return { editorControls, scene, mesh, camera, renderer, render, box, setSize, updateCanvas, focus };
}

export function fetchProgress(url, { method = 'get', headers = {}, body = {} } = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (headers) {
      for (const key in headers) {
        const header = headers[key];
        xhr.setRequestHeader(key, header);
      }
    }
    xhr.onload = event => resolve(event.target.responseText);
    xhr.onerror = reject;
    if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress;
    xhr.send(body);
  });
}

const GCODE_SERVER_URL = 'https://gcodeserver.doodle3d.com';
const CONNECT_URL = 'http://connect.doodle3d.com/';

export async function slice(name, mesh, settings, printers, quality, material, updateProgress) {
  if (!printers) throw new Error('Please select a printer');

  const { dimensions } = settings;
  const centerX = dimensions.x / 2;
  const centerY = dimensions.y / 2;

  const geometry = mesh.geometry.clone();
  mesh.updateMatrix();

  const matrix = new Matrix4().makeTranslation(centerY, 0, centerX).multiply(mesh.matrix);
  const { gcode } = await sliceGeometry(settings, geometry, matrix, false, false, ({ progress }) => {
    updateProgress({
      action: progress.action,
      slicing: progress.done / progress.total
    });
  });

  // upload G-code file to AWS S3
  const { data: { reservation, id } } = await fetch(`${GCODE_SERVER_URL}/upload`, { method: 'POST' })
    .then(response => response.json());

  const body = new FormData();
  const { fields } = reservation;
  for (const key in fields) {
    body.append(key, fields[key]);
  }

  const file = ';' + JSON.stringify({
    name: `${name}.gcode`,
    ...settings,
    printer: {
      type: printers,
      title: printerSettings[printers].title
    },
    material: {
      type: material,
      title: materialSettings[material].title
    },
    quality: {
      type: quality,
      title: qualitySettings[quality].title
    }
  }).trim() + '\n' + gcode;
  body.append('file', file);

  await fetchProgress(reservation.url, { method: 'POST', body }, (progess) => {
    updateProgress({
      action: 'Uploading',
      uploading: progess.loaded / progess.total
    });
  });

  const popup = window.open(`${CONNECT_URL}?uuid=${id}`, '_blank');
  if (!popup) throw new Error('popup was blocked by browser');
}

const styles = {
  width: '100%',
  position: 'relative',
  textAlign: 'initial',
};

export const TabTemplate = ({children, selected, style}) => {
  const templateStyle = Object.assign({}, styles, style);
  if (!selected) {
    templateStyle.height = 0;
    templateStyle.width = 0;
    templateStyle.overflow = 'hidden';
  }

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
