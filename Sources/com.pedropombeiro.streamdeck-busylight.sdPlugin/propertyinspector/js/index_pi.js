/* global $SD, Utils */

let settings = { color: 'green', blink: false };

$SD.on('connected', (jsn) => {
    const saved = Utils.getProp(jsn, 'actionInfo.payload.settings', {});
    settings = Object.assign({ color: 'green', blink: false }, saved);
    updateUI();
});

$SD.on('sendToPropertyInspector', (jsn) => {
    const pl = jsn.payload || {};
    if (pl.color !== undefined) settings.color = pl.color;
    if (pl.blink !== undefined) settings.blink = pl.blink;
    updateUI();
});

function updateUI() {
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('selected', s.dataset.color === settings.color);
    });
    const blinkEl = document.getElementById('blinkToggle');
    if (blinkEl) blinkEl.checked = !!settings.blink;
}

function saveAndNotify() {
    $SD.api.setSettings($SD.uuid, settings);
    if ($SD.connection && $SD.connection.readyState === 1) {
        const json = {
            action: $SD.actionInfo['action'],
            event: 'sendToPlugin',
            context: $SD.uuid,
            payload: { color: settings.color, blink: settings.blink }
        };
        $SD.connection.send(JSON.stringify(json));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('colorGrid').addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        settings.color = swatch.dataset.color;
        updateUI();
        saveAndNotify();
    });

    document.getElementById('blinkToggle').addEventListener('change', (e) => {
        settings.blink = e.target.checked;
        saveAndNotify();
    });
});
