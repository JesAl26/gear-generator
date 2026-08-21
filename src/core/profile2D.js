import { generateInvoluteProfile, calculateGearParameters } from './involute.js';

/**
 * Módulo para la generación, exportación y renderizado en 2D del perfil de un engranaje recto.
 */

/**
 * Genera el perfil 2D completo de un engranaje recto incluyendo la silueta exterior de involución,
 * el agujero central (bore), y datos vectoriales SVG.
 * 
 * @param {Object} gearParams - Parámetros geométricos del engranaje
 * @param {number} [gearParams.module=2] - Módulo (mm)
 * @param {number} [gearParams.teeth=20] - Número de dientes (Z)
 * @param {number} [gearParams.pressureAngle=20] - Ángulo de presión (grados)
 * @param {number} [gearParams.profileShift=0] - Desplazamiento de perfil (x)
 * @param {number} [gearParams.backlash=0] - Juego entre dientes (mm)
 * @param {number} [gearParams.boreRadius=5] - Radio del eje central (mm)
 * @param {number} [gearParams.keywayWidth=0] - Ancho del chavetero (mm, opcional)
 * @param {number} [gearParams.keywayHeight=0] - Alto del chavetero (mm, opcional)
 * @returns {Object} Estructura de datos completa del perfil 2D
 */
export function generateSpurGearProfile2D(gearParams = {}) {
  const {
    module = 2,
    teeth = 20,
    pressureAngle = 20,
    profileShift = 0,
    backlash = 0,
    boreRadius = 5,
    keywayWidth = 0,
    keywayHeight = 0
  } = gearParams;

  // 1. Obtener métricas y radios calculados
  const geometryInfo = calculateGearParameters(module, teeth, pressureAngle, profileShift, backlash);

  // 2. Generar puntos 2D del perfil exterior de los dientes (Involuta)
  const outerPoints = generateInvoluteProfile(module, teeth, pressureAngle, profileShift, backlash);

  // 3. Generar puntos 2D del agujero central (bore hole)
  const borePoints = [];
  const boreSegments = 36;
  if (boreRadius > 0) {
    for (let i = 0; i < boreSegments; i++) {
      const angle = (i / boreSegments) * Math.PI * 2;
      borePoints.push({
        x: boreRadius * Math.cos(angle),
        y: boreRadius * Math.sin(angle)
      });
    }
  }

  // 4. Generar código de camino SVG (SVG Path Data 'd')
  const outerSvgPath = pointsToSvgPath(outerPoints, true);
  const boreSvgPath = borePoints.length > 0 ? pointsToSvgPath(borePoints, true) : '';

  return {
    outerPoints,
    borePoints,
    outerSvgPath,
    boreSvgPath,
    geometryInfo,
    referenceCircles: {
      pitch: geometryInfo.pitchRadius,
      base: geometryInfo.baseRadius,
      outside: geometryInfo.outsideRadius,
      root: geometryInfo.rootRadius,
      bore: boreRadius
    }
  };
}

/**
 * Convierte un array de puntos 2D [{x, y}] en un string de comando SVG Path (`d="M x y L x y ... Z"`).
 * 
 * @param {Array<{x: number, y: number}>} points - Array de puntos 2D
 * @param {boolean} [closed=true] - Si se debe cerrar el camino con 'Z'
 * @returns {string} String de ruta SVG
 */
export function pointsToSvgPath(points, closed = true) {
  if (!points || points.length === 0) return '';

  let d = `M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(4)} ${points[i].y.toFixed(4)}`;
  }
  if (closed) {
    d += ' Z';
  }
  return d;
}

/**
 * Exporta el perfil 2D de un engranaje a un archivo vectorial SVG listo para cortar con láser o CNC.
 * 
 * @param {Object} profile2D - Estructura devuelta por `generateSpurGearProfile2D`
 * @param {Object} [options={}] - Opciones de renderizado SVG
 * @returns {string} Documento XML/SVG completo
 */
