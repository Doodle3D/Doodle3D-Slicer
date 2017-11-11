import React from 'react';
import * as THREE from 'three';
import { Interface } from 'doodle3d-slicer';
import fileURL from '!url-loader!./models/combingtest.json';
import { render } from 'react-dom';
// import fileSaver from 'file-saver';

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load(fileURL, geometry => {
  render(
    <Interface geometry={geometry} />,
    document.getElementById('app')
  );
});
