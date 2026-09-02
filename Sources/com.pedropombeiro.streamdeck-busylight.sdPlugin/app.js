/* global $SD, Utils */

const busylightHTTPHost = 'http://localhost:8989';

const COLORS = {
    off: { r: 0, g: 0, b: 0 },
    red: { r: 100, g: 0, b: 0 },
    green: { r: 0, g: 100, b: 0 },
    yellow: { r: 100, g: 100, b: 0 },
    blue: { r: 0, g: 0, b: 100 },
    magenta: { r: 100, g: 0, b: 100 },
    cyan: { r: 0, g: 100, b: 100 },
    white: { r: 100, g: 100, b: 100 },
    orange: { r: 100, g: 50, b: 0 },
};

const CANVAS_COLORS = {
    off: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 200, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    blue: { r: 30, g: 100, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    cyan: { r: 0, g: 220, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    orange: { r: 255, g: 140, b: 0 },
};

let deviceImagePromise;

function loadDeviceImage() {
    if (!deviceImagePromise) {
        deviceImagePromise = new Promise((resolve, reject) => {
            const deviceImage = new Image();
            deviceImage.onload = () => resolve(deviceImage);
            deviceImage.onerror = () => reject(new Error('Unable to load the Busylight device image.'));
            deviceImage.src = 'action/images/off-air@2x.png';
        });
    }

    return deviceImagePromise;
}

function detectColorName(parameter) {
    if (!parameter) return { color: 'off', blink: false };

    const red = parseInt(parameter.red ?? parameter.RedRgbValue ?? 0, 10);
    const green = parseInt(parameter.green ?? parameter.GreenRgbValue ?? 0, 10);
    const blue = parseInt(parameter.blue ?? parameter.BlueRgbValue ?? 0, 10);
    const blink = parameter.action === 'pulse';

    for (const [color, values] of Object.entries(COLORS)) {
        if (values.r === red && values.g === green && values.b === blue) {
            return { color, blink };
        }
    }

    if (red === 0 && green === 0 && blue === 0) return { color: 'off', blink: false };
    if (red > green && red > blue) return { color: 'red', blink };
    if (green > red && green > blue) return { color: 'green', blink };
    if (blue > red && blue > green) return { color: 'blue', blink };
    return { color: 'off', blink: false };
}

async function setBusylightColor(color, blink, sound, volume) {
    const { r: red, g: green, b: blue } = COLORS[color] || COLORS.off;
    const hasSound = sound > 0 && color !== 'off';
    const action = hasSound ? 'alert' : (blink && color !== 'off' ? 'pulse' : 'light');
    const parameters = new URLSearchParams({ action });

    if (red) parameters.set('red', red);
    if (green) parameters.set('green', green);
    if (blue) parameters.set('blue', blue);
    if (hasSound) {
        parameters.set('sound', sound);
        parameters.set('volume', volume);
    }

    return fetch(`${busylightHTTPHost}?${parameters}`);
}

async function generateButtonImage(color, isActive) {
    const size = 144;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const { r: red, g: green, b: blue } = CANVAS_COLORS[color] || CANVAS_COLORS.off;
    const deviceImage = await loadDeviceImage();
    const deviceCanvas = document.createElement('canvas');
    deviceCanvas.width = deviceCanvas.height = size;
    const deviceContext = deviceCanvas.getContext('2d');
    deviceContext.drawImage(deviceImage, 0, 0, size, size);
    const sourcePixels = deviceContext.getImageData(0, 0, size, size).data;
    const tintedDevice = context.createImageData(size, size);
    const opacity = isActive && color !== 'off' ? 0.95 : 0.36;

    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, size, size);

    for (let index = 0; index < sourcePixels.length; index += 4) {
        const sourceAlpha = sourcePixels[index + 3] / 255;
        if (color === 'off') {
            const grayscale = Math.round(
                sourcePixels[index] * 0.2126 +
                sourcePixels[index + 1] * 0.7152 +
                sourcePixels[index + 2] * 0.0722
            );
            tintedDevice.data[index] = grayscale;
            tintedDevice.data[index + 1] = grayscale;
            tintedDevice.data[index + 2] = grayscale;
            tintedDevice.data[index + 3] = Math.round(sourceAlpha * 150);
            continue;
        }

        const brightness = Math.max(sourcePixels[index], sourcePixels[index + 1], sourcePixels[index + 2]);
        tintedDevice.data[index] = red;
        tintedDevice.data[index + 1] = green;
        tintedDevice.data[index + 2] = blue;
        tintedDevice.data[index + 3] = brightness * sourceAlpha * opacity;
    }

    context.putImageData(tintedDevice, 0, 0);

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
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.propertyInspectorDidAppear', (jsonObj) => action.onPropertyInspectorDidAppear(jsonObj));
    $SD.on('com.pedropombeiro.streamdeck-busylight.toggle.propertyInspectorDidDisappear', () => {});
};

// ACTIONS

const action = {
    cache: {},

    getContextFromCache: function (ctx) {
        return this.cache[ctx];
    },

    onDidReceiveSettings: function(jsn) {
        const settings = Utils.getProp(jsn, 'payload.settings', {});
        const found = this.getContextFromCache(jsn.context);
        if (found) {
            found.updateSettings(settings);
        }
    },

    /**
     * The 'willAppear' event is the first event a key will receive, right before it gets
     * shown on your Stream Deck and/or in Stream Deck software.
     * This event is a good place to setup your plugin and look at current settings (if any),
     * which are embedded in the events payload.
     */

    onWillAppear: async function (jsn) {
        if (!jsn.payload.isInMultiAction) {
            const watcher = new BusylightHttpWatcher(jsn.context, jsn.payload.settings || {});
            this.cache[jsn.context] = watcher;
        }
    },

    onWillDisappear: function (jsn) {
        let found = this.getContextFromCache(jsn.context);
        if (found) {
            found.stop();
            delete this.cache[jsn.context];
        }
    },

    onKeyUp: async function (jsn) {
        if (!this.getContextFromCache(jsn.context)) await this.onWillAppear(jsn);
        await this.toggleBusylightAsync(jsn);
    },

    onSendToPlugin: function (jsn) {
        const settings = Utils.getProp(jsn, 'payload', {});
        const found = this.getContextFromCache(jsn.context);
        if (found && (
            settings.color !== undefined ||
            settings.blink !== undefined ||
            settings.sound !== undefined ||
            settings.volume !== undefined
        )) {
            found.updateSettings(settings);
        }
    },

    onPropertyInspectorDidAppear: function (jsn) {
        const found = this.getContextFromCache(jsn.context);
        const settings = Utils.getProp(jsn, 'payload.settings', null);
        if (settings) {
            $SD.api.sendToPropertyInspector(jsn.context, settings, jsn.action);
        } else if (found) {
            $SD.api.sendToPropertyInspector(jsn.context, found.getSettings(), jsn.action);
        }
    },

    onApplicationDidLaunch: function (jsn) {
        if (jsn.payload.isInMultiAction) {
            return;
        }

        setTimeout(() => {
            const found = this.getContextFromCache(jsn.context);
            if (found) {
                found.refreshButtonAsync();
			};
        }, 2000);
    },

    onApplicationDidTerminate: function (jsn) {
        if (jsn.payload.isInMultiAction) {
            return;
        }

        const found = this.getContextFromCache(jsn.context);
        if (found) {
            found.refreshButtonAsync();
        }
    },

    /**
     * This snippet shows how you could save settings persistantly to Stream Deck software.
     * It is not used in this example plugin.
     */

    saveSettings: function (jsn, sdpi_collection) {
        console.log('saveSettings:', jsn);
        if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
            if (sdpi_collection.value && sdpi_collection.value !== undefined) {
                this.settings[sdpi_collection.key] = sdpi_collection.value;
                console.log('setSettings....', this.settings);
                $SD.api.setSettings(jsn.context, this.settings);
            }
        }
    },

    /**
     * Finally here's a method which gets called from various events above.
     * This is just an idea on how you can act on receiving some interesting message
     * from Stream Deck.
     */

     toggleBusylightAsync: async function(jsn) {
        const found = this.getContextFromCache(jsn.context);
        const targetColor = found && found.getIsActive() ? 'off' : (found ? found.getColor() : 'green');
        const targetBlink = targetColor === 'off' ? false : (found ? found.getBlink() : false);
        const targetSound = targetColor === 'off' ? 0 : (found ? found.getSound() : 0);
        const targetVolume = found ? found.getVolume() : 75;

        try {
            await setBusylightColor(targetColor, targetBlink, targetSound, targetVolume);
        } catch (error) {
            $SD.api.setTitle(jsn.context, 'ERROR');
            $SD.api.send(jsn.context, 'showAlert');
            return;
        }

        this.notifyWatchers(targetColor, targetBlink, jsn.context);
        if (found) {
            await found.refreshButtonAsync(targetColor, targetBlink, true);
        }
    },

    notifyWatchers: function(lightColor, lightBlink, excludeContext) {
        for (const key in this.cache) {
            if (Object.hasOwnProperty.call(this.cache, key) && key !== excludeContext) {
                this.cache[key].refreshButtonAsync(lightColor, lightBlink, false);
            }
        }
    }
};

