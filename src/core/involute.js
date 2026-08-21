import { degToRad } from '../utils/math.js';

/**
 * Función Involuta de un ángulo en radianes:
 * inv(alpha) = tan(alpha) - alpha
 * 
 * @param {number} alphaRad - Ángulo en radianes
 * @returns {number} Valor de la función involuta
 */
export function involuteFunc(alphaRad) {
  return Math.tan(alphaRad) - alphaRad;
}

/**
 * Calcula los parámetros dimensionales geométricos fundamentales de un engranaje recto.
 * 
 * @param {number} module - Módulo del engranaje (mm)
 * @param {number} teeth - Número de dientes (Z)
 * @param {number} pressureAngleDeg - Ángulo de presión en grados (típicamente 20°)
 * @param {number} profileShift - Coeficiente de desplazamiento de perfil (x)
 * @param {number} backlash - Holgura entre dientes (mm)
 * @returns {Object} Diccionario con los parámetros calculados
 */
export function calculateGearParameters(module, teeth, pressureAngleDeg = 20, profileShift = 0, backlash = 0) {
  const pressureAngle = degToRad(pressureAngleDeg);
  
  // Radio primitivo (Pitch Radius)
  const pitchRadius = (module * teeth) / 2;
  const pitchDiameter = module * teeth;
  
  // Radio base (Base Radius)
  const baseRadius = pitchRadius * Math.cos(pressureAngle);
  
  // Adendum (altura de cabeza) y Dedendum (altura de pie)
  const addendum = module * (1 + profileShift);
  const dedendum = module * 1.25; // Estándar ISO con 0.25m de holgura de raíz
  
  // Radio exterior / de cabeza (Addendum / Outside Radius)
  const outsideRadius = pitchRadius + addendum;
  
  // Radio de raíz / fondo (Dedendum / Root Radius)
  const rootRadius = Math.max(0.1, pitchRadius - dedendum);
  
  // Paso circular en el diámetro primitivo: p = PI * m
  const circularPitch = Math.PI * module;
  
  // Espesor del diente en el diámetro primitivo (s)
  // s = (PI * m / 2) + 2 * x * m * tan(alpha) - backlash
  const toothThicknessPitch = (circularPitch / 2) + 
    (2 * profileShift * module * Math.tan(pressureAngle)) - 
    backlash;
    
  // Ángulo del espesor del diente en polares en el radio primitivo
  const toothThicknessAngle = toothThicknessPitch / pitchRadius;
  const halfToothAnglePitch = toothThicknessAngle / 2;
  
  // Ángulo involuta en el radio primitivo
  const invAlphaPitch = involuteFunc(pressureAngle);
  
  // Detección teórica de socavado (Undercutting)
  // Ocurre cuando Z < 2 * (1 - x) / sin^2(alpha)
  const minTeethNoUndercut = (2 * (1 - profileShift)) / Math.pow(Math.sin(pressureAngle), 2);
  const isUndercut = teeth < minTeethNoUndercut;

  return {
    module,
    teeth,
    pressureAngleDeg,
    pressureAngleRad: pressureAngle,
    profileShift,
    backlash,
    pitchRadius,
    pitchDiameter,
    baseRadius,
    outsideRadius,
    rootRadius,
    addendum,
    dedendum,
    circularPitch,
    toothThicknessPitch,
    toothThicknessAngle,
    halfToothAnglePitch,
    invAlphaPitch,
    isUndercut,
    minTeethNoUndercut
  };
}

/**
 * Genera el perfil 2D completo (puntos cerrados {x, y}) de un engranaje recto usando el algoritmo de involuta de círculo.
 * 
 * @param {number} module - Módulo del engranaje (mm)
 * @param {number} teeth - Número de dientes (Z)
 * @param {number} pressureAngleDeg - Ángulo de presión en grados (ej: 20°)
 * @param {number} profileShift - Desplazamiento de perfil (x)
 * @param {number} backlash - Juego / Holgura entre dientes (mm)
 * @param {number} numPointsPerFlank - Resolución de puntos por flanco
 * @returns {Array<{x: number, y: number}>} Array de puntos 2D que forman la silueta continua del engranaje
 */
