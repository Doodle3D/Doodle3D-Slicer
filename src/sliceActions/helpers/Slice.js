import Shape from 'clipper-js';

export default class {
  constructor() {
    this.parts = [];
  }
  add(shape, closed) {
    const part = { shape, closed };

    if (closed) {
      part.shell = [];
      part.innerFill = new Shape([], false);
      part.outerFill = new Shape([], false);
    }

    this.parts.push(part);
  }
}
