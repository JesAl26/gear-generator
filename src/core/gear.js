import { generateInvoluteProfile, calculateGearParameters } from './involute.js';
import { ISO_MODULES, MIN_TEETH_NO_UNDERCUT_20DEG } from '../utils/constants.js';

/**
 * Clase profesional que representa un engranaje cilíndrico de dientes rectos
 * bajo normas internacionales ISO 53, ISO 54, DIN 867 y DIN 3960.
 */
export class Gear {
  /**
   * @param {Object} params - Parámetros geométricos del engranaje
   * @param {number} [params.module=2] - Módulo m (mm)
   * @param {number} [params.teeth=20] - Número de dientes Z
   * @param {number} [params.pressureAngle=20] - Ángulo de presión en grados (20° estándar ISO)
   * @param {number} [params.profileShift=0] - Coeficiente de desplazamiento de perfil x
   * @param {number} [params.backlash=0] - Juego de flancos B (mm)
   * @param {number} [params.boreRadius=5] - Radio del agujero para el eje central (mm)
   * @param {number} [params.thickness=10] - Ancho de cara / Grosor 3D b (mm)
   */
  constructor(params = {}) {
    this.params = {
      module: params.module ?? 2,
      teeth: params.teeth ?? 20,
      pressureAngle: params.pressureAngle ?? 20,
      profileShift: params.profileShift ?? 0,
      backlash: params.backlash ?? 0,
      boreRadius: params.boreRadius ?? 5,
      thickness: params.thickness ?? 10
    };

    this.profile2D = [];
    this.recalculate();
  }

  /**
   * Recalcula la geometría y regenera el perfil 2D bajo normas DIN 867 / ISO 53.
   */
  recalculate() {
    this.geometryInfo = calculateGearParameters(
      this.params.module,
      this.params.teeth,
      this.params.pressureAngle,
      this.params.profileShift,
      this.params.backlash
    );

    // Radios característicos fundamentales
    this.pitchRadius = this.geometryInfo.pitchRadius;
    this.baseRadius = this.geometryInfo.baseRadius;
    this.outsideRadius = this.geometryInfo.outsideRadius;
    this.rootRadius = this.geometryInfo.rootRadius;

    return this.generate();
  }

  /**
   * Actualiza parámetros y recalcula la geometría.
   * @param {Object} newParams 
   */
  updateParams(newParams = {}) {
    this.params = { ...this.params, ...newParams };
    return this.recalculate();
  }

  /**
   * Genera y retorna el perfil 2D continuo del engranaje.
   * @returns {Array<{x: number, y: number}>}
   */
  generate() {
    this.profile2D = generateInvoluteProfile(
      this.params.module,
      this.params.teeth,
      this.params.pressureAngle,
      this.params.profileShift,
      this.params.backlash
    );
    return this.profile2D;
  }

  /**
   * Retorna las métricas geométricas detalladas de ingeniería.
   */
  getMetrics() {
    return {
      ...this.geometryInfo,
      boreRadius: this.params.boreRadius,
      thickness: this.params.thickness,
      recommendedProfileShift: this.calculateRecommendedProfileShift(),
      isISOStandardModule: this.validateISOStandard()
    };
  }

  /**
   * Comprueba si el módulo cumple con la serie ISO 54 de preferencia (Serie 1 o Serie 2).
   * @returns {{ isStandard: boolean, series: number|null }}
   */
  validateISOStandard() {
    const m = this.params.module;
    if (ISO_MODULES.SERIES_1.includes(m)) {
      return { isStandard: true, series: 1 };
    }
    if (ISO_MODULES.SERIES_2.includes(m)) {
      return { isStandard: true, series: 2 };
    }
    return { isStandard: false, series: null };
  }

  /**
   * Calcula el desplazamiento de perfil recomendado (x) según la norma DIN 3960 
   * para evitar el socavado (undercutting) si el piñón tiene Z < 17 dientes.
   * x_rec = (17 - Z) / 17
   * 
   * @returns {number} Coeficiente de desplazamiento recomendado
   */
  calculateRecommendedProfileShift() {
    if (this.params.teeth < MIN_TEETH_NO_UNDERCUT_20DEG && this.params.pressureAngle === 20) {
      return Number(((MIN_TEETH_NO_UNDERCUT_20DEG - this.params.teeth) / MIN_TEETH_NO_UNDERCUT_20DEG).toFixed(3));
    }
    return 0;
  }

