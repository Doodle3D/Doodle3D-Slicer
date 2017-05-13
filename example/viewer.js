import * as THREE from 'three.js';
import stlLoader from 'three.js/loaders/STLLoader';
import React from 'react';
import ReactDOM, { render } from 'react-dom';
import * as SLICER from 'src/index.js';
import generateRawData from './generateRawData.js';
import SlicerViewer from './SlicerViewer.js';

const settings = new SLICER.Settings({
  ...SLICER.printerSettings['ultimaker2go'],
  ...SLICER.userSettings
});

const stlLoader = new THREE.STLLoader();
stlLoader.load('stl/Airplane.stl', (geometry) => {
  geometry = new THREE.Geometry().fromBufferGeometry(geometry);

  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / -2));
  geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(50, -0.1, 50)));
  // geometry.applyMatrix(new THREE.Matrix4().scale(0.8));
  geometry.mergeVertices();
  geometry.computeFaceNormals();

  const rawData = generateRawData(geometry, settings);

  render(
    <SlicerViewer
      layerIntersectionPoints={rawData.layerIntersectionPoints}
      layerShapes={rawData.layerShapes}
      slices={rawData.slices}
      settings={settings.config}
    />,
    document.getElementById('container')
  );
});
