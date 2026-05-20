# Mind & Body Mobile (prototype)

<br>

<!-- Screenshot -->
<p align="center">
  <img src="./assets/images/preview.png" alt="App screenshot" width="300" />
</p>

<br>

## About

This is the mobile application for Mind & Body, a platform for gym members to train, view their routines, track their progress, and manage their workouts...

## Requirements

- [Node.js](https://nodejs.org/) >= 20.19.x
- [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/) (imagine using npm in big 2026)
- [Expo Go](https://expo.dev/go) on your device, or an Android/iOS emulator

## Installation

```bash
pnpm install
```

## Usage

```bash
# Start the development server
pnpm start

# Android
pnpm run android

# iOS
pnpm run ios

# Web
pnpm run web
```

Scan the QR code with Expo Go to open the app on your device.

### Installing the APK directly (Android)

If you have an APK build and want to install it on a physical device or emulator via ADB:

1. Enable **USB Debugging** on your Android device (`Settings > Developer Options`)
2. Connect your device via USB and verify it is detected:

```bash
adb devices
```

1. Install the APK:

```bash
adb install <your-apk-file>.apk
```

> If you have multiple devices connected, target a specific one with `adb -s <device-id> install ...`

## Stack

- [Expo](https://expo.dev) ~55
- [React Native](https://reactnative.dev) 0.83
- [React](https://react.dev) 19
- [Expo Router](https://expo.github.io/router)
