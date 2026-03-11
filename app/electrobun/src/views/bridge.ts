/* eslint-disable @typescript-eslint/no-explicit-any */
import { Electroview } from 'electrobun/view'
import type { PikaAPI } from '../shared/types'
import type { PekaRPCSchema } from '../shared/rpc'
import type { Settings, ColorFormat, CopyFormat, ColorValue, ContrastResult, APCAResult, AppInfo } from '../shared/types'

declare global {
  interface Window {
    api: PikaAPI
  }
}

type ViewRpc = {
  request: {
    getSettings: () => Promise<Settings>
    setSetting: (params: { key: string; value: unknown }) => Promise<boolean>
    setForegroundColor: (params: { color: string }) => Promise<boolean>
    setBackgroundColor: (params: { color: string }) => Promise<boolean>
    formatColor: (params: { hex: string; format: ColorFormat }) => Promise<string>
    formatForCopy: (params: { hex: string; style: CopyFormat }) => Promise<string>
    getColorName: (params: { hex: string }) => Promise<string | null>
    parseColor: (params: { input: string }) => Promise<string | null>
    getColorValue: (params: { hex: string }) => Promise<ColorValue>
    getWcagContrast: (params: { foreground: string; background: string }) => Promise<ContrastResult>
    getApcbContrast: (params: { foreground: string; background: string }) => Promise<APCAResult>
    copyToClipboard: (params: { text: string }) => Promise<boolean>
    isWindowMaximized: () => Promise<boolean>
    showWindow: () => Promise<boolean>
    hideWindow: () => Promise<boolean>
    getAppInfo: () => Promise<AppInfo>
    quitApp: () => Promise<boolean>
    openSettingsWindow: () => Promise<boolean>
    sendWindowCommand: (params: { command: 'minimize' | 'toggle-maximize' | 'close' }) => Promise<boolean>
    requestColorPick: (params: { kind: 'foreground' | 'background' }) => Promise<string | null>
  }
  send: {
    rendererReady: (payload: { userAgent: string }) => void
    log: (payload: { message: string }) => void
  }
  on: {
    shortcutTriggered: (callback: (payload: {
      action:
        | 'foreground'
        | 'background'
        | 'swap'
        | 'copy'
        | 'copy-background'
        | 'undo'
        | 'redo'
        | 'preferences'
        | 'format'
      accelerator: string
      format?: ColorFormat
    }) => void) => void
    colorPickResult: (callback: (payload: { kind: 'foreground' | 'background'; result: string | null }) => void) => void
    settingsChanged: (callback: (payload: Settings) => void) => void
    windowMaximizedChange: (callback: (payload: boolean) => void) => void
  }
}

const eventListeners = {
  pickForeground: new Set<() => void>(),
  pickBackground: new Set<() => void>(),
  swap: new Set<() => void>(),
  copy: new Set<() => void>(),
  copyBackground: new Set<() => void>(),
  undo: new Set<() => void>(),
  redo: new Set<() => void>(),
  preferences: new Set<() => void>(),
  settingsChanged: new Set<(settings: Settings) => void>(),
  windowMaximizedChange: new Set<(maximized: boolean) => void>(),
  formatChange: new Set<(format: string) => void>()
}

