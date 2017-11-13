import * as THREE from 'three';
import 'three/examples/js/controls/EditorControls';
import 'three/examples/js/controls/TransformControls';

export function placeOnGround(mesh) {
  const boundingBox = new THREE.Box3().setFromObject(mesh);

  mesh.position.y -= boundingBox.min.y;
  mesh.updateMatrix();
}

export function createScene(canvas, props, state) {
  const { width, height, geometry } = props;
  const { controlMode, settings } = state;

  // center geometry
  geometry.computeBoundingBox();
  const centerX = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
  const centerY = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
  const centerZ = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-centerX, -centerY, -centerZ));

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(width, height);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
  camera.position.set(0, 400, 300);

  const directionalLight = new THREE.DirectionalLight(0xd5d5d5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x808080);
  scene.add(light);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x2194ce }));
  placeOnGround(mesh);
  scene.add(mesh);

  const editorControls = new THREE.EditorControls(camera, canvas);
  editorControls.focus(mesh);

  const control = new THREE.TransformControls(camera, canvas);
  control.setMode(controlMode);
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

  const { dimensions } = settings;
  box.scale.set(dimensions.y, dimensions.z, dimensions.x);

  render();

  return { control, editorControls, scene, mesh, camera, renderer, render, box };
}
