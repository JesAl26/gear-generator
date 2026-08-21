/**
 * Constantes y normas internacionales de engranajes (ISO 53, ISO 54, DIN 867, DIN 3960)
 */

// Módulos estandarizados según ISO 54 / DIN 780 (en mm)
export const ISO_MODULES = {
  // Serie 1: Preferencia Principal (Recomendados para todo diseño nuevo)
  SERIES_1: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0, 25.0, 32.0, 40.0, 50.0],
  // Serie 2: Elección Secundaria
  SERIES_2: [0.15, 0.25, 0.35, 0.45, 0.55, 0.7, 0.9, 1.125, 1.375, 1.75, 2.25, 2.75, 3.5, 4.5, 5.5, 7.0, 9.0, 11.0, 14.0, 18.0, 22.0, 28.0, 36.0, 45.0]
};

// Ángulos de presión estándar (grados)
export const PRESSURE_ANGLES = {
  STANDARD: 20.0,  // ISO 53 / DIN 867 estándar general
  HIGH_LOAD: 25.0, // Alta capacidad de carga
  OBSOLETE: 14.5  // Antiguo / Obsoleto
};

// Proporciones del perfil de referencia estándar (DIN 867) en función del módulo (m)
export const DIN_867_PROPORTIONS = {
  ADDENDUM_COEFF: 1.00,  // ha = 1.00 * m
  DEDENDUM_COEFF: 1.25,  // hf = 1.25 * m
  CLEARANCE_COEFF: 0.25, // c  = 0.25 * m (Holgura de pie)
  TOTAL_HEIGHT_COEFF: 2.25, // h = 2.25 * m
  FILLET_RADIUS_MAX: 0.38   // rf = 0.38 * m (Radio de fondo de raíz)
};

// Número mínimo de dientes teórico para evitar socavado (undercutting) sin desplazamiento de perfil a 20°
export const MIN_TEETH_NO_UNDERCUT_20DEG = 17;