  /**
   * Calcula la distancia entre centros (Center Distance C) exacta para acoplamiento mecánico.
   * C = (m * (Z1 + Z2)) / 2 = Rp1 + Rp2
   * 
   * @param {Gear} otherGear - Engranaje secundario
   * @returns {number} Distancia entre centros en mm
   */
  getCenterDistanceWith(otherGear) {
    if (this.params.module !== otherGear.params.module) {
      console.warn('Advertencia ISO: Los módulos no coinciden. El acoplamiento no será estándar.');
    }
    return this.pitchRadius + otherGear.pitchRadius;
  }

  /**
   * Calcula el ángulo exacto de rotación de fase (Meshing Phase Angle) para el engranaje conducido
   * de modo que engrane sin solapamiento ni colisión en 3D.
   * 
   * Para engranajes rectos estándar, la condición de acoplamiento es:
   *   - Un diente del conductor debe caer en un espacio entre dientes del conducido.
   *   - El ángulo de paso angular de cada engranaje es 2π/Z.
   *   - El conducido debe girarse un medio-paso angular para que un espacio (no un diente) 
   *     quede alineado hacia el conductor.
   * 
   * @param {Gear} drivenGear - Engranaje conducido
   * @param {number} [driverRotationRad=0] - Rotación actual del engranaje conductor
   * @param {number} [lineOfCentersAngleRad=0] - Dirección de la línea de centros (0 = Eje +X)
   * @returns {number} Ángulo de rotación requerido para el engranaje conducido (radianes)
   */
  getMeshingPhaseAngle(drivenGear, driverRotationRad = 0, lineOfCentersAngleRad = 0) {
    const z1 = this.params.teeth;
    const z2 = drivenGear.params.teeth;
    const phi = lineOfCentersAngleRad;
    const theta1 = driverRotationRad;

    // Relación cinemática: la rotación del conducido es inversa proporcional
    const gearRatio = z1 / z2;

    // El conducido mira al conductor desde la dirección opuesta (phi + PI).
    // Aplicamos la relación cinemática para transmitir la rotación del conductor.
    // Luego sumamos medio paso angular del conducido (PI/z2) para alinear
    // un espacio entre dientes con la cabeza del diente del conductor.
    const drivenPhase = (phi + Math.PI) - gearRatio * (theta1 - phi) + (Math.PI / z2);

    return drivenPhase;
  }


  /**
   * Devuelve la posición 3D (x, y, z) y rotación Y exactas para posicionar y acoplar 
   * mecánicamente un engranaje conducido en Three.js sin colisión ni solapamiento.
   * 
   * @param {Gear} drivenGear - Engranaje conducido a posicionar
   * @param {Object} [options={}] - Opciones de posición y rotación del conductor
   * @param {Object} [options.driverPosition={x: 0, y: 0, z: 0}] - Posición 3D del conductor
   * @param {number} [options.driverRotationY=0] - Rotación Y actual del conductor (radianes)
   * @param {number} [options.lineOfCentersAngle=0] - Dirección del acoplamiento (0 = +X, PI/2 = +Z)
   * @returns {{ position: {x: number, y: number, z: number}, rotationY: number, centerDistance: number }}
   */
  meshWith(drivenGear, options = {}) {
    const driverPos = options.driverPosition ?? { x: 0, y: 0, z: 0 };
    const driverRotY = options.driverRotationY ?? 0;
    const lineAngle = options.lineOfCentersAngle ?? 0;

    const centerDistance = this.getCenterDistanceWith(drivenGear);

    // Posición en el plano 3D XZ (suelo)
    const drivenX = driverPos.x + centerDistance * Math.cos(lineAngle);
    const drivenY = driverPos.y; // Mismo nivel Z/Y
    const drivenZ = driverPos.z + centerDistance * Math.sin(lineAngle);

    // Ángulo de fase exacto para cero solapamiento
    const drivenRotY = this.getMeshingPhaseAngle(drivenGear, driverRotY, lineAngle);

    return {
      position: { x: drivenX, y: drivenY, z: drivenZ },
      rotationY: drivenRotY,
      centerDistance
    };
  }

  /**
   * Relación de transmisión kinemática i = Z2 / Z1
   * @param {Gear} drivenGear 
   * @returns {number}
   */
  getGearRatioWith(drivenGear) {
    return drivenGear.params.teeth / this.params.teeth;
  }
}
