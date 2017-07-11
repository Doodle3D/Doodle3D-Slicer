import Slicer from './Slicer.js';
import defaultSettings from './settings/default.yml!text';
import printerSettings from './settings/printer.yml!text';
import materialSettings from './settings/material.yml!text';
import qualitySettings from './settings/quality.yml!text';
import yaml from 'js-yaml';

const ds = {
    base: yaml.safeLoad(defaultSettings),
    printer: yaml.safeLoad(printerSettings),
    material: yaml.safeLoad(materialSettings),
    quality: yaml.safeLoad(qualitySettings)
};

export { 
  Slicer, 
  ds as defaultSettings
};
