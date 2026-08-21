import './style.css';
import * as THREE from 'three';
import { createScene } from './scene/setup.js';
import { Gear } from './core/gear.js';
import { generateSpurGearProfile2D, drawGear2DToCanvas } from './core/profile2D.js';
import { buildGearMesh } from './core/meshBuilder.js';
import { createGearMeshFromCustomData, createGearMesh, updateGearInScene } from './scene/gearMesh.js';
import { exportToSTL, downloadSTL } from './core/stlExporter.js';
import { gearParams } from './ui/params.js';
import { initUI } from './ui/events.js';
import { GearTrain } from './core/gearTrain.js';

const container = document.getElementById('canvas-container');

if (!container) {
  console.error('No se encontró el contenedor #canvas-container');
} else {
  // 1. Inicializar escena 3D Three.js
  const { scene, addRenderCallback } = createScene(container);

  let pinionMesh = null;
  let wheelMesh = null;
  let pinion = null;
  let wheel = null;
  let exportableMeshes = [];
  
  // Rotación global para animación
  let globalRotation = 0;
  const ROTATION_SPEED = 0.01;

  addRenderCallback(() => {
    if (pinionMesh && pinion) {
      globalRotation += ROTATION_SPEED;
      pinionMesh.rotation.y = globalRotation;
      
      if (wheelMesh && wheel && gearParams.gearCount === 2) {
        // meshWith nos da la rotación del conducido basado en el conductor
        const meshing = pinion.meshWith(wheel, {
          driverPosition: { x: 0, y: 0, z: 0 },
          driverRotationY: pinionMesh.rotation.y,
          lineOfCentersAngle: 0
        });
        wheelMesh.rotation.y = meshing.rotationY;
      }
    }
  });

  /**
   * Función central: regenera todos los engranajes en la escena.
   * Se invoca en el render inicial y cada vez que un slider cambia.
   */
  function updateGears() {
    // =========================================================================
    // VERIFICACIÓN VISUAL 2D: RENDERIZADO EN CANAL DE PREVIA (#canvas-2d)
    // =========================================================================
    const canvas2D = document.getElementById('canvas-2d');
    if (canvas2D) {
      const ctx = canvas2D.getContext('2d');
      ctx.clearRect(0, 0, canvas2D.width, canvas2D.height);

      const gear2DProfile = generateSpurGearProfile2D({
        module: gearParams.module,
        teeth: gearParams.teeth1,
        pressureAngle: gearParams.pressureAngle,
        boreRadius: gearParams.holeRadius
      });

      // Escala adaptativa para que siempre quepa en el canvas
      const pitchR = (gearParams.module * gearParams.teeth1) / 2;
      const outsideR = pitchR + gearParams.module;
      const fitScale = (canvas2D.width / 2 - 12) / outsideR;

      drawGear2DToCanvas(ctx, gear2DProfile, {
        centerX: canvas2D.width / 2,
        centerY: canvas2D.height / 2,
        scale: fitScale,
        showReferenceCircles: true
      });
    }

    // =========================================================================
    // ENGRANAJE 1: PIÑÓN
    // =========================================================================
    // Clamping holeRadius to be smaller than the root radius of the pinion
    // Root radius approx: module * teeth / 2 - 1.25 * module
    const minRootRadius = gearParams.module * (gearParams.teeth1 / 2) - 1.25 * gearParams.module;
    const safeHoleRadius = Math.min(gearParams.holeRadius, Math.max(0, minRootRadius - 1));

    if (gearParams.holeRadius !== safeHoleRadius) {
      gearParams.holeRadius = safeHoleRadius;
      // Sync slider if it's there
      const holeRadiusInput = document.getElementById('holeRadius');
      const holeRadiusVal = document.getElementById('val-holeRadius');
      if (holeRadiusInput) holeRadiusInput.value = safeHoleRadius;
      if (holeRadiusVal) holeRadiusVal.textContent = safeHoleRadius.toFixed(1);
    }

    pinion = new Gear({
      module: gearParams.module,
      teeth: gearParams.teeth1,
      pressureAngle: gearParams.pressureAngle,
      boreRadius: gearParams.holeRadius,
      thickness: gearParams.faceWidth
    });
    pinion.generate();

    pinionMesh = updateGearInScene(scene, pinionMesh, pinion, {
      color: 0x00e5ff,
      metalness: 0.6,
      roughness: 0.25
    });
    pinionMesh.position.set(0, 0, 0);

    // =========================================================================
    // ENGRANAJE 2: RUEDA (solo si gearCount === 2)
    // =========================================================================
    const infoBox = document.querySelector('.info-box');

    if (gearParams.gearCount === 2) {
      wheel = new Gear({
        module: gearParams.module,
        teeth: gearParams.teeth2,
        pressureAngle: gearParams.pressureAngle,
        boreRadius: gearParams.holeRadius,
        thickness: gearParams.faceWidth
      });
      wheel.generate();

      wheelMesh = updateGearInScene(scene, wheelMesh, wheel, {
        color: 0xff8800,
        metalness: 0.6,
        roughness: 0.25
      });

      // Posicionar y acoplar automáticamente (inicial, la animación lo actualizará luego)
      const meshing = pinion.meshWith(wheel, {
        driverPosition: { x: 0, y: 0, z: 0 },
        driverRotationY: 0,
        lineOfCentersAngle: 0
      });

      wheelMesh.position.set(meshing.position.x, meshing.position.y, meshing.position.z);
      wheelMesh.rotation.y = meshing.rotationY;

      // Relación de transmisión
      const gearTrain = new GearTrain([pinion, wheel]);
      const ratio = gearTrain.getTransmissionRatio();
      const centerDist = gearTrain.calculateCenterDistance(pinion, wheel);

      const ratioDisplay = document.getElementById('transmission-ratio');
      if (ratioDisplay) {
        ratioDisplay.textContent = `${ratio.toFixed(2)}  (C = ${centerDist.toFixed(1)} mm)`;
      }
      if (infoBox) infoBox.style.display = 'block';

      exportableMeshes = [pinionMesh, wheelMesh];
    } else {
      if (wheelMesh) {
        scene.remove(wheelMesh);
        wheelMesh.geometry.dispose();
        if (wheelMesh.material) wheelMesh.material.dispose();
        wheelMesh = null;
        wheel = null;
      }
      if (infoBox) infoBox.style.display = 'none';
      exportableMeshes = [pinionMesh];
    }
  }

  // Inicializar UI y pasar callback para actualizar gears
  initUI(updateGears);

  // Render inicial
  updateGears();

  // =========================================================================
  // BOTÓN DESCARGAR STL
  // =========================================================================
  const btnDownload = document.getElementById('btn-download-stl');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      btnDownload.classList.add('downloading');

      try {
        const blob = exportToSTL(exportableMeshes);
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadSTL(blob, `engranaje_${timestamp}.stl`);
        console.log(`STL exportado: ${(blob.size / 1024).toFixed(1)} KB`);
      } catch (err) {
        console.error('Error al exportar STL:', err);
        alert('Error al generar el archivo STL. Revisa la consola para detalles.');
      } finally {
        setTimeout(() => btnDownload.classList.remove('downloading'), 800);
      }
    });
  }
}
