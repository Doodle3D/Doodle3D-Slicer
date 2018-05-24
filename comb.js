import comb from './src/sliceActions/helpers/comb.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 800;
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

const START = { x: 200, y: 400 };
const END = { x: 400, y: 300 };

const POLYGON = [[
  { x: 10, y: 10 },
  { x: 600, y: 10 },
  { x: 500, y: 200 },
  { x: 600, y: 600 },
  { x: 10, y: 600 }
], [
  { x: 160, y: 120 },
  { x: 120, y: 400 },
  { x: 400, y: 400 }
]];
// const POLYGON = [
//   circle(300, 305, 305, true, 4),
//   circle(40, 305, 105, false, 4),
//   circle(40, 305, 205, false, 4),
//   circle(40, 305, 305, false, 4),
//   circle(40, 305, 405, false, 4),
//   circle(40, 305, 505, false, 4)
// ];

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
  const path = comb(POLYGON, START, END);

  // draw
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  for (const shape of POLYGON) {
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

  context.beginPath();
  for (const { x, y } of path) {
    context.lineTo(x, y);
  }
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.arc(START.x, START.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'blue';
  context.fill();

  context.beginPath();
  context.arc(END.x, END.y, 3, 0, Math.PI * 2);
  context.fillStyle = 'red';
  context.fill();
}
