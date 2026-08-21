/**
 * Exportador STL binario para engranajes.
 *
 * Recibe uno o varios THREE.Mesh y genera un archivo STL binario
 * (formato estándar para impresión 3D / CAM) como Blob descargable.
 *
 * Formato STL binario:
 *   - 80 bytes: header
 *   - 4 bytes:  uint32 número de triángulos
 *   - Por cada triángulo (50 bytes):
 *       12 bytes: normal (3 × float32)
 *       36 bytes: 3 vértices (3 × 3 × float32)
 *        2 bytes: attribute byte count (0)
 */

import * as THREE from 'three';

/**
 * Exporta uno o varios THREE.Mesh a un Blob STL binario.
 *
 * @param {THREE.Mesh | THREE.Mesh[]} meshes - Malla(s) a exportar
 * @returns {Blob} Archivo STL binario listo para descargar
 */
export function exportToSTL(meshes) {
  const meshArray = Array.isArray(meshes) ? meshes : [meshes];

  // ── 1. Recopilar todos los triángulos (en coordenadas world) ──────────
  const triangles = [];

  for (const mesh of meshArray) {
    // Asegurarnos de que la matriz world esté actualizada
    mesh.updateMatrixWorld(true);

    const geometry = mesh.geometry;
    const posAttr = geometry.getAttribute('position');

    if (!posAttr) {
      console.warn('stlExporter: Se ignoró una malla sin atributo position.');
      continue;
    }

    const index = geometry.getIndex();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);

    // Vértices temporales
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    const triCount = index ? index.count / 3 : posAttr.count / 3;

    for (let i = 0; i < triCount; i++) {
      let a, b, c;

      if (index) {
        a = index.getX(i * 3);
        b = index.getX(i * 3 + 1);
        c = index.getX(i * 3 + 2);
      } else {
        a = i * 3;
        b = i * 3 + 1;
        c = i * 3 + 2;
      }

      // Leer posiciones locales
      vA.fromBufferAttribute(posAttr, a);
      vB.fromBufferAttribute(posAttr, b);
      vC.fromBufferAttribute(posAttr, c);

      // Transformar a coordenadas world
      vA.applyMatrix4(mesh.matrixWorld);
      vB.applyMatrix4(mesh.matrixWorld);
      vC.applyMatrix4(mesh.matrixWorld);

      // Calcular normal del triángulo (cross product)
      const edge1 = new THREE.Vector3().subVectors(vB, vA);
      const edge2 = new THREE.Vector3().subVectors(vC, vA);
      faceNormal.crossVectors(edge1, edge2).normalize();

      triangles.push({
        normal: { x: faceNormal.x, y: faceNormal.y, z: faceNormal.z },
        vertices: [
          { x: vA.x, y: vA.y, z: vA.z },
          { x: vB.x, y: vB.y, z: vB.z },
          { x: vC.x, y: vC.y, z: vC.z }
        ]
      });
    }
  }

  // ── 2. Construir buffer STL binario ───────────────────────────────────
  const HEADER_SIZE = 80;
  const TRI_COUNT_SIZE = 4;
  const TRI_SIZE = 50; // 12 (normal) + 36 (3 vértices) + 2 (attr)
  const bufferSize = HEADER_SIZE + TRI_COUNT_SIZE + triangles.length * TRI_SIZE;

  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // Header (80 bytes) — texto descriptivo
  const headerStr = 'STL Binary - Gear Generator (gear-generator)';
  for (let i = 0; i < headerStr.length && i < 80; i++) {
    dataView.setUint8(i, headerStr.charCodeAt(i));
  }

  // Número de triángulos (uint32 LE)
  dataView.setUint32(HEADER_SIZE, triangles.length, true);

  // Escribir cada triángulo
  let offset = HEADER_SIZE + TRI_COUNT_SIZE;

  for (const tri of triangles) {
    // Normal (3 × float32 LE)
    dataView.setFloat32(offset, tri.normal.x, true); offset += 4;
    dataView.setFloat32(offset, tri.normal.y, true); offset += 4;
    dataView.setFloat32(offset, tri.normal.z, true); offset += 4;

    // 3 vértices (3 × 3 × float32 LE)
    for (const v of tri.vertices) {
      dataView.setFloat32(offset, v.x, true); offset += 4;
      dataView.setFloat32(offset, v.y, true); offset += 4;
      dataView.setFloat32(offset, v.z, true); offset += 4;
    }

    // Attribute byte count (uint16 LE = 0)
    dataView.setUint16(offset, 0, true); offset += 2;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

/**
 * Descarga un Blob STL como archivo en el navegador.
 *
 * @param {Blob} blob - Blob STL generado por exportToSTL()
 * @param {string} [filename='engranaje.stl'] - Nombre del archivo de descarga
 */
export function downloadSTL(blob, filename = 'engranaje.stl') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Limpieza
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
