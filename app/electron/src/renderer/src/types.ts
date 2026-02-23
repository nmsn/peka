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
