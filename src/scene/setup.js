import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createScene(container) {
  // === RENDERER ===
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false 
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;          // por si más adelante quieres sombras
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // === SCENE ===
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111); // fondo oscuro profesional

  // === CAMERA ===
  const camera = new THREE.PerspectiveCamera(
    45,                                          // FOV
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );
  camera.position.set(60, 45, 60);               // posición inicial buena para engranajes

  // === CONTROLES ===
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 20;
  controls.maxDistance = 300;
  controls.target.set(0, 0, 0);
  controls.update();

  // === LUCES ===
  // Luz ambiental suave
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  // Luz direccional principal
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
  mainLight.position.set(80, 100, 60);
  mainLight.castShadow = true;
  scene.add(mainLight);

  // Luz de relleno (para que no haya zonas demasiado oscuras)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  fillLight.position.set(-60, 40, -40);
  scene.add(fillLight);

  // === HELPERS (muy útiles mientras desarrollas) ===
  const axesHelper = new THREE.AxesHelper(40);
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(120, 24, 0x444444, 0x333333);
  scene.add(gridHelper);

  // === RESIZE ===
  function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onWindowResize);

  // === ANIMATION LOOP ===
  const renderCallbacks = [];
  function animate() {
    requestAnimationFrame(animate);
    controls.update();           // obligatorio con damping
    
    // Execute all registered callbacks
    renderCallbacks.forEach(cb => cb());

    renderer.render(scene, camera);
  }
  animate();

  // Devolvemos todo lo que necesitaremos después
  return {
    scene,
    camera,
    renderer,
    controls,
    addRenderCallback: (cb) => renderCallbacks.push(cb),
    removeRenderCallback: (cb) => {
      const idx = renderCallbacks.indexOf(cb);
      if (idx !== -1) renderCallbacks.splice(idx, 1);
    },
    // Función por si más adelante quieres limpiar
    dispose: () => {
      window.removeEventListener('resize', onWindowResize);
      controls.dispose();
      renderer.dispose();
    }
  };
}
