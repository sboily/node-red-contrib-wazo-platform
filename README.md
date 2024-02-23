# node-red-contrib-wazo-platform

[![npm version](https://badge.fury.io/js/node-red-contrib-wazo-platform.svg)](https://badge.fury.io/js/node-red-contrib-wazo-platform)

Provide a Node-RED connector for integrating with the Wazo Platform, enabling seamless communication and automation workflows.

## Installation

```bash
cd ~/.node-red
npm install node-red-contrib-wazo-platform
```

## Quick Start

This package provides nodes that connect to the WebSocket to receive events from the Wazo Platform, as well as nodes for interacting with various APIs in the application. These nodes will be categorized under the 'Wazo CP' and 'Wazo UC' groups in the palette.

* 'Wazo CP' stands for Communication Programmable.
* 'Wazo UC' stands for Unified Communication.

## Examples

### Answer and Hangup call after 5 seconds.

![example1](./images/example1.png?raw=true)

### Small IVR

![example2](./images/example2.png?raw=true)