export function exportToSVG(profile2D, options = {}) {
  const {
    strokeColor = '#0066cc',
    strokeWidth = 0.5,
    fillColor = 'none',
    showReferenceCircles = false
  } = options;

  const { outsideRadius } = profile2D.geometryInfo;
  const margin = 10;
  const viewBoxSize = (outsideRadius + margin) * 2;
  const minX = -(outsideRadius + margin);
  const minY = -(outsideRadius + margin);

  let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxSize}mm" height="${viewBoxSize}mm" viewBox="${minX} ${minY} ${viewBoxSize} ${viewBoxSize}">\n`;
  
  // Fondo opcional o grupo
  svgContent += `  <g id="gear-profile" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round">\n`;
  svgContent += `    <path d="${profile2D.outerSvgPath}" />\n`;
  
  if (profile2D.boreSvgPath) {
    svgContent += `    <path d="${profile2D.boreSvgPath}" />\n`;
  }
  svgContent += `  </g>\n`;

  // Círculos de referencia opcionales para plano técnico
  if (showReferenceCircles) {
    const { pitch, base, root, outside } = profile2D.referenceCircles;
    svgContent += `  <g id="reference-circles" fill="none" stroke-dasharray="2,2" stroke-width="0.3">\n`;
    svgContent += `    <circle cx="0" cy="0" r="${pitch}" stroke="#00aa00" id="pitch-circle" />\n`;
    svgContent += `    <circle cx="0" cy="0" r="${base}" stroke="#cc0000" id="base-circle" />\n`;
    svgContent += `    <circle cx="0" cy="0" r="${root}" stroke="#aaaa00" id="root-circle" />\n`;
    svgContent += `    <circle cx="0" cy="0" r="${outside}" stroke="#00aaaa" id="outside-circle" />\n`;
    svgContent += `  </g>\n`;
  }

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * Renderiza el perfil 2D de un engranaje en un lienzo HTML5 Canvas 2D.
 * 
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas
 * @param {Object} profile2D - Perfil 2D del engranaje
 * @param {Object} [options={}] - Opciones de dibujo
 */
export function drawGear2DToCanvas(ctx, profile2D, options = {}) {
  const {
    centerX = ctx.canvas.width / 2,
    centerY = ctx.canvas.height / 2,
    scale = 3,
    strokeColor = '#00e5ff',
    fillColor = 'rgba(0, 229, 255, 0.15)',
    showReferenceCircles = true
  } = options;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // 1. Dibujar Círculos de Referencia Teóricos
  if (showReferenceCircles) {
    const { pitch, base, root, outside, bore } = profile2D.referenceCircles;

    // Primitivo (Verde)
    drawCircle(ctx, 0, 0, pitch, 'rgba(0, 255, 136, 0.6)', 0.8, [4, 4]);
    // Base (Rojo)
    drawCircle(ctx, 0, 0, base, 'rgba(255, 68, 68, 0.6)', 0.8, [2, 2]);
    // Cabeza (Azul cian)
    drawCircle(ctx, 0, 0, outside, 'rgba(0, 170, 255, 0.4)', 0.6, []);
    // Raíz (Amarillo)
    drawCircle(ctx, 0, 0, root, 'rgba(255, 187, 0, 0.4)', 0.6, []);
  }

  // 2. Dibujar Silueta Externa de los Dientes
  const { outerPoints, borePoints } = profile2D;
  if (outerPoints && outerPoints.length > 0) {
    ctx.beginPath();
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let i = 1; i < outerPoints.length; i++) {
      ctx.lineTo(outerPoints[i].x, outerPoints[i].y);
    }
    ctx.closePath();

    // Dibujar Agujero Central si existe
    if (borePoints && borePoints.length > 0) {
      ctx.moveTo(borePoints[0].x, borePoints[0].y);
      for (let i = 1; i < borePoints.length; i++) {
        ctx.lineTo(borePoints[i].x, borePoints[i].y);
      }
      ctx.closePath();
    }

    ctx.fillStyle = fillColor;
    ctx.fill('evenodd'); // Hace un corte limpio para el agujero central
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2 / scale;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCircle(ctx, x, y, r, color, width, dash = []) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}
