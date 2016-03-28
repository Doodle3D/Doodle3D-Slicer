import THREE from 'three.js';

export default function calculateLayersIntersections(lines, settings) {
  console.log('calculating layer intersections');

  var layerHeight = settings.config["layerHeight"];
  var height = settings.config["dimensionsZ"];

  var numLayers = Math.floor(height / layerHeight);

  var layerIntersectionIndexes = [];
  var layerIntersectionPoints = [];
  for (var layer = 0; layer < numLayers; layer ++) {
    layerIntersectionIndexes[layer] = [];
    layerIntersectionPoints[layer] = [];
  }

  for (var lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    var line = lines[lineIndex].line;

    var min = Math.ceil(Math.min(line.start.y, line.end.y) / layerHeight);
    var max = Math.floor(Math.max(line.start.y, line.end.y) / layerHeight);

    for (var layerIndex = min; layerIndex <= max; layerIndex ++) {
      if (layerIndex >= 0 && layerIndex < numLayers) {

        layerIntersectionIndexes[layerIndex].push(lineIndex);

        var y = layerIndex * layerHeight;

        if (line.start.y === line.end.y) {
          var x = line.start.x;
          var z = line.start.z;
        }
        else {
          var alpha = (y - line.start.y) / (line.end.y - line.start.y);
          var x = line.end.x * alpha + line.start.x * (1 - alpha);
          var z = line.end.z * alpha + line.start.z * (1 - alpha);
        }

        layerIntersectionPoints[layerIndex][lineIndex] = new THREE.Vector2(z, x);
      }
    }
  }

  return {
    layerIntersectionIndexes,
    layerIntersectionPoints
  };
}
