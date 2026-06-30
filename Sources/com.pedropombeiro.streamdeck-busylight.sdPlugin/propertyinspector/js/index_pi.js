/* global $SD, Utils */

let settings = { color: 'green', blink: false, sound: 0, volume: 75 };

$SD.on('connected', (jsn) => {
    const saved = Utils.getProp(jsn, 'actionInfo.payload.settings', {});
    settings = Object.assign({ color: 'green', blink: false, sound: 0, volume: 75 }, saved);
    updateUI();
});

$SD.on('sendToPropertyInspector', (jsn) => {
    const pl = jsn.payload || {};
    if (pl.color !== undefined) settings.color = pl.color;
    if (pl.blink !== undefined) settings.blink = pl.blink;
    if (pl.sound !== undefined) settings.sound = pl.sound;
    if (pl.volume !== undefined) settings.volume = pl.volume;
    updateUI();
});

function updateUI() {
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('selected', s.dataset.color === settings.color);
    });
    const blinkEl = document.getElementById('blinkToggle');
    if (blinkEl) blinkEl.checked = !!settings.blink;

    const soundEl = document.getElementById('soundSelect');
    if (soundEl) soundEl.value = String(settings.sound || 0);

    const volumeEl = document.getElementById('volumeSelect');
    if (volumeEl) volumeEl.value = String(settings.volume !== undefined ? settings.volume : 75);
}

function saveAndNotify() {
    $SD.api.setSettings($SD.uuid, settings);
    if ($SD.connection && $SD.connection.readyState === 1) {
        const json = {
            action: $SD.actionInfo['action'],
            event: 'sendToPlugin',
            context: $SD.uuid,
            payload: {
                color: settings.color,
                blink: settings.blink,
                sound: settings.sound,
                volume: settings.volume
            }
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

    document.getElementById('soundSelect').addEventListener('change', (e) => {
        settings.sound = parseInt(e.target.value, 10);
        saveAndNotify();
    });

    document.getElementById('volumeSelect').addEventListener('change', (e) => {
        settings.volume = parseInt(e.target.value, 10);
        saveAndNotify();
    });
});
