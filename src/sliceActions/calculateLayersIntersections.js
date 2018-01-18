import { Z_OFFSET } from '../constants.js';

export default function calculateLayersIntersections(lines, settings) {
  const {
    dimensions: { z: dimensionsZ },
    layerHeight
  } = settings;

  const numLayers = Math.floor((dimensionsZ - Z_OFFSET) / layerHeight);

  const layers = Array.from(Array(numLayers)).map(() => ({
    points: {},
    faceIndexes: []
  }));

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    const { line, faces } = lines[lineIndex];

    const min = Math.ceil((Math.min(line.start.y, line.end.y) - Z_OFFSET) / layerHeight);
    const max = Math.floor((Math.max(line.start.y, line.end.y) - Z_OFFSET) / layerHeight);

    for (let layerIndex = min; layerIndex <= max; layerIndex ++) {
      if (layerIndex >= 0 && layerIndex < numLayers) {
        const y = layerIndex * layerHeight + Z_OFFSET;

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

        layers[layerIndex].points[lineIndex] = { x: z, y: x };
        layers[layerIndex].faceIndexes.push(...faces);
      }
    }
  }

  for (let i = 0; i < layers.length; i ++) {
    const layer = layers[i];

    layer.faceIndexes = layer.faceIndexes.reduce((result, faceIndex) => {
      if (!result.includes(faceIndex)) result.push(faceIndex);
      return result;
    }, []);
  }

  return layers;
}
