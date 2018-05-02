import { add, divide, distanceTo, normalize, subtract, normal, dot } from './src/sliceActions/helpers/vector2.js';
import { pointIsInsideConvex, decompose, findClosestPath, containLineInPath } from './src/sliceActions/helpers/comb.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 610;
canvas.height = 610;
const context = canvas.getContext('2d');
context.lineJoin = 'bevel';

function circle(radius = 10, x = 0, y = 0, clockWise = true, segments = 40) {
  const shape = [];

  for (let rad = 0; rad < Math.PI * 2; rad += Math.PI * 2 / segments) {
    if (clockWise) {
      shape.push({ x: Math.cos(rad) * radius + x, y: Math.sin(rad) * radius + y });
    } else {
      shape.push({ x: Math.cos(rad) * radius + x, y: -Math.sin(rad) * radius + y });
    }
  }

  return shape;
}

const START = { x: 30, y: 550 };
const END = { x: 400, y: 300 };
// const CONCAVE_POLYGON = [[
//   { x: 10, y: 10 },
//   { x: 600, y: 10 },
//   { x: 500, y: 200 },
//   { x: 600, y: 600 },
//   { x: 10, y: 600 }
// ], [
//   { x: 160, y: 120 },
//   { x: 120, y: 400 },
//   { x: 400, y: 400 }
// ]];
const CONCAVE_POLYGON = [
  circle(300, 305, 305, true),
  circle(40, 305, 105, false),
  circle(40, 305, 205, false),
  circle(40, 305, 305, false),
  circle(40, 305, 405, false),
  circle(40, 305, 505, false)
];

canvas.onmousedown = (event) => {
  START.x = event.offsetX;
  START.y = event.offsetY;
  compute();
};
canvas.onmousemove = (event) => {
  END.x = event.offsetX;
  END.y = event.offsetY;
  compute();
};
compute();

function compute() {
  const { convexPolygons, vertices } = decompose(CONCAVE_POLYGON);
  const startPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(START, face, vertices));
  const endPolygon = convexPolygons.findIndex(({ face }) => pointIsInsideConvex(END, face, vertices));
  if (startPolygon === -1 || endPolygon === -1) return;

  const path = findClosestPath(convexPolygons, startPolygon, endPolygon);
  if (!path) return;
  const line = containLineInPath(path, START, END, vertices);

  // draw
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  for (const shape of CONCAVE_POLYGON) {
    let first = true;
    for (const { x, y } of shape) {
      if (first) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
      first = false;
    }
  }
  context.closePath();
  context.fillStyle = 'lightgray';
  context.fill();

  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 1;
  context.font = '14px arial';
  for (let i = 0; i < convexPolygons.length; i ++) {
    const { face, center } = convexPolygons[i];

    context.beginPath();
    for (const index of face) {
      const vertex = vertices[index];
      context.lineTo(vertex.x, vertex.y);
    }
    context.closePath();
    context.stroke();

    context.fillText(i, center.x, center.y);
  }

  if (path) {
    context.beginPath();
    for (const { edge: [indexA, indexB] } of path) {
      const pointA = vertices[indexA];
      const pointB = vertices[indexB];
      context.moveTo(pointA.x, pointA.y);
      context.lineTo(pointB.x, pointB.y);
    }
    context.strokeStyle = 'blue';
    context.lineWidth = 3;
    context.stroke();
  }

  if (line) {
    context.beginPath();
    for (const point of line) {
      context.lineTo(point.x, point.y);
    }
    context.strokeStyle = 'green';
    context.lineWidth = 2;
    context.stroke();
  }

  context.beginPath();
  context.arc(START.x, START.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'blue';
  context.fill();

  context.beginPath();
  context.arc(END.x, END.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'red';
  context.fill();
}