function BusylightHttpWatcher (context, settings) {
    let timer = 0;
    let currentSettings = Object.assign({ color: 'green', blink: false, sound: 0, volume: 75 }, settings);
    let isActive = false;

    function getColor() { return currentSettings.color || 'green'; }
    function getBlink() { return !!currentSettings.blink; }
    function getSound() { return currentSettings.sound || 0; }
    function getVolume() { return currentSettings.volume !== undefined ? currentSettings.volume : 75; }
    function getLabel() { return currentSettings.label || ''; }
    function getSettings() {
        return {
            color: getColor(),
            blink: getBlink(),
            sound: getSound(),
            volume: getVolume()
        };
    }
    function getIsActive() { return isActive; }

    async function renderButtonImage() {
        $SD.api.setImage(context, await generateButtonImage(getColor(), isActive), 0);
    }

    function updateSettings(newSettings) {
        Object.assign(currentSettings, newSettings);
        $SD.api.setTitle(context, getLabel());
        void renderButtonImage().catch(console.error);
    }


    function start() {
        if (timer !== 0) {
            return;
        }

        console.log('[app.js]starting watcher')
        refreshButtonAsync();
        timer = setInterval(function (sx) {
            refreshButtonAsync();
        }, 5000);
    }

    function stop() {
        if (timer === 0) {
            return;
        }

        console.log('[app.js]stopping watcher')
        window.clearInterval(timer);
        timer = 0;
    }

    async function refreshButtonAsync(overrideColor, overrideBlink, userInitiated = false) {
        console.log('%c%s', `color: white; background: 'grey'; font-size: 15px;`, `[app.js]refreshButtonAsync`);

        try {
            const light = overrideColor === undefined
                ? await fetchLastStateAsync()
                : { color: overrideColor, blink: !!overrideBlink };
            if (light === null) return;

            isActive = light.color === getColor() && getColor() !== 'off';
            $SD.api.setTitle(context, getLabel());
            await renderButtonImage();
            if (userInitiated) $SD.api.send(context, 'showOk');
        } catch (error) {
            console.log(error);
            $SD.api.setTitle(context, 'NOT INSTALLED');
            $SD.api.send(context, 'showAlert');
            return;
        }
    }

    async function fetchLastStateAsync() {
        const resp = await fetch(`${busylightHTTPHost}?action=currentpresence`);
        if (resp.status != 200) {
            $SD.api.setTitle(context, resp.status);
            $SD.api.send(context, 'showAlert');
            return null;
        }

        const payload = await resp.json();
        const parameter = payload.runningcommand.parameter;

        if (parameter == null) {
            return { color: 'off', blink: false };
        }

        const paramJSON = JSON.parse(parameter);
        return detectColorName(paramJSON);
    }

    start();

    return {
        getColor: getColor,
        getBlink: getBlink,
        getSound: getSound,
        getVolume: getVolume,
        getSettings: getSettings,
        getIsActive: getIsActive,
        updateSettings: updateSettings,
        refreshButtonAsync: refreshButtonAsync,
        stop: stop
    };
};
