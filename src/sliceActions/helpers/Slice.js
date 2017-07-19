import Shape from 'Doodle3D/clipper-js';

export default class {
  constructor() {
    this.parts = [];
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
