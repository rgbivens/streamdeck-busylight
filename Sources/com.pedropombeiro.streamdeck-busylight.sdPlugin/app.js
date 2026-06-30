/* global $SD, Utils */

const busylightHTTPHost = 'http://localhost:8989';

const COLORS = {
    off:     { r: 0,   g: 0,   b: 0   },
    red:     { r: 100, g: 0,   b: 0   },
    green:   { r: 0,   g: 100, b: 0   },
    yellow:  { r: 100, g: 100, b: 0   },
    blue:    { r: 0,   g: 0,   b: 100 },
    magenta: { r: 100, g: 0,   b: 100 },
    cyan:    { r: 0,   g: 100, b: 100 },
    white:   { r: 100, g: 100, b: 100 },
    orange:  { r: 100, g: 50,  b: 0   },
};

const CANVAS_COLORS = {
    off:     { r: 0,   g: 0,   b: 0   },
    red:     { r: 255, g: 0,   b: 0   },
    green:   { r: 0,   g: 200, b: 0   },
    yellow:  { r: 255, g: 255, b: 0   },
    blue:    { r: 30,  g: 100, b: 255 },
    magenta: { r: 255, g: 0,   b: 255 },
    cyan:    { r: 0,   g: 220, b: 255 },
    white:   { r: 255, g: 255, b: 255 },
    orange:  { r: 255, g: 140, b: 0   },
};

function detectColorName(paramJSON) {
    if (!paramJSON) {
        return { color: 'off', blink: false };
    }
    const r = parseInt(paramJSON.red || 0);
    const g = parseInt(paramJSON.green || 0);
    const b = parseInt(paramJSON.blue || 0);
    const blink = paramJSON.action === 'pulse';

    for (const [name, vals] of Object.entries(COLORS)) {
        if (vals.r === r && vals.g === g && vals.b === b) {
            return { color: name, blink };
        }
    }
    // Approximate match for values not set by this plugin
    if (r === 0 && g === 0 && b === 0) return { color: 'off', blink: false };
    if (r > g && r > b) return { color: 'red', blink };
    if (g > r && g > b) return { color: 'green', blink };
    if (b > r && b > g) return { color: 'blue', blink };
    return { color: 'off', blink: false };
}

async function setBusylightColor(colorName, blink, sound, volume) {
    const { r, g, b } = COLORS[colorName] || COLORS.off;
    const hasSound = sound > 0 && colorName !== 'off';
    const action = hasSound ? 'alert' : (blink && colorName !== 'off') ? 'pulse' : 'light';
    let url = `${busylightHTTPHost}?action=${action}`;
    if (r) url += `&red=${r}`;
    if (g) url += `&green=${g}`;
    if (b) url += `&blue=${b}`;
    if (hasSound) {
        url += `&sound=${sound}&volume=${volume !== undefined ? volume : 75}`;
    }
    console.log('[app.js] setBusylightColor:', url);
    return fetch(url);
}

function generateButtonImage(colorName, isActive) {
    const SIZE = 144;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const { r, g, b } = CANVAS_COLORS[colorName] || CANVAS_COLORS.off;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const radius = 54;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, SIZE, SIZE);

    if (isActive && colorName !== 'off') {
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.6);
        glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, SIZE, SIZE);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = colorName === 'off'
            ? 'rgba(100,100,100,0.4)'
            : `rgba(${r},${g},${b},0.35)`;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    return canvas.toDataURL('image/png');
}

$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.willDisappear', (jsonObj) => action.onWillDisappear(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.applicationDidLaunch', (jsonObj) => action.onApplicationDidLaunch(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.applicationDidTerminate', (jsonObj) => action.onApplicationDidTerminate(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.didReceiveSettings', (jsonObj) => action.onDidReceiveSettings(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.propertyInspectorDidAppear', () => {
        console.log('[app.js] propertyInspectorDidAppear');
    });
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.propertyInspectorDidDisappear', () => {
        console.log('[app.js] propertyInspectorDidDisappear');
    });
}

