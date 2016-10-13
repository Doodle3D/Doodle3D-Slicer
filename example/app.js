import THREE from 'three.js';
import React from 'react';
import ReactDOM, { render } from 'react-dom';
import * as SLICER from 'src/index.js';
import generateRawData from './generateRawData.js';
import SlicerViewer from './SlicerViewer.js';

const settings = new SLICER.Settings({
	...SLICER.printerSettings['ultimaker2go'],
	...SLICER.userSettings
});

const geometry = new THREE.TorusGeometry(20, 10, 30, 30).clone();
geometry.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(60, 0, 60)));
geometry.mergeVertices();
geometry.computeFaceNormals();

const rawData = generateRawData(geometry, settings);

render(<SlicerViewer
	layerIntersectionPoints={rawData.layerIntersectionPoints}
	layerShapes={rawData.layerShapes}
	settings={settings.config}
/>, document.getElementById('container'));
