# Peka Electrobun

This directory contains the Electrobun implementation of Peka, aiming for full feature parity with the Electron app.

It uses Electrobun APIs for windows, tray, global shortcuts, and typed RPC, plus a macOS-native color picker built on a Swift helper around `NSColorSampler`.

## Goals

- Full functional parity with the Electron app
- Same interaction model and window behavior
- Native macOS color picking and overlay

## Current structure

- `electrobun.config.ts`: actual Electrobun build configuration
- `src/bun/index.ts`: Bun-side runtime entrypoint with real BrowserWindow, Tray, GlobalShortcut, and RPC wiring
- `src/bun/adapter.ts`: thin adapter over verified Electrobun APIs
- `src/shared/contracts.ts`: shared runtime contracts and facts model
- `src/shared/checklist.ts`: validation targets and success criteria
- `src/shared/rpc.ts`: typed RPC schema for Bun <-> webview communication

## Commands

```bash
pnpm electrobun:dev
pnpm electrobun:typecheck
```

Additional local commands inside `app/electrobun/`:

```bash
pnpm build
pnpm run
pnpm test:color-pick
pnpm dev:auto-pick
```

Before using the app for the first time, install its local dependencies once:

```bash
cd app/electrobun
bun install
```

`pnpm test:color-pick` runs the Bun-side helper bridge directly, without needing the full Electrobun window to be open.

`pnpm dev:auto-pick` starts the app and automatically triggers one foreground color pick as soon as the renderer is ready.
