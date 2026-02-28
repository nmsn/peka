import { create } from 'zustand'
import type { Settings, ColorFormat, CopyFormat, ContrastResult, APCAResult } from '../types'
import type { LanguageCode } from '../i18n'

const ALL_COLOR_FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsb', 'hsl', 'lab', 'oklch']

export type AppMode = 'menubar' | 'dock'

interface ColorState {
  foreground: string
  background: string
  colorFormat: ColorFormat
  visibleColorFormats: ColorFormat[]
  copyFormat: CopyFormat
  contrastStandard: 'wcag' | 'apca'
  contrastResult: ContrastResult | APCAResult | null
  isPickerActive: boolean
  pickerTarget: 'foreground' | 'background' | null
  history: { foreground: string; background: string }[]
  historyIndex: number
  showPreferences: boolean
  showAbout: boolean
  hideColorName: boolean
  hidePekaWhilePicking: boolean
  launchAtLogin: boolean
  appMode: AppMode
  language: LanguageCode

  setForeground: (color: string) => void
  setBackground: (color: string) => void
  swapColors: () => void
  setColorFormat: (format: ColorFormat) => void
  toggleVisibleColorFormat: (format: ColorFormat) => void
  setCopyFormat: (format: CopyFormat) => void
  setContrastStandard: (standard: 'wcag' | 'apca') => void
  setContrastResult: (result: ContrastResult | APCAResult | null) => void
  setPickerActive: (active: boolean, target?: 'foreground' | 'background') => void
  undo: () => void
  redo: () => void
  setShowPreferences: (show: boolean) => void
  setShowAbout: (show: boolean) => void
  setHideColorName: (hide: boolean) => void
  setHidePekaWhilePicking: (hide: boolean) => void
  setLaunchAtLogin: (launch: boolean) => void
  setAppMode: (mode: AppMode) => void
  setLanguage: (language: LanguageCode) => void
  loadSettings: (settings: Settings) => void
}

export const useColorStore = create<ColorState>((set, get) => ({
  foreground: '#000000',
  background: '#ffffff',
  colorFormat: 'hex',
  visibleColorFormats: [...ALL_COLOR_FORMATS],
  copyFormat: 'css',
  contrastStandard: 'wcag',
  contrastResult: null,
  isPickerActive: false,
  pickerTarget: null,
  history: [{ foreground: '#000000', background: '#ffffff' }],
  historyIndex: 0,
  showPreferences: false,
  showAbout: false,
  hideColorName: false,
  hidePekaWhilePicking: false,
  launchAtLogin: false,
  appMode: 'menubar',
  language: 'en',

  setForeground: (color) => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push({ foreground: color, background: state.background })
    set({
      foreground: color,
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  setBackground: (color) => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push({ foreground: state.foreground, background: color })
    set({
      background: color,
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  swapColors: () => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push({ foreground: state.background, background: state.foreground })
    set({
      foreground: state.background,
      background: state.foreground,
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  setColorFormat: (format) => {
    const state = get()
    if (state.visibleColorFormats.includes(format)) {
      set({ colorFormat: format })
      return
    }
    const nextVisible = ALL_COLOR_FORMATS.filter(
      (item) => item === format || state.visibleColorFormats.includes(item)
    )
    set({
      colorFormat: format,
      visibleColorFormats: nextVisible
    })
  },
  toggleVisibleColorFormat: (format) => {
    const state = get()
    const isVisible = state.visibleColorFormats.includes(format)

    if (isVisible) {
      const nextVisible = state.visibleColorFormats.filter((item) => item !== format)
      if (nextVisible.length === 0) return
      const nextColorFormat = state.colorFormat === format ? nextVisible[0] : state.colorFormat
      set({
        visibleColorFormats: nextVisible,
        colorFormat: nextColorFormat
      })
      return
    }

    const nextVisible = ALL_COLOR_FORMATS.filter(
      (item) => item === format || state.visibleColorFormats.includes(item)
    )
    set({ visibleColorFormats: nextVisible })
  },
  setCopyFormat: (format) => set({ copyFormat: format }),
  setContrastStandard: (standard) => set({ contrastStandard: standard }),
  setContrastResult: (result) => set({ contrastResult: result }),
  setPickerActive: (active, target) =>
    set({ isPickerActive: active, pickerTarget: target ?? null }),

  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      const historyItem = state.history[newIndex]
      set({
        foreground: historyItem.foreground,
        background: historyItem.background,
        historyIndex: newIndex
      })
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      const historyItem = state.history[newIndex]
      set({
        foreground: historyItem.foreground,
        background: historyItem.background,
        historyIndex: newIndex
      })
    }
  },

  setShowPreferences: (show) => set({ showPreferences: show }),
  setShowAbout: (show) => set({ showAbout: show }),
  setHideColorName: (hide) => set({ hideColorName: hide }),
  setHidePekaWhilePicking: (hide) => set({ hidePekaWhilePicking: hide }),
  setLaunchAtLogin: (launch) => set({ launchAtLogin: launch }),
  setAppMode: (mode) => set({ appMode: mode }),
  setLanguage: (language) => set({ language }),

  loadSettings: (settings) => {
    set({
      foreground: settings.foregroundColor,
      background: settings.backgroundColor,
      colorFormat: settings.colorFormat,
      copyFormat: settings.copyFormat,
      contrastStandard: settings.contrastStandard,
      hideColorName: settings.hideColorName,
      hidePekaWhilePicking: settings.hidePekaWhilePicking,
      launchAtLogin: settings.launchAtLogin,
      appMode: settings.appMode,
      language: (settings as Settings & { language?: LanguageCode }).language ?? 'en'
    })
  }
}))
