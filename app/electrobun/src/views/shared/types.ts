export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'oklch'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'
export type AppMode = 'menubar' | 'dock'
export type ContrastStandard = 'wcag' | 'apca'
export type LanguageCode = 'en' | 'zh'

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
  launchAtLogin: boolean
  appFloating: boolean
  hidePekaWhilePicking: boolean
  hideColorName: boolean
  copyColorOnPick: boolean
  showColorOverlay: boolean
  colorOverlayDuration: number
  contrastStandard: ContrastStandard
  colorSpace: string
  foregroundColor: string
  backgroundColor: string
  language: LanguageCode
}

export interface AppInfo {
  name: string
  version: string
}
