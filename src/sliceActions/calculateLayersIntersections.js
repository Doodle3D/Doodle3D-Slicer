import * as THREE from 'three';

export default function calculateLayersIntersections(lines, settings) {
  const {
    dimensions: { z: dimensionsZ },
    layerHeight,
    zOffset
  } = settings;

  const numLayers = Math.floor((dimensionsZ - zOffset) / layerHeight);

  const layerIntersectionIndexes = Array.from(Array(numLayers)).map(() => []);
  const layerIntersectionPoints = Array.from(Array(numLayers)).map(() => []);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    const { line, isFlat } = lines[lineIndex];

    if (isFlat) continue;

    const min = Math.ceil((Math.min(line.start.y, line.end.y) - zOffset) / layerHeight);
    const max = Math.floor((Math.max(line.start.y, line.end.y) - zOffset) / layerHeight);

    for (let layerIndex = min; layerIndex <= max; layerIndex ++) {
      if (layerIndex >= 0 && layerIndex < numLayers) {

        layerIntersectionIndexes[layerIndex].push(lineIndex);

        const y = layerIndex * layerHeight + zOffset;

        let x, z;
        if (line.start.y === line.end.y) {
          x = line.start.x;
          z = line.start.z;
        } else {
          const alpha = (y - line.start.y) / (line.end.y - line.start.y);
          const alpha1 = 1 - alpha;
          x = line.end.x * alpha + line.start.x * alpha1;
          z = line.end.z * alpha + line.start.z * alpha1;
        }

        layerIntersectionPoints[layerIndex][lineIndex] = new THREE.Vector2(z, x);
      }
    }
  }

  return { layerIntersectionIndexes, layerIntersectionPoints };
}