export function generateInvoluteProfile(
  module,
  teeth,
  pressureAngleDeg = 20,
  profileShift = 0,
  backlash = 0,
  numPointsPerFlank = 16
) {
  const params = calculateGearParameters(module, teeth, pressureAngleDeg, profileShift, backlash);
  
  const {
    baseRadius,
    outsideRadius,
    rootRadius,
    halfToothAnglePitch,
    invAlphaPitch
  } = params;

  // Determinar el radio de inicio de la involuta (no puede ser menor que el radio base)
  const startInvoluteRadius = Math.max(rootRadius, baseRadius);
  
  // Parámetro t para la curva involuta r = rb * sqrt(1 + t^2) => t = sqrt((r/rb)^2 - 1)
  const tStart = startInvoluteRadius > baseRadius 
    ? Math.sqrt(Math.pow(startInvoluteRadius / baseRadius, 2) - 1) 
    : 0;
  const tMax = Math.sqrt(Math.pow(outsideRadius / baseRadius, 2) - 1);

  const points = [];
  const toothAngleStep = (2 * Math.PI) / teeth;

  for (let i = 0; i < teeth; i++) {
    const toothCenterAngle = i * toothAngleStep;

    // -----------------------------------------------------------------------
    // 1. TRANSICIÓN DE RAÍZ A BASE (si el radio de raíz es menor que el radio base)
    // -----------------------------------------------------------------------
    if (rootRadius < baseRadius) {
      // Ángulo del inicio del flanco derecho en el radio base
      const thetaRightBase = toothCenterAngle - halfToothAnglePitch - invAlphaPitch;
      const xRoot = rootRadius * Math.cos(thetaRightBase);
      const yRoot = rootRadius * Math.sin(thetaRightBase);
      points.push({ x: xRoot, y: yRoot });
    }

    // -----------------------------------------------------------------------
    // 2. FLANCO DERECHO (Involuta desde la base/raíz hasta la cabeza)
    // -----------------------------------------------------------------------
    for (let j = 0; j <= numPointsPerFlank; j++) {
      const frac = j / numPointsPerFlank;
      const t = tStart + frac * (tMax - tStart);
      
      const r = baseRadius * Math.sqrt(1 + t * t);
      const invR = t - Math.atan(t); // involuteFunc(atan(t))
      
      // Ángulo polar del punto del flanco derecho
      const theta = toothCenterAngle - halfToothAnglePitch - invAlphaPitch + invR;
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push({ x, y });
    }

    // -----------------------------------------------------------------------
    // 3. FLANCO IZQUIERDO (Involuta desde la cabeza bajando hacia la base/raíz)
    // -----------------------------------------------------------------------
    for (let j = numPointsPerFlank; j >= 0; j--) {
      const frac = j / numPointsPerFlank;
      const t = tStart + frac * (tMax - tStart);
      
      const r = baseRadius * Math.sqrt(1 + t * t);
      const invR = t - Math.atan(t);
      
      // Ángulo polar del punto del flanco izquierdo (simétrico)
      const theta = toothCenterAngle + halfToothAnglePitch + invAlphaPitch - invR;
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push({ x, y });
    }

    // Transición de base a raíz en el lado izquierdo
    if (rootRadius < baseRadius) {
      const thetaLeftBase = toothCenterAngle + halfToothAnglePitch + invAlphaPitch;
      const xRoot = rootRadius * Math.cos(thetaLeftBase);
      const yRoot = rootRadius * Math.sin(thetaLeftBase);
      points.push({ x: xRoot, y: yRoot });
    }

    // -----------------------------------------------------------------------
    // 4. ARCO DE RAÍZ / FONDO DEL DIENTE (Transición hacia el siguiente diente)
    // -----------------------------------------------------------------------
    const nextToothCenterAngle = (i + 1) * toothAngleStep;
    const currentLeftRootAngle = toothCenterAngle + halfToothAnglePitch + invAlphaPitch;
    const nextRightRootAngle = nextToothCenterAngle - halfToothAnglePitch - invAlphaPitch;

    // Insertar puntos en el arco de raíz para suavizar el fondo del valle entre dientes
    const rootArcSegments = 4;
    for (let k = 1; k < rootArcSegments; k++) {
      const arcFrac = k / rootArcSegments;
      const rootAngle = currentLeftRootAngle + arcFrac * (nextRightRootAngle - currentLeftRootAngle);
      const xRootArc = rootRadius * Math.cos(rootAngle);
      const yRootArc = rootRadius * Math.sin(rootAngle);
      points.push({ x: xRootArc, y: yRootArc });
    }
  }

  return points;
}