const action = {
    cache: {},

    getContextFromCache(ctx) {
        return this.cache[ctx];
    },

    onDidReceiveSettings(jsn) {
        const settings = Utils.getProp(jsn, 'payload.settings', {});
        const found = this.getContextFromCache(jsn.context);
        if (found) {
            found.updateSettings(settings);
        }
    },

    onWillAppear: async function(jsn) {
        const settings = jsn.payload.settings || {};
        if (!jsn.payload.isInMultiAction) {
            const watcher = new BusylightHttpWatcher(jsn.context, settings);
            this.cache[jsn.context] = watcher;
        }
    },

    onWillDisappear(jsn) {
        const found = this.getContextFromCache(jsn.context);
        if (found) {
            found.stop();
            delete this.cache[jsn.context];
        }
    },

    onKeyUp: async function(jsn) {
        console.log('[app.js] onKeyUp fired, context:', jsn.context);
        if (!this.getContextFromCache(jsn.context)) {
            await this.onWillAppear(jsn);
        }
        await this.toggleBusylightAsync(jsn);
    },

    onSendToPlugin(jsn) {
        const pl = Utils.getProp(jsn, 'payload', {});
        const found = this.getContextFromCache(jsn.context);
        if (found && (pl.color !== undefined || pl.blink !== undefined || pl.sound !== undefined || pl.volume !== undefined)) {
            found.updateSettings(pl);
        }
    },

    onApplicationDidLaunch(jsn) {
        if (jsn.payload.isInMultiAction) return;
        setTimeout(() => {
            const found = this.getContextFromCache(jsn.context);
            if (found) found.refreshButtonAsync();
        }, 2000);
    },

    onApplicationDidTerminate(jsn) {
        if (jsn.payload.isInMultiAction) return;
        const found = this.getContextFromCache(jsn.context);
        if (found) found.refreshButtonAsync();
    },

    toggleBusylightAsync: async function(jsn) {
        const watcher = this.getContextFromCache(jsn.context);
        const isActive = watcher ? watcher.getIsActive() : false;
        const colorName = watcher ? watcher.getColor() : 'green';
        const blink = watcher ? watcher.getBlink() : false;
        const sound = watcher ? watcher.getSound() : 0;
        const volume = watcher ? watcher.getVolume() : 75;

        const targetColor = isActive ? 'off' : colorName;
        const targetBlink = isActive ? false : blink;
        const targetSound = isActive ? 0 : sound;
        const targetVolume = isActive ? 75 : volume;

        try {
            await setBusylightColor(targetColor, targetBlink, targetSound, targetVolume);
        } catch (e) {
            console.error('[app.js] setBusylightColor failed:', e);
            $SD.api.setTitle(jsn.context, 'ERROR');
            $SD.api.send(jsn.context, 'showAlert');
            return;
        }

        this.notifyWatchers(targetColor, targetBlink, jsn.context);

        if (watcher) {
            await watcher.refreshButtonAsync(targetColor, targetBlink, true);
        }
    },

    notifyWatchers(lightColor, lightBlink, excludeContext) {
        for (const key in this.cache) {
            if (Object.hasOwnProperty.call(this.cache, key) && key !== excludeContext) {
                this.cache[key].refreshButtonAsync(lightColor, lightBlink, false);
            }
        }
    }
};

function BusylightHttpWatcher(context, settings) {
    let timer = 0;
    let currentSettings = Object.assign({ color: 'green', blink: false, sound: 0, volume: 75 }, settings);
    let isActive = false;

    function getColor() { return currentSettings.color || 'green'; }
    function getBlink() { return !!currentSettings.blink; }
    function getSound() { return currentSettings.sound || 0; }
    function getVolume() { return currentSettings.volume !== undefined ? currentSettings.volume : 75; }
    function getLabel() { return currentSettings.label || getColor().toUpperCase(); }
    function getIsActive() { return isActive; }

    function updateSettings(newSettings) {
        Object.assign(currentSettings, newSettings);
        $SD.api.setTitle(context, getLabel());
        const image = generateButtonImage(getColor(), isActive);
        $SD.api.setImage(context, image, 0);
    }

    function start() {
        if (timer !== 0) return;
        console.log('[app.js] starting watcher');
        refreshButtonAsync();
        timer = setInterval(refreshButtonAsync, 5000);
    }

    function stop() {
        if (timer === 0) return;
        console.log('[app.js] stopping watcher');
        clearInterval(timer);
        timer = 0;
    }

    async function refreshButtonAsync(overrideLightColor, overrideLightBlink, userInitiated) {
        try {
            let lightColor, lightBlink;

            if (overrideLightColor !== undefined) {
                lightColor = overrideLightColor;
                lightBlink = !!overrideLightBlink;
            } else {
                const state = await fetchCurrentState();
                if (state === null) return;
                lightColor = state.color;
                lightBlink = state.blink;
            }

            const myColor = getColor();
            isActive = (lightColor === myColor && myColor !== 'off');

            $SD.api.setTitle(context, getLabel());
            const image = generateButtonImage(myColor, isActive);
            $SD.api.setImage(context, image, 0);

            if (userInitiated) {
                $SD.api.send(context, 'showOk');
            }
        } catch (err) {
            console.error('[app.js] refreshButtonAsync error:', err);
            $SD.api.setTitle(context, 'NOT INSTALLED');
            $SD.api.send(context, 'showAlert');
        }
    }

    async function fetchCurrentState() {
        const resp = await fetch(`${busylightHTTPHost}?action=currentpresence`);
        if (resp.status !== 200) {
            $SD.api.setTitle(context, String(resp.status));
            $SD.api.send(context, 'showAlert');
            return null;
        }

        const payload = await resp.json();
        const parameter = payload.runningcommand.parameter;

        $SD.api.setTitle(context, '');

        if (parameter == null) {
            return { color: 'off', blink: false };
        }

        const paramJSON = JSON.parse(parameter);
        return detectColorName(paramJSON);
    }

    start();

    return { getColor, getBlink, getSound, getVolume, getLabel, getIsActive, updateSettings, refreshButtonAsync, stop };
}
