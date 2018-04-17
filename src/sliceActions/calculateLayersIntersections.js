import { Z_OFFSET } from '../constants.js';

export default function calculateLayersIntersections(lines, settings) {
  const {
    dimensions: { z: dimensionsZ },
    layerHeight
  } = settings;

  const numLayers = Math.floor((dimensionsZ - Z_OFFSET) / layerHeight);

  const layerPoints = Array.from(Array(numLayers)).map(() => ({}));
  const layerFaceIndexes = Array.from(Array(numLayers)).map(() => []);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    const { line, faces } = lines[lineIndex];

    const min = Math.ceil((Math.min(line.start.y, line.end.y) - Z_OFFSET) / layerHeight);
    const max = Math.floor((Math.max(line.start.y, line.end.y) - Z_OFFSET) / layerHeight);

    for (let layerIndex = min; layerIndex <= max; layerIndex ++) {
      if (layerIndex >= 0 && layerIndex < numLayers) {
        const y = layerIndex * layerHeight + Z_OFFSET;

        let x;
        let z;
        if (line.start.y === line.end.y) {
          x = line.start.x;
          z = line.start.z;
        } else {
          const alpha = (y - line.start.y) / (line.end.y - line.start.y);
          const alpha1 = 1 - alpha;
          x = line.end.x * alpha + line.start.x * alpha1;
          z = line.end.z * alpha + line.start.z * alpha1;
        }

        layerPoints[layerIndex][lineIndex] = { x: z, y: x };
        for (const faceIndex of faces) {
          const layerFaceIndex = layerFaceIndexes[layerIndex];
          if (!layerFaceIndex.includes(faceIndex)) layerFaceIndex.push(faceIndex);
        }
      }
    }
  }

  return { layerPoints, layerFaceIndexes };
}
