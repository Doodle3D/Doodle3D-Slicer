export const subtract = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});
export const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});
export const scale = (v, factor) => ({
  x: v.x * factor,
  y: v.y * factor,
  z: v.z * factor
});
export const divide = (v, factor) => ({
  x: v.x / factor,
  y: v.y / factor,
  z: v.z / factor
});
export const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});
export const equals = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;
export const almostEquals = (a, b) => Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.z - b.z) < 0.001;
export const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
export const distanceTo = (a, b) => length(subtract(a, b));
export const normalize = (v) => {
  const l = length(v);

  return {
    x: v.x / l,
    y: v.y / l,
    z: v.z / l
  };
};
