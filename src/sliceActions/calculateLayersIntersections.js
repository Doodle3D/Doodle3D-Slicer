import THREE from 'three.js';

export default function calculateLayersIntersections(lines, settings) {
  console.log('calculating layer intersections');

  const { layerHeight, dimensionsZ: height } = settings.config;

  const numLayers = Math.floor(height / layerHeight);

  const layerIntersectionIndexes = [];
  const layerIntersectionPoints = [];
  for (let layer = 0; layer < numLayers; layer ++) {
    layerIntersectionIndexes[layer] = [];
    layerIntersectionPoints[layer] = [];
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    const line = lines[lineIndex].line;

    const min = Math.ceil(Math.min(line.start.y, line.end.y) / layerHeight);
    const max = Math.floor(Math.max(line.start.y, line.end.y) / layerHeight);

    for (let layerIndex = min; layerIndex <= max; layerIndex ++) {
      if (layerIndex >= 0 && layerIndex < numLayers) {

        layerIntersectionIndexes[layerIndex].push(lineIndex);

        const y = layerIndex * layerHeight;
        let x, z;

        if (line.start.y === line.end.y) {
          x = line.start.x;
          z = line.start.z;
        }
        else {
          const alpha = (y - line.start.y) / (line.end.y - line.start.y);
          x = line.end.x * alpha + line.start.x * (1 - alpha);
          z = line.end.z * alpha + line.start.z * (1 - alpha);
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
