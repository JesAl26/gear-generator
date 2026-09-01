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
    countLabel.textContent = 'Gear System';
    countLabel.className = 'control-label';
    countGroup.appendChild(countLabel);

    const countRow = document.createElement('div');
    countRow.style.cssText = 'display:flex;gap:8px;margin-top:6px;';

    [1, 2].forEach(n => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = n === 1 ? '1 Gear' : '2 Gears';
        btn.dataset.count = n;
        btn.className = 'gear-count-btn' + (params.gearCount === n ? ' active' : '');
        countRow.appendChild(btn);
    });
    countGroup.appendChild(countRow);
    container.appendChild(countGroup);

    // ── Controles comunes ──────────────────────────────────────────────────
    const commonConfigs = [
        { id: 'module',        label: 'Module (m)',          unit: 'mm', min: 0.5, max: 10,  step: 0.5 },
        { id: 'teeth1',        label: 'Teeth (Z1)',          unit: '',   min: 8,   max: 100, step: 1   },
        { id: 'pressureAngle', label: 'Pressure Angle',      unit: '°',  min: 14.5,max: 25,  step: 0.5 },
        { id: 'faceWidth',     label: 'Thickness (b)',       unit: 'mm', min: 2,   max: 50,  step: 1   },
        { id: 'holeRadius',    label: 'Bore Radius',         unit: 'mm', min: 0,   max: 30,  step: 1   }
    ];

    commonConfigs.forEach(conf => _appendSlider(container, conf, params));

    // ── Sección Engranaje 2 (visible condicionalmente) ─────────────────────
    const gear2Section = document.createElement('div');
    gear2Section.id = 'gear2-section';
    gear2Section.style.display = params.gearCount === 2 ? 'block' : 'none';
    gear2Section.style.marginTop = '16px';

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = 'Driven Gear (Z2)';
    sectionTitle.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-main);margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:4px;';
    gear2Section.appendChild(sectionTitle);

    // Relación de transmisión deseada
    const ratioConf = { id: 'desiredRatio', label: 'Target Ratio (i)', unit: '', min: 0.2, max: 8, step: 0.05 };
    const currentRatio = params.teeth2 / params.teeth1;
    _appendSlider(gear2Section, ratioConf, { desiredRatio: +currentRatio.toFixed(2) });

    // Dientes Z2
    _appendSlider(gear2Section, { id: 'teeth2', label: 'Teeth (Z2)', unit: '', min: 8, max: 100, step: 1 }, params);

    container.appendChild(gear2Section);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function _createGroup() {
    const g = document.createElement('div');
    g.className = 'control-group';
    return g;
}

function _appendSlider(parent, conf, params) {
    const val = params[conf.id];
    const group = _createGroup();

    const labelBox = document.createElement('div');
    labelBox.className = 'label-box';

    const label = document.createElement('label');
    label.htmlFor = conf.id;
    label.textContent = conf.label;
    label.className = 'control-label';

    const valSpan = document.createElement('span');
    valSpan.id = `val-${conf.id}`;
    valSpan.textContent = val + (conf.unit ? ` ${conf.unit}` : '');
    valSpan.className = 'control-val';

    labelBox.appendChild(label);
    labelBox.appendChild(valSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = conf.id;
    input.min = conf.min;
    input.max = conf.max;
    input.step = conf.step;
    input.value = val;

    const rangeLabels = document.createElement('div');
    rangeLabels.className = 'range-labels';
    
    const minLabel = document.createElement('span');
    minLabel.textContent = conf.min;
    const maxLabel = document.createElement('span');
    maxLabel.textContent = conf.max;
    
    rangeLabels.appendChild(minLabel);
    rangeLabels.appendChild(maxLabel);

    // Local label update (value preview)
    input.addEventListener('input', () => {
        valSpan.textContent = input.value + (conf.unit ? ` ${conf.unit}` : '');
    });

    group.appendChild(labelBox);
    group.appendChild(input);
    group.appendChild(rangeLabels);
    parent.appendChild(group);
}
