import { create } from 'zustand'
import type { Settings, ColorFormat, CopyFormat, ContrastResult, APCAResult } from '../types'

interface ColorState {
  foreground: string
  background: string
  colorFormat: ColorFormat
  copyFormat: CopyFormat
  contrastStandard: 'wcag' | 'apca'
  contrastResult: ContrastResult | APCAResult | null
  isPickerActive: boolean
  pickerTarget: 'foreground' | 'background' | null
  history: { foreground: string; background: string }[]
  historyIndex: number
  showPreferences: boolean

  setForeground: (color: string) => void
  setBackground: (color: string) => void
  swapColors: () => void
  setColorFormat: (format: ColorFormat) => void
  setCopyFormat: (format: CopyFormat) => void
  setContrastStandard: (standard: 'wcag' | 'apca') => void
  setContrastResult: (result: ContrastResult | APCAResult | null) => void
  setPickerActive: (active: boolean, target?: 'foreground' | 'background') => void
  undo: () => void
  redo: () => void
  setShowPreferences: (show: boolean) => void
  loadSettings: (settings: Settings) => void
}

export const useColorStore = create<ColorState>((set, get) => ({
  foreground: '#000000',
  background: '#ffffff',
  colorFormat: 'hex',
  copyFormat: 'css',
  contrastStandard: 'wcag',
  contrastResult: null,
  isPickerActive: false,
  pickerTarget: null,
  history: [{ foreground: '#000000', background: '#ffffff' }],
  historyIndex: 0,
  showPreferences: false,

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

  setColorFormat: (format) => set({ colorFormat: format }),
  setCopyFormat: (format) => set({ copyFormat: format }),
  setContrastStandard: (standard) => set({ contrastStandard: standard }),
  setContrastResult: (result) => set({ contrastResult: result }),
  setPickerActive: (active, target) => set({ isPickerActive: active, pickerTarget: target ?? null }),

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

  loadSettings: (settings) => {
    set({
      foreground: settings.foregroundColor,
      background: settings.backgroundColor,
      colorFormat: settings.colorFormat,
      copyFormat: settings.copyFormat,
      contrastStandard: settings.contrastStandard
    })
  }
}))
