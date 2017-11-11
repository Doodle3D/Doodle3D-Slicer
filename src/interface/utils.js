import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import 'three/examples/js/controls/TransformControls';

const MAX_SPEED = 100 * 60;

export function placeOnGround(mesh) {
  const boundingBox = new THREE.Box3();
  const vertices = mesh.geometry.vertices.map(vertex => vertex.clone().applyMatrix4(mesh.matrix));
  boundingBox.setFromPoints(vertices);

  mesh.position.y -= boundingBox.min.y;
  mesh.updateMatrix();
}

export function createScene(canvas, props, state) {
  let geometry;
  if (props.geometry.isGeometry) {
    geometry = props.geometry;
  } else if (props.geometry.isBufferGeometry) {
    geometry = new THREE.Geometry().fromBufferGeometry(props.geometry);
  }

  // center geometry
  geometry.computeBoundingBox();
  const centerX = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
  const centerY = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
  const centerZ = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-centerX, -centerY, -centerZ));

  const { width, height, printers, defaultPrinter } = props;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(width, height);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
  camera.position.set(0, 400, 300);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const directionalLight = new THREE.DirectionalLight(0xd5d5d5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x808080);
  scene.add(light);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x2194ce }));
  placeOnGround(mesh);
  scene.add(mesh);

  const editorControls = new THREE.EditorControls(camera, canvas);

  const control = new THREE.TransformControls(camera, canvas);
  control.setMode(state.controlMode);
  control.setRotationSnap(THREE.Math.degToRad(45));
  control.addEventListener('mouseDown', () => editorControls.enabled = false);
  control.addEventListener('mouseUp', () => {
    editorControls.enabled = true;
    placeOnGround(mesh);
  });

  control.attach(mesh);
  scene.add(control);

  const render = () => {
    control.update();
    renderer.render(scene, camera);
  };

  control.addEventListener('change', render);
  editorControls.addEventListener('change', render);

  const box = new THREE.BoxHelper();
  box.update(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0))));
  box.material.color.setHex(0x72bcd4);
  scene.add(box);

  const { dimensions } = printers[defaultPrinter];
  box.scale.set(dimensions.x, dimensions.y, dimensions.z);

  render();

  return { control, editorControls, scene, mesh, camera, renderer, render };
}

export function createGcodeGeometry(gcode) {
  const geometry = new THREE.Geometry();

  let lastPoint
  for (let i = 0; i < gcode.length; i ++) {
    const { G, F, X, Y, Z } = gcode[i];

    if (X || Y || Z) {
      const point = new THREE.Vector3(Y, Z, X);

      let color;
      if (G === 0) {
        color = new THREE.Color(0x00ff00);
      } else if (G === 1) {
        color = new THREE.Color().setHSL(F / MAX_SPEED, 0.5, 0.5);
      }

      if (G === 1) {
        if (lastPoint) geometry.vertices.push(lastPoint);
        geometry.vertices.push(new THREE.Vector3(Y, Z, X));
        geometry.colors.push(color);
        geometry.colors.push(color);
      }

      lastPoint = point;
    }
  }

  const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
  const line = new THREE.LineSegments(geometry, material);

  return line;
}
