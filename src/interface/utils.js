import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import { sliceGeometry } from '../slicer.js';
import React from 'react';
import PropTypes from 'prop-types';

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

export function createScene({ muiTheme }) {
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

  box.scale.set(1, 1, 1);
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

export function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export async function slice(mesh, settings, updateProgress) {
  let steps = 1;
  let currentStep = 0;

  const { dimensions } = settings;
  const centerX = dimensions.x / 2;
  const centerY = dimensions.y / 2;

  const matrix = new THREE.Matrix4().makeTranslation(centerY, 0, centerX)
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2.0))
    .multiply(mesh.matrix);

  const sliceResult = await sliceGeometry({
    ...settings,
    printer: { type: settings.printers, title: printerSettings[settings.printer].title },
    material: { type: settings.material, title: materialSettings[settings.material].title },
    quality: { type: settings.quality, title: qualitySettings[settings.quality].title }
  }, mesh.geometry, mesh.material, matrix, false, false, ({ progress }) => {
    updateProgress({
      action: progress.action,
      percentage: (currentStep + progress.done / progress.total) / steps
    });
  }).catch(error => {
    throw { message: `error during slicing: ${error.message}`, code: 2 };
  });
  currentStep ++;

  return sliceResult;
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
  style: PropTypes.object
};
