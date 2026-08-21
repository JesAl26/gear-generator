import { gearParams } from './params.js';
import { buildControls } from './controls.js';

/**
 * Listeners (cambiar valor → regenerar)
 */
export function initUI(onParamsChanged) {
    const uiContainer = document.getElementById('ui-container');
    if (!uiContainer) return;

    function rebuild() {
        buildControls(uiContainer, gearParams);
        _bindEvents(uiContainer, onParamsChanged, rebuild);
    }

    rebuild();
}

/**
 * Bind all control events after a buildControls() call.
 */
function _bindEvents(container, onParamsChanged, rebuild) {
    // ── Gear-count buttons ─────────────────────────────────────────────────
    container.querySelectorAll('.gear-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const count = parseInt(btn.dataset.count);
            if (gearParams.gearCount === count) return;
            gearParams.gearCount = count;
            rebuild();              // rebuild the controls (shows / hides gear2 section)
            if (onParamsChanged) onParamsChanged();
        });
    });

    // ── Range sliders ──────────────────────────────────────────────────────
    container.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', () => {
            const val = parseFloat(input.value);
            const id  = input.id;

            if (id === 'desiredRatio') {
                // Compute Z2 from ratio × Z1 and clamp to [8, 100]
                const z2 = Math.round(val * gearParams.teeth1);
                gearParams.teeth2 = Math.max(8, Math.min(100, z2));

                // Sync the Z2 slider display
                const z2Input = document.getElementById('teeth2');
                const z2Val   = document.getElementById('val-teeth2');
                if (z2Input) z2Input.value = gearParams.teeth2;
                if (z2Val)   z2Val.textContent = gearParams.teeth2;
            } else if (id === 'teeth2') {
                gearParams[id] = val;

                // Sync the ratio slider display
                const newRatio = (gearParams.teeth2 / gearParams.teeth1).toFixed(2);
                const ratioInput = document.getElementById('desiredRatio');
                const ratioVal   = document.getElementById('val-desiredRatio');
                if (ratioInput) ratioInput.value = newRatio;
                if (ratioVal)   ratioVal.textContent = newRatio;
            } else if (id === 'teeth1') {
                gearParams[id] = val;

                // Recompute ratio display if gear2 is active
                if (gearParams.gearCount === 2) {
                    const newRatio = (gearParams.teeth2 / gearParams.teeth1).toFixed(2);
                    const ratioInput = document.getElementById('desiredRatio');
                    const ratioVal   = document.getElementById('val-desiredRatio');
                    if (ratioInput) ratioInput.value = newRatio;
                    if (ratioVal)   ratioVal.textContent = newRatio;
                }
            } else {
                gearParams[id] = val;
            }

            if (onParamsChanged) onParamsChanged();
        });
    });
}