export const initBridge = (): void => {
  const rawRpc = Electroview.defineRPC<PekaRPCSchema>({
    handlers: {
      requests: {},
      messages: {
        shortcutTriggered: (payload: {
          action:
            | 'foreground'
            | 'background'
            | 'swap'
            | 'copy'
            | 'copy-background'
            | 'undo'
            | 'redo'
            | 'preferences'
            | 'format'
          accelerator: string
          format?: ColorFormat
        }) => {
          console.log(`Shortcut triggered: ${payload.action} via ${payload.accelerator}`)
          if (payload.action === 'foreground') {
            eventListeners.pickForeground.forEach(cb => cb())
          } else if (payload.action === 'background') {
            eventListeners.pickBackground.forEach(cb => cb())
          } else if (payload.action === 'swap') {
            eventListeners.swap.forEach(cb => cb())
          } else if (payload.action === 'copy') {
            eventListeners.copy.forEach(cb => cb())
          } else if (payload.action === 'copy-background') {
            eventListeners.copyBackground.forEach(cb => cb())
          } else if (payload.action === 'undo') {
            eventListeners.undo.forEach(cb => cb())
          } else if (payload.action === 'redo') {
            eventListeners.redo.forEach(cb => cb())
          } else if (payload.action === 'preferences') {
            eventListeners.preferences.forEach(cb => cb())
          } else if (payload.action === 'format' && payload.format) {
            eventListeners.formatChange.forEach(cb => cb(payload.format as string))
          }
        },
        colorPickResult: (payload: { kind: 'foreground' | 'background'; result: string | null }) => {
          console.log(`Color pick result: ${payload.kind} = ${payload.result}`)
        },
        settingsChanged: (payload: Settings) => {
          eventListeners.settingsChanged.forEach(cb => cb(payload))
        },
        windowMaximizedChange: (payload: boolean) => {
          eventListeners.windowMaximizedChange.forEach(cb => cb(payload))
        },
        note: (payload: { message: string }) => {
          console.log(`[Bun] ${payload.message}`)
        },
        validationSnapshot: () => {},
        runtimeFactsUpdated: () => {}
      }
    }
  })

  const rpc = rawRpc as unknown as ViewRpc

  window.api = {
    getSettings: async () => rpc.request.getSettings(),
    setSetting: async (key: string, value: unknown) => rpc.request.setSetting({ key, value }),
    setForegroundColor: async (color: string) => rpc.request.setForegroundColor({ color }),
    setBackgroundColor: async (color: string) => rpc.request.setBackgroundColor({ color }),
    formatColor: async (hex: string, format: ColorFormat) => rpc.request.formatColor({ hex, format }),
    formatForCopy: async (hex: string, style: CopyFormat) => rpc.request.formatForCopy({ hex, style }),
    getColorName: async (hex: string) => rpc.request.getColorName({ hex }),
    parseColor: async (input: string) => rpc.request.parseColor({ input }),
    getColorValue: async (hex: string) => rpc.request.getColorValue({ hex }),
    getWcagContrast: async (foreground: string, background: string) =>
      rpc.request.getWcagContrast({ foreground, background }),
    getApcbContrast: async (foreground: string, background: string) =>
      rpc.request.getApcbContrast({ foreground, background }),
    copyToClipboard: async (text: string) => rpc.request.copyToClipboard({ text }),
    captureScreen: async () => rpc.request.captureScreen(),
    getCursorPosition: async () => rpc.request.getCursorPosition(),
    getScreenSize: async () => rpc.request.getScreenSize(),
    pickColor: async (type: 'foreground' | 'background') => rpc.request.requestColorPick({ kind: type }),
    onPickForeground: (callback: () => void) => {
      eventListeners.pickForeground.add(callback)
    },
    onPickBackground: (callback: () => void) => {
      eventListeners.pickBackground.add(callback)
    },
    onFormatChange: (callback: (format: string) => void) => {
      eventListeners.formatChange.add(callback)
    },
    onCopy: (callback: () => void) => {
      eventListeners.copy.add(callback)
    },
    onCopyBackground: (callback: () => void) => {
      eventListeners.copyBackground.add(callback)
    },
    onSwap: (callback: () => void) => {
      eventListeners.swap.add(callback)
    },
    onUndo: (callback: () => void) => {
      eventListeners.undo.add(callback)
    },
    onRedo: (callback: () => void) => {
      eventListeners.redo.add(callback)
    },
    onPreferences: (callback: () => void) => {
      eventListeners.preferences.add(callback)
    },
    onSettingsChanged: (callback: (settings: Settings) => void) => {
      eventListeners.settingsChanged.add(callback)
    },
    minimizeWindow: async () => rpc.request.sendWindowCommand({ command: 'minimize' }),
    toggleMaximizeWindow: async () => rpc.request.sendWindowCommand({ command: 'toggle-maximize' }),
    closeWindow: async () => rpc.request.sendWindowCommand({ command: 'close' }),
    isWindowMaximized: async () => rpc.request.isWindowMaximized(),
    hideWindow: async () => rpc.request.hideWindow(),
    showWindow: async () => rpc.request.showWindow(),
    onWindowMaximizedChange: (callback: (maximized: boolean) => void) => {
      eventListeners.windowMaximizedChange.add(callback)
    },
    showAbout: async () => {
      window.dispatchEvent(new CustomEvent('peka-show-about'))
      return true
    },
    getAppInfo: async () => rpc.request.getAppInfo(),
    checkForUpdates: async () => {
      return rpc.request.checkForUpdates()
    },
    quitApp: async () => rpc.request.quitApp(),
    openSettingsWindow: async () => {
      return rpc.request.openSettingsWindow()
    }
  }

  new Electroview({ rpc })
  rpc.send.rendererReady({ userAgent: navigator.userAgent })
  rpc.send.log({ message: 'Renderer booted and bridge ready.' })
}
