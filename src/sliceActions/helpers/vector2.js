export const subtract = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y
});
export const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
});
export const scale = (v, factor) => ({
  x: v.x * factor,
  y: v.y * factor
});
export const divide = (v, factor) => ({
  x: v.x / factor,
  y: v.y / factor
});
export const normal = (v) => ({
  x: -v.y,
  y: v.x
});
export const equals = (a, b) => a.x === b.x && a.y === b.y;
export const almostEquals = (a, b) => Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
export const distanceTo = (a, b) => length(subtract(a, b));
export const angle = (v) => Math.atan2(v.y, v.x);
export const normalize = (v) => {
  const l = length(v);

  return {
    x: v.x / l,
    y: v.y / l
  };
};
