/**
 * Convierte el perfil 2D de un engranaje en una malla 3D personalizada.
 * 
 * Genera buffers nativos de JavaScript (Float32Array para posiciones, normales y UVs,
 * y Uint32Array para los índices de triángulos), totalmente independientes de Three.js.
 */

/**
 * Construye la geometría 3D extruida de un engranaje a partir de su perfil 2D.
 * 
 * @param {Array<{x: number, y: number}>} profile2D - Puntos del contorno 2D del engranaje
 * @param {number} faceWidth - Espesor / Grosor de extrusión en Z (mm)
 * @param {number} [holeRadius=0] - Radio del agujero del eje central (mm)
 * @returns {{ vertices: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint32Array }}
 */
export function buildGearMesh(profile2D, faceWidth, holeRadius = 0) {
  if (!profile2D || profile2D.length < 3) {
    console.error('meshBuilder: Se requiere un perfil 2D válido con al menos 3 puntos.');
    return {
      vertices: new Float32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      indices: new Uint32Array([])
    };
  }

  const numPoints = profile2D.length;
  const halfWidth = faceWidth / 2;
  const zBottom = -halfWidth;
  const zTop = halfWidth;

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  let vertexCount = 0;

  // Función auxiliar para agregar un triángulo
  function addTriangle(p1, p2, p3, n1, n2, n3, uv1, uv2, uv3) {
    positions.push(...p1, ...p2, ...p3);
    normals.push(...n1, ...n2, ...n3);
    uvs.push(...uv1, ...uv2, ...uv3);
    indices.push(vertexCount, vertexCount + 1, vertexCount + 2);
    vertexCount += 3;
  }

  // Precalculamos puntos interiores para el agujero central alineados angularmente
  const innerPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const pt = profile2D[i];
    if (holeRadius > 0) {
      const angle = Math.atan2(pt.y, pt.x);
      innerPoints.push({
        x: holeRadius * Math.cos(angle),
        y: holeRadius * Math.sin(angle)
      });
    } else {
      innerPoints.push({ x: 0, y: 0 });
    }
  }

  // =========================================================================
  // 1. TAPAS SUPERIOR (+Z) E INFERIOR (-Z) (Cap Faces)
  // =========================================================================
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;

    const o1 = profile2D[i];
    const o2 = profile2D[next];
    const i1 = innerPoints[i];
    const i2 = innerPoints[next];

    // --- TAPA SUPERIOR (Normal +Z = [0, 0, 1]) ---
    const topNorm = [0, 0, 1];
    const pTopO1 = [o1.x, o1.y, zTop];
    const pTopO2 = [o2.x, o2.y, zTop];
    const pTopI1 = [i1.x, i1.y, zTop];
    const pTopI2 = [i2.x, i2.y, zTop];

    // UVs simples basadas en coordenadas X,Y
    const uvTopO1 = [o1.x, o1.y];
    const uvTopO2 = [o2.x, o2.y];
    const uvTopI1 = [i1.x, i1.y];
    const uvTopI2 = [i2.x, i2.y];

    // Triángulo 1 Tapa Superior: (o1, o2, i2)
    addTriangle(pTopO1, pTopO2, pTopI2, topNorm, topNorm, topNorm, uvTopO1, uvTopO2, uvTopI2);
    // Triángulo 2 Tapa Superior: (o1, i2, i1)
    addTriangle(pTopO1, pTopI2, pTopI1, topNorm, topNorm, topNorm, uvTopO1, uvTopI2, uvTopI1);

    // --- TAPA INFERIOR (Normal -Z = [0, 0, -1]) ---
    const botNorm = [0, 0, -1];
    const pBotO1 = [o1.x, o1.y, zBottom];
    const pBotO2 = [o2.x, o2.y, zBottom];
    const pBotI1 = [i1.x, i1.y, zBottom];
    const pBotI2 = [i2.x, i2.y, zBottom];

    // Triángulo 1 Tapa Inferior (orden inverso para normal exterior): (o1, i2, o2)
    addTriangle(pBotO1, pBotI2, pBotO2, botNorm, botNorm, botNorm, uvTopO1, uvTopI2, uvTopO2);
    // Triángulo 2 Tapa Inferior: (o1, i1, i2)
    addTriangle(pBotO1, pBotI1, pBotI2, botNorm, botNorm, botNorm, uvTopO1, uvTopI1, uvTopI2);
  }

  // =========================================================================
  // 2. PAREDES EXTERIORES / FLANCOS DE LOS DIENTES (Side Walls)
  // =========================================================================
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;

    const o1 = profile2D[i];
    const o2 = profile2D[next];

    // Vector dirección del segmento y normal exterior perpendicular
    const dx = o2.x - o1.x;
    const dy = o2.y - o1.y;
    const len = Math.hypot(dx, dy);
    
    // Normal hacia afuera en 2D: (dy/len, -dx/len, 0)
    const nx = len > 0 ? dy / len : 0;
    const ny = len > 0 ? -dx / len : 0;
    const sideNorm = [nx, ny, 0];

    const pBot1 = [o1.x, o1.y, zBottom];
    const pBot2 = [o2.x, o2.y, zBottom];
    const pTop1 = [o1.x, o1.y, zTop];
    const pTop2 = [o2.x, o2.y, zTop];

    const u1 = i / numPoints;
    const u2 = next / numPoints;

    // Triángulo 1 Pared Exterior: (pBot1, pBot2, pTop2)
    addTriangle(pBot1, pBot2, pTop2, sideNorm, sideNorm, sideNorm, [u1, 0], [u2, 0], [u2, 1]);
    // Triángulo 2 Pared Exterior: (pBot1, pTop2, pTop1)
    addTriangle(pBot1, pTop2, pTop1, sideNorm, sideNorm, sideNorm, [u1, 0], [u2, 1], [u1, 1]);
  }

  // =========================================================================
  // 3. PARED INTERIOR DEL AGUJERO CENTRAL (Bore Wall)
  // =========================================================================
  if (holeRadius > 0) {
    for (let i = 0; i < numPoints; i++) {
      const next = (i + 1) % numPoints;

      const i1 = innerPoints[i];
      const i2 = innerPoints[next];

      // Normal apuntando hacia el centro del agujero (-x, -y)
      const n1 = [-Math.cos(Math.atan2(i1.y, i1.x)), -Math.sin(Math.atan2(i1.y, i1.x)), 0];
      const n2 = [-Math.cos(Math.atan2(i2.y, i2.x)), -Math.sin(Math.atan2(i2.y, i2.x)), 0];

      const pBot1 = [i1.x, i1.y, zBottom];
      const pBot2 = [i2.x, i2.y, zBottom];
      const pTop1 = [i1.x, i1.y, zTop];
      const pTop2 = [i2.x, i2.y, zTop];

      const u1 = i / numPoints;
      const u2 = next / numPoints;

      // Triángulo 1 Pared Interior: (pBot1, pTop2, pBot2)
      addTriangle(pBot1, pTop2, pBot2, n1, n2, n2, [u1, 0], [u2, 1], [u2, 0]);
      // Triángulo 2 Pared Interior: (pBot1, pTop1, pTop2)
      addTriangle(pBot1, pTop1, pTop2, n1, n1, n2, [u1, 0], [u1, 1], [u2, 1]);
    }
  }

  return {
    vertices: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices)
  };
}
