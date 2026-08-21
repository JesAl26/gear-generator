/**
 * Inputs y sliders — genera dinámicamente el panel de controles.
 *
 * El panel incluye:
 *  - Selector de cantidad de engranajes (1 ó 2)
 *  - Parámetros comunes (módulo, ángulo de presión, espesor, agujero)
 *  - Dientes del piñón (Z1)
 *  - Sección "Engranaje 2" (visible solo cuando gearCount === 2):
 *      · Relación de transmisión deseada (cambia Z2 automáticamente)
 *      · Dientes de la rueda (Z2) — actualiza la relación si se modifica a mano
 */
export function buildControls(container, params) {
    container.innerHTML = '';

    // ── Selector de engranajes ─────────────────────────────────────────────
    const countGroup = _createGroup();
    const countLabel = document.createElement('label');
    countLabel.textContent = 'Engranajes';
    countLabel.style.cssText = 'font-size:14px;font-weight:600;color:#00e5ff;';
    countGroup.appendChild(countLabel);

    const countRow = document.createElement('div');
    countRow.style.cssText = 'display:flex;gap:6px;margin-top:6px;';

    [1, 2].forEach(n => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = n === 1 ? '1 Engranaje' : '2 Engranajes';
        btn.dataset.count = n;
        btn.className = 'gear-count-btn' + (params.gearCount === n ? ' active' : '');
        countRow.appendChild(btn);
    });
    countGroup.appendChild(countRow);
    container.appendChild(countGroup);

    // ── Controles comunes ──────────────────────────────────────────────────
    const commonConfigs = [
        { id: 'module',        label: 'Módulo (m)',          min: 0.5, max: 10,  step: 0.5 },
        { id: 'teeth1',        label: 'Dientes Piñón (Z1)',  min: 8,   max: 100, step: 1   },
        { id: 'pressureAngle', label: 'Ángulo Presión (°)',  min: 14.5,max: 25,  step: 0.5 },
        { id: 'faceWidth',     label: 'Espesor (b)',         min: 2,   max: 50,  step: 1   },
        { id: 'holeRadius',    label: 'Radio Agujero',       min: 0,   max: 30,  step: 1   }
    ];

    commonConfigs.forEach(conf => _appendSlider(container, conf, params));

    // ── Sección Engranaje 2 (visible condicionalmente) ─────────────────────
    const gear2Section = document.createElement('div');
    gear2Section.id = 'gear2-section';
    gear2Section.style.display = params.gearCount === 2 ? 'block' : 'none';

    // Separador visual
    const sep = document.createElement('hr');
    sep.style.cssText = 'border:none;border-top:1px solid rgba(255,255,255,0.12);margin:8px 0;';
    gear2Section.appendChild(sep);

    const sectionTitle = document.createElement('span');
    sectionTitle.textContent = 'Engranaje 2';
    sectionTitle.style.cssText = 'font-size:13px;font-weight:600;color:#ff8800;letter-spacing:0.3px;display:block;margin-bottom:6px;';
    gear2Section.appendChild(sectionTitle);

    // Relación de transmisión deseada
    const ratioConf = { id: 'desiredRatio', label: 'Relación (i = Z2/Z1)', min: 0.2, max: 8, step: 0.05 };
    const currentRatio = params.teeth2 / params.teeth1;
    _appendSlider(gear2Section, ratioConf, { desiredRatio: +currentRatio.toFixed(2) });

    // Dientes Z2
    _appendSlider(gear2Section, { id: 'teeth2', label: 'Dientes Rueda (Z2)', min: 8, max: 100, step: 1 }, params);

    container.appendChild(gear2Section);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function _createGroup() {
    const g = document.createElement('div');
    g.className = 'control-group';
    g.style.marginBottom = '12px';
    return g;
}

function _appendSlider(parent, conf, params) {
    const val = params[conf.id];
    const group = _createGroup();

    const labelBox = document.createElement('div');
    labelBox.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px;';

    const label = document.createElement('label');
    label.htmlFor = conf.id;
    label.textContent = conf.label;
    label.style.cssText = 'font-size:13px;font-weight:500;';

    const valSpan = document.createElement('span');
    valSpan.id = `val-${conf.id}`;
    valSpan.textContent = val;
    valSpan.style.cssText = 'font-size:13px;color:#2b82c5;font-weight:bold;';

    labelBox.appendChild(label);
    labelBox.appendChild(valSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = conf.id;
    input.min = conf.min;
    input.max = conf.max;
    input.step = conf.step;
    input.value = val;
    input.style.width = '100%';

    // Local label update (value preview)
    input.addEventListener('input', () => {
        valSpan.textContent = input.value;
    });

    group.appendChild(labelBox);
    group.appendChild(input);
    parent.appendChild(group);
}
