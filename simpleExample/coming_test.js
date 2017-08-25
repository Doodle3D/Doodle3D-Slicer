import Shape from 'clipper-js';
import comb from '../src/sliceActions/helpers/comb.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 720;
canvas.height = 480;
const context = canvas.getContext('2d');

const outline = new Shape([[
  { x: 100, y: 100 },
  { x: 400, y: 100 },
  { x: 400, y: 150 },
  { x: 200, y: 150 },
  { x: 200, y: 200 },
  { x: 400, y: 200 },
  { x: 400, y: 250 },
  { x: 200, y: 250 },
  { x: 200, y: 300 },
  { x: 400, y: 300 },
  { x: 400, y: 400 },
  { x: 100, y: 400 }
], [
  { x: 130, y: 310 },
  { x: 130, y: 370 },
  { x: 360, y: 370 },
  { x: 360, y: 360 },
  { x: 150, y: 360 },
  { x: 150, y: 350 },
  { x: 360, y: 350 },
  { x: 360, y: 340 },
  { x: 150, y: 340 },
  { x: 150, y: 330 },
  { x: 360, y: 330 },
  { x: 360, y: 310 }
]], true, true, false);

const start = { x: 380, y: 120 };
const end = { x: 200, y: 380 };

let combPath = comb(outline, start, end);

canvas.onmousemove = (event) => {
  start.x = event.x;
  start.y = event.y;

  combPath = comb(outline, start, end);
  draw();
};

draw();

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = 'black';
  for (const path of outline.mapToLower()) {
    context.beginPath();
    for (const point of path) {
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    context.stroke();
  }

  context.strokeStyle = 'red';
  context.beginPath();
  for (const point of combPath) {
    context.lineTo(point.x, point.y);
  }
  context.stroke();

  context.beginPath();
  context.arc(start.x, start.y, 3, 0, Math.PI * 2.0, false);
  context.stroke();

  context.beginPath();
  context.arc(end.x, end.y, 3, 0, Math.PI * 2.0, false);
  context.stroke();
}
