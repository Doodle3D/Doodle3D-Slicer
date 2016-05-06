import THREE from 'three.js';
import EventDispatcher from 'casperlamboo/EventDispatcher';
import calculateLayersIntersections from './sliceActions/calculateLayersIntersections.js';
import createLines from './sliceActions/createLines.js';
import generateInfills from './sliceActions/generateInfills.js';
import generateInnerLines from './sliceActions/generateInnerLines.js';
import generateSupport from './sliceActions/generateSupport.js';
import intersectionsToShapes from './sliceActions/intersectionsToShapes.js';
import addBrim from './sliceActions/addBrim.js';
import optimizePaths from './sliceActions/optimizePaths.js';
import shapesToSlices from './sliceActions/shapesToSlices.js';
import slicesToGCode from './sliceActions/slicesToGCode.js';

export default class extends EventDispatcher {
	constructor () {
		super();

		this.progress = {
			createdLines: false,
			calculatedLayerIntersections: false,
			sliced: false,
			generatedSlices: false,
			generatedInnerLines: false,
			generatedInfills: false,
			generatedSupport: false,
			optimizedPaths: false,
			generatedGCode: false
		};
	}

	setMesh (mesh) {
		mesh.updateMatrix();

		this.setGeometry(mesh.geometry, mesh.matrix);

		return this;
	}

	setGeometry (geometry, matrix) {
		if (geometry.type === 'BufferGeometry') {
			geometry = new THREE.Geometry().fromBufferGeometry(geometry);
		}
		else if (geometry.type.endsWith('Geometry')) {
			geometry = geometry.clone();
		}
		else {
			console.warn('Geometry is not an instance of BufferGeometry or Geometry');
			return;
		}

		if (matrix instanceof THREE.Matrix4) {
			geometry.applyMatrix(matrix);
		}

		geometry.mergeVertices();
		geometry.computeFaceNormals();

		this.geometry = geometry;

		return this;
	}

	slice (settings) {
		const supportEnabled = settings.config['supportEnabled'];

		// get unique lines from geometry;
		const lines = createLines(this.geometry, settings);
		this.progress.createdLines = true;
	  this._updateProgress(settings);

		const {
			layerIntersectionIndexes,
			layerIntersectionPoints
		} = calculateLayersIntersections(lines, settings);
		this.progress.calculatedLayerIntersections = true;
	  this._updateProgress(settings);

		const shapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);
		this.progress.sliced = true;
	  this._updateProgress(settings);

		const slices = shapesToSlices(shapes, settings);
		this.progress.generatedSlices = true;
		this._updateProgress(settings);

		generateInnerLines(slices, settings);
		this.progress.generatedInnerLines = true;
	  this._updateProgress(settings);

		generateInfills(slices, settings);
		this.progress.generatedInfills = true;
	  this._updateProgress(settings);

		if (supportEnabled) {
			generateSupport(slices, settings);
			this.progress.generatedSupport = true;
			this._updateProgress(settings);
		}

		addBrim(slices, settings);

		optimizePaths(slices, settings);
		this.progress.optimizedPaths = true;
	  this._updateProgress(settings);

		var gcode = slicesToGCode(slices, settings);
		this.progress.generatedGCode = true;
	  this._updateProgress(settings);

		this.dispatchEvent({ type: 'finish', gcode });

		return gcode;
	}

	_updateProgress (settings) {
		var supportEnabled = settings.config['supportEnabled'];

		var progress = {};

		var procent = 0;
		var length = 0;
		for (var i in this.progress) {
			if (!(!supportEnabled && i === 'generatedSupport')) {
				progress[i] = this.progress[i];
				if (progress[i]) {
					procent += 1;
				}
				length += 1;
			}
		}

		progress.procent = procent / length;

		this.dispatchEvent({ type: 'progress', progress 	});
	}
}
