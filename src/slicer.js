import THREE from 'three.js';
import EventDispatcher from 'EventDispatcher';
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
import applyPrecision from './sliceActions/applyPrecision.js';
import removePrecision from './sliceActions/removePrecision.js';

export default class extends EventDispatcher {
	setMesh(mesh) {
		mesh.updateMatrix();

		this.setGeometry(mesh.geometry, mesh.matrix);

		return this;
	}
	setGeometry(geometry, matrix) {
		if (geometry instanceof THREE.BufferGeometry) {
			geometry = new THREE.Geometry().fromBufferGeometry(geometry);
		} else if (geometry instanceof THREE.Geometry) {
			geometry = geometry.clone();
		} else {
			throw 'Geometry is not an instance of BufferGeometry or Geometry';
		}

		if (matrix instanceof THREE.Matrix4) {
			geometry.applyMatrix(matrix);
		}

		geometry.mergeVertices();
		geometry.computeFaceNormals();

		this.geometry = geometry;

		return this;
	}
	slice(settings) {
		// get unique lines from geometry;
		const lines = createLines(this.geometry, settings);

		const {
			layerIntersectionIndexes,
			layerIntersectionPoints
		} = calculateLayersIntersections(lines, settings);

		const shapes = intersectionsToShapes(layerIntersectionIndexes, layerIntersectionPoints, lines, settings);

		applyPrecision(shapes);

		const slices = shapesToSlices(shapes, settings);

		generateInnerLines(slices, settings);
		generateInfills(slices, settings);
		generateSupport(slices, settings);
		addBrim(slices, settings);
		optimizePaths(slices, settings);
		removePrecision(slices);

		const gcode = slicesToGCode(slices, settings);

		this.dispatchEvent({ type: 'finish', gcode });
		return gcode;
	}
}
