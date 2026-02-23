import { contextBridge, ipcRenderer } from 'electron'

export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'oklch'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'
export type AppMode = 'menubar' | 'regular' | 'hidden'
export type ContrastStandard = 'wcag' | 'apca'

export interface ColorValue {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsb: { h: number; s: number; b: number }
  hsl: { h: number; s: number; l: number }
  lab: { l: number; a: number; b: number }
  oklch: { l: number; c: number; h: number; a: number }
}

export interface ContrastResult {
  ratio: number
  wcagAA: boolean
  wcagAALarge: boolean
  wcagAAA: boolean
  wcagAAALarge: boolean
}

export interface APCAResult {
  lc: number
  level: 'AA' | 'AAA' | 'Fail'
  fontSize: 'normal' | 'large' | 'heading' | 'graphic'
}

export interface Settings {
  colorFormat: ColorFormat
  copyFormat: CopyFormat
  appMode: AppMode
  appFloating: boolean
  hidePikaWhilePicking: boolean
  copyColorOnPick: boolean
  showColorOverlay: boolean
  colorOverlayDuration: number
  contrastStandard: ContrastStandard
  colorSpace: string
  foregroundColor: string
  backgroundColor: string
}

export interface AppInfo {
  name: string
  version: string
}

export interface PikaAPI {
  getSettings: () => Promise<Settings>
  setSetting: (key: string, value: unknown) => Promise<boolean>
  setForegroundColor: (color: string) => Promise<boolean>
  setBackgroundColor: (color: string) => Promise<boolean>
  formatColor: (hex: string, format: ColorFormat) => Promise<string>
  formatForCopy: (hex: string, style: CopyFormat) => Promise<string>
  getColorName: (hex: string) => Promise<string | null>
  parseColor: (input: string) => Promise<string | null>
  getColorValue: (hex: string) => Promise<ColorValue>
  getWcagContrast: (foreground: string, background: string) => Promise<ContrastResult>
  getApcbContrast: (foreground: string, background: string) => Promise<APCAResult>
  copyToClipboard: (text: string) => Promise<boolean>
  captureScreen: () => Promise<string | null>
  getCursorPosition: () => Promise<{ x: number; y: number }>
  getScreenSize: () => Promise<{ width: number; height: number }>
  pickColor: (type: 'foreground' | 'background') => Promise<string | null>
  onPickForeground: (callback: () => void) => void
  onPickBackground: (callback: () => void) => void
  onFormatChange: (callback: (format: string) => void) => void
  onCopy: (callback: () => void) => void
  onCopyBackground: (callback: () => void) => void
  onSwap: (callback: () => void) => void
  onUndo: (callback: () => void) => void
  onRedo: (callback: () => void) => void
  onPreferences: (callback: () => void) => void
  minimizeWindow: () => Promise<boolean>
  toggleMaximizeWindow: () => Promise<boolean>
  closeWindow: () => Promise<boolean>
  isWindowMaximized: () => Promise<boolean>
  onWindowMaximizedChange: (callback: (maximized: boolean) => void) => void
  showAbout: () => Promise<boolean>
  getAppInfo: () => Promise<AppInfo>
  checkForUpdates: () => Promise<boolean>
  quitApp: () => Promise<boolean>
}

declare global {
  interface Window {
    api: PikaAPI
  }
}

const api: PikaAPI = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  setSetting: (key: string, value: unknown): Promise<boolean> =>
    ipcRenderer.invoke('set-setting', key, value),
  setForegroundColor: (color: string): Promise<boolean> =>
    ipcRenderer.invoke('set-foreground-color', color),
  setBackgroundColor: (color: string): Promise<boolean> =>
    ipcRenderer.invoke('set-background-color', color),
  formatColor: (hex: string, format: ColorFormat): Promise<string> =>
    ipcRenderer.invoke('format-color', hex, format),
  formatForCopy: (hex: string, style: CopyFormat): Promise<string> =>
    ipcRenderer.invoke('format-for-copy', hex, style),
  getColorName: (hex: string): Promise<string | null> =>
    ipcRenderer.invoke('get-color-name', hex),
  parseColor: (input: string): Promise<string | null> => ipcRenderer.invoke('parse-color', input),
  getColorValue: (hex: string): Promise<ColorValue> => ipcRenderer.invoke('get-color-value', hex),
  getWcagContrast: (foreground: string, background: string): Promise<ContrastResult> =>
    ipcRenderer.invoke('get-wcag-contrast', foreground, background),
  getApcbContrast: (foreground: string, background: string): Promise<APCAResult> =>
    ipcRenderer.invoke('get-apca-contrast', foreground, background),
  copyToClipboard: (text: string): Promise<boolean> =>
    ipcRenderer.invoke('copy-to-clipboard', text),
  captureScreen: (): Promise<string | null> => ipcRenderer.invoke('capture-screen'),
  getCursorPosition: (): Promise<{ x: number; y: number }> =>
    ipcRenderer.invoke('get-cursor-position'),
  getScreenSize: (): Promise<{ width: number; height: number }> =>
    ipcRenderer.invoke('get-screen-size'),
  pickColor: (type: 'foreground' | 'background'): Promise<string | null> =>
    ipcRenderer.invoke('pick-color', type),
  onPickForeground: (callback: () => void): void => {
    ipcRenderer.on('shortcut:pick-foreground', callback)
  },
  onPickBackground: (callback: () => void): void => {
    ipcRenderer.on('shortcut:pick-background', callback)
  },
  onFormatChange: (callback: (format: string) => void): void => {
    ipcRenderer.on('shortcut:format', (_event, format) => callback(format))
  },
  onCopy: (callback: () => void): void => {
    ipcRenderer.on('shortcut:copy', callback)
  },
  onCopyBackground: (callback: () => void): void => {
    ipcRenderer.on('shortcut:copy-background', callback)
  },
  onSwap: (callback: () => void): void => {
    ipcRenderer.on('shortcut:swap', callback)
  },
  onUndo: (callback: () => void): void => {
    ipcRenderer.on('shortcut:undo', callback)
  },
  onRedo: (callback: () => void): void => {
    ipcRenderer.on('shortcut:redo', callback)
  },
  onPreferences: (callback: () => void): void => {
    ipcRenderer.on('shortcut:preferences', callback)
  },
  minimizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window-toggle-maximize'),
  closeWindow: (): Promise<boolean> => ipcRenderer.invoke('window-close'),
  isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximizedChange: (callback: (maximized: boolean) => void): void => {
    ipcRenderer.on('window:maximized', (_event, maximized) => callback(Boolean(maximized)))
  },
  showAbout: (): Promise<boolean> => ipcRenderer.invoke('app-show-about'),
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app-get-info'),
  checkForUpdates: (): Promise<boolean> => ipcRenderer.invoke('app-check-for-updates'),
  quitApp: (): Promise<boolean> => ipcRenderer.invoke('app-quit')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
