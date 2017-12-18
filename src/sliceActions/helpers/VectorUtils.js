export const subtract = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y
});
export const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
});
export const scale = (a, factor) => ({
  x: a.x * factor,
  y: a.y * factor
});
export const devide = (a, factor) => ({
  x: a.x / factor,
  y: a.y / factor
});
export const normal = (a) => ({
  x: -a.y,
  y: a.x
});
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
export const distanceTo = (a, b) => length(subtract(a, b));
export const normalize = (v) => {
  const l = length(v);

  return {
    x: v.x / l,
    y: v.y / l
  };
}
export const clone = (v) => ({ x: v.x, y: v.y });
