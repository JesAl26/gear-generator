import * as THREE from 'three';
import { buildGearMesh } from '../core/meshBuilder.js';

/**
 * Convierte datos de malla 3D personalizada ({vertices, normals, uvs, indices}) en un THREE.BufferGeometry.
 * 
 * @param {{ vertices: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint32Array }} meshData 
 * @param {Object} [materialOptions={}] - Opciones de material Three.js
 * @returns {THREE.Mesh}
 */
export function createGearMeshFromCustomData(meshData, materialOptions = {}) {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
  if (meshData.normals && meshData.normals.length > 0) {
    geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
  } else {
    geometry.computeVertexNormals();
  }
  if (meshData.uvs && meshData.uvs.length > 0) {
    geometry.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
  }
  if (meshData.indices && meshData.indices.length > 0) {
    geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
  }

  // Orientación en plano XZ
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: materialOptions.color ?? 0x2b82c5,
    metalness: materialOptions.metalness ?? 0.5,
    roughness: materialOptions.roughness ?? 0.3,
    side: THREE.DoubleSide,
    ...materialOptions
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Convierte un objeto Gear en un THREE.Mesh 3D.
 * 
 * @param {import('../core/gear.js').Gear} gear - Instancia del engranaje
 * @param {Object} [materialOptions={}] - Opciones personalizadas de material
 * @param {boolean} [useCustomBuilder=false] - Usar extrusión manual meshBuilder
 * @returns {THREE.Mesh} Malla 3D lista para agregarse a la escena
 */
export function createGearMesh(gear, materialOptions = {}, useCustomBuilder = false) {
  const points = gear.profile2D.length > 0 ? gear.profile2D : gear.generate();
  
  if (!points || points.length === 0) {
    console.error('El perfil 2D del engranaje está vacío');
    return new THREE.Mesh();
  }

  // Si se solicita el constructor manual puro
  if (useCustomBuilder) {
    const rawData = buildGearMesh(points, gear.params.thickness, gear.params.boreRadius);
    return createGearMeshFromCustomData(rawData, materialOptions);
  }

  // Extrusión con THREE.ExtrudeGeometry
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();

  if (gear.params.boreRadius > 0 && gear.params.boreRadius < gear.rootRadius) {
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, gear.params.boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  const extrudeSettings = {
    depth: gear.params.thickness,
    bevelEnabled: false   // Bisel desactivado: añade material fuera del radio de cabeza y provoca solapamiento
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: materialOptions.color ?? 0x2b82c5,
    metalness: materialOptions.metalness ?? 0.5,
    roughness: materialOptions.roughness ?? 0.3,
    ...materialOptions
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Centrar verticalmente: la extrusión va de 0 a depth, queremos de -depth/2 a +depth/2
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const centerY = (bb.max.y + bb.min.y) / 2;
  geometry.translate(0, -centerY, 0);

  return mesh;
}

/**
 * Elimina una malla anterior de la escena y la reemplaza por una nueva.
 * Libera geometría y material de la malla anterior para evitar fugas de memoria.
 *
 * @param {THREE.Scene} scene - Escena Three.js
 * @param {THREE.Mesh|null} oldMesh - Malla anterior a eliminar (null si es primera vez)
 * @param {import('../core/gear.js').Gear} gear - Instancia del engranaje
 * @param {Object} [materialOptions={}] - Opciones de material
 * @returns {THREE.Mesh} Nueva malla agregada a la escena
 */
export function updateGearInScene(scene, oldMesh, gear, materialOptions = {}) {
  if (oldMesh) {
    scene.remove(oldMesh);
    oldMesh.geometry.dispose();
    if (oldMesh.material) oldMesh.material.dispose();
  }

  const newMesh = createGearMesh(gear, materialOptions);
  scene.add(newMesh);
  return newMesh;
}
