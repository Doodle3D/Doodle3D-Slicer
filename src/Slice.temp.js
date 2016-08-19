import Shape from 'Doodle3D/clipper-js';

export default class {
	constructor() {
		this.parts = [];
	}
	getOutline() {
		const outLines = new Shape([], true);

		for (let i = 0; i < this.parts.length; i ++) {
			const part = this.parts[i];

			if (part.shape.closed) {
				outLines.join(this.parts[i].outerLine);
			}
		}

		return outLines;
	}
	add(shape) {
		const part = { shape };

		if (shape.closed) {
			part.innerLines = [];
			part.outerLine = new Shape([], true);
			part.fill = new Shape([], false);
		}

		this.parts.push(part);
	}
}
