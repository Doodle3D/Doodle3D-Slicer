import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import { sliceGeometry } from '../slicer.js';

export function placeOnGround(mesh) {
  const boundingBox = new THREE.Box3().setFromObject(mesh);

  mesh.position.y -= boundingBox.min.y;
  mesh.updateMatrix();
}

export function createScene(canvas, props, state) {
  const { geometry, pixelRatio } = props;
  const { controlMode, settings } = state;

  // center geometry
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter();
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
  camera.position.set(0, 400, 300);

  const directionalLight = new THREE.DirectionalLight(0xd5d5d5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x808080);
  scene.add(light);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x2194ce, side: THREE.DoubleSide }));
  placeOnGround(mesh);
  scene.add(mesh);

  const box = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0))), 0x72bcd4);
  scene.add(box);

  const { dimensions } = settings;
  box.scale.set(dimensions.y, dimensions.z, dimensions.x);
  box.updateMatrix();

  const editorControls = new THREE.EditorControls(camera, canvas);
  editorControls.focus(mesh);

  const render = () => renderer.render(scene, camera);
  editorControls.addEventListener('change', render);

  const setSize = (width, height, pixelRatio = 1) => {
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  let renderer;
  const updateCanvas = (canvas) => {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0xffffff, 0);
    render();
  };
  updateCanvas(canvas);

  return { editorControls, scene, mesh, camera, renderer, render, box, setSize, updateCanvas };
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

export async function slice(mesh, settings, printers, quality, material, updateProgress) {
  const { dimensions } = settings;
  const centerX = dimensions.x / 2;
  const centerY = dimensions.y / 2;

  const geometry = mesh.geometry.clone();
  mesh.updateMatrix();

  const matrix = new THREE.Matrix4().makeTranslation(centerY, 0, centerX).multiply(mesh.matrix);
  const gcode = await sliceGeometry(settings, geometry, matrix, false, false, ({ progress }) => {
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
