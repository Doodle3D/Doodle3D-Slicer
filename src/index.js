import Slicer from './slicer.js';
import SlicerWorker from './slicerworker.js';
import Settings from './settings.js';
import ClipperLib from 'clipper-lib';

ClipperLib.Error = function (message) {
	console.error(message);
};

export {Slicer, SlicerWorker, Settings};
