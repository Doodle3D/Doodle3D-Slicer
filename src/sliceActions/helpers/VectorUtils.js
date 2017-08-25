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
export const normal = (a) => ({
  x: -a.y,
  y: a.x
});
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const length = (a) => Math.sqrt(a.x * a.x + a.y * a.y);
export const distanceTo = (a, b) => length(subtract(a, b));
export const normalize = (a) => {
  const l = length(a);

  return {
    x: a.x / l,
    y: a.y / l
  };
}
