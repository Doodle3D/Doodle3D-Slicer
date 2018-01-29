import { sliceGeometry, sliceMesh } from './slicer.js';
import Interface from './interface/index.js';
import _defaultSettings from './settings/default.yml';
import printerSettings from './settings/printer.yml';
import materialSettings from './settings/material.yml';
import qualitySettings from './settings/quality.yml';
import infillSettings from './settings/infill.yml';

const defaultSettings = {
  default: _defaultSettings,
  printer: printerSettings,
  material: materialSettings,
  quality: qualitySettings,
  infill: infillSettings
};

export {
  sliceGeometry,
  sliceMesh,
  Interface,
  defaultSettings
};
