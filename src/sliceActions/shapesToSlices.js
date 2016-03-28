import Slice from '../slice.js';

export default function shapesToSlices(shapes, settings) {
  var slices = [];

  for (var layer = 0; layer < shapes.length; layer ++) {
    var shapeParts = shapes[layer];

    var slice = new Slice();

    var holes = [];
    var outlines = [];

    for (var i = 0; i < shapeParts.length; i ++) {
      var shape = shapeParts[i];

      if (!shape.closed) {
        slice.add(shape);
      }
      else if (shape.isHole()) {
        holes.push(shape);
      }
      else {
        slice.add(shape);
        outlines.push(shape);
      }
    }

    outlines.sort((a, b) => {
      return a.boundSize() - b.boundSize();
    });

    if (holes.length > outlines.length) {
      [holes, outlines] = [outlines, holes];
    }
    else if (holes.length === outlines.length) {
      holes.sort((a, b) => {
        return a.boundSize() - b.boundSize();
      });

      if (holes[0].boundSize > outlines[0].boundSize()) {
        [holes, outlines] = [outlines, holes];
      }
    }

    for (var i = 0; i < holes.length; i ++) {
      var hole = holes[i];

      for (var j = 0; j < outlines.length; j ++) {
        var outline = outlines[j];

        if (outline.pointCollision(hole[0][0])) {
          outline.join(hole);
          break;
        }
      }
    }

    slice.removeSelfIntersect();

    slices.push(slice);
  }

  return slices;
}
