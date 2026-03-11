import type { Settings, ColorFormat, CopyFormat, ColorValue, ContrastResult, APCAResult, AppInfo } from './types'

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
  onSettingsChanged: (callback: (settings: Settings) => void) => void
  minimizeWindow: () => Promise<boolean>
  toggleMaximizeWindow: () => Promise<boolean>
  closeWindow: () => Promise<boolean>
  isWindowMaximized: () => Promise<boolean>
  hideWindow: () => Promise<boolean>
  showWindow: () => Promise<boolean>
  onWindowMaximizedChange: (callback: (maximized: boolean) => void) => void
  showAbout: () => Promise<boolean>
  getAppInfo: () => Promise<AppInfo>
  checkForUpdates: () => Promise<boolean>
  quitApp: () => Promise<boolean>
  openSettingsWindow: () => Promise<boolean>
}

declare global {
  interface Window {
    api: PikaAPI
  }
}
