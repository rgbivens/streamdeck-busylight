# Stream Deck Busylight integration

The `Stream Deck Busylight` plugin integrates the Stream Deck with the [kuando Busylight](https://busylight.com/) presence indicator. It's perfect for letting your family or coworkers know when you're in available or not.

`Stream Deck Busylight` requires Stream Deck 4.1 or later, as well as the official [kuando Busylight HTTP](https://www.plenom.com/download/177233/) software.

# Description

`Stream Deck Busylight` provides a single action that toggles your Busylight on and off. When pressed, it activates the light in your chosen color; pressing again turns it off.

Each button can be independently configured via the property inspector with the following options:

- **Color** — choose from a 3×3 swatch grid: Off, Red, Green, Yellow, Blue, Pink, Cyan, White, and Orange
- **Blink** — enables pulse/blink mode instead of a solid light
- **Sound** — select one of 9 alert sounds (No Sound, Fairy Tale, Funky, Kuando Train, Open Office, Quiet, Telephone Nordic, Telephone Original, Telephone Pick Me Up). *Omega model only.*
- **Volume** — set the alert volume to 100%, 75%, 50%, 25%, or Mute. *Omega model only.*

It requires no configuration as it connects to the kuando Busylight HTTP server through the default connection parameters (`http://localhost:8989`).

## Features

- code written in Javascript
- cross-platform (macOS, Windows - not tested yet)
- localization support

## Installation

**Prerequisite**: Install the official [kuando Busylight HTTP](https://www.plenom.com/download/177233/) software.

Download the [latest release](https://gitlab.com/pedropombeiro/streamdeck-busylight/-/releases) and double-click the `.streamDeckPlugin` file, or [install](streamdeck://plugin/install/com.pedropombeiro.streamdeck-busylight) from the Elgato Store directly.

## Demo

[YouTube video](https://youtu.be/fgxbG2PBowo) - remember to turn on subtitles for description of what's going on. The Busylight action is located on the second row from the top, third column from the right.
