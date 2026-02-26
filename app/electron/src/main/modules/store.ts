import Store from 'electron-store'
import log from 'electron-log'

export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'oklch'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'
export type AppMode = 'menubar' | 'dock'
export type ContrastStandard = 'wcag' | 'apca'

interface StoreSchema {
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
}

const store = new Store<StoreSchema>({
  defaults: {
    colorFormat: 'hex',
    copyFormat: 'css',
    appMode: 'menubar',
    launchAtLogin: false,
    appFloating: true,
    hidePekaWhilePicking: false,
    hideColorName: false,
    copyColorOnPick: false,
    showColorOverlay: true,
    colorOverlayDuration: 2.0,
    contrastStandard: 'wcag',
    colorSpace: 'srgb',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff'
  }
})

log.info('Store initialized:', store.path)

export const getSettings = (): StoreSchema => {
  const rawColorFormat = store.get('colorFormat') as string
  const rawAppMode = store.get('appMode') as string
  const normalizedColorFormat: ColorFormat =
    rawColorFormat === 'opengl' ? 'oklch' : (rawColorFormat as ColorFormat)
  const normalizedAppMode: AppMode = rawAppMode === 'menubar' ? 'menubar' : 'dock'

  return {
    colorFormat: normalizedColorFormat,
    copyFormat: store.get('copyFormat'),
    appMode: normalizedAppMode,
    launchAtLogin: store.get('launchAtLogin'),
    appFloating: store.get('appFloating'),
    hidePekaWhilePicking: store.get('hidePekaWhilePicking'),
    hideColorName: store.get('hideColorName'),
    copyColorOnPick: store.get('copyColorOnPick'),
    showColorOverlay: store.get('showColorOverlay'),
    colorOverlayDuration: store.get('colorOverlayDuration'),
    contrastStandard: store.get('contrastStandard'),
    colorSpace: store.get('colorSpace'),
    foregroundColor: store.get('foregroundColor'),
    backgroundColor: store.get('backgroundColor')
  }
}

export const setSetting = <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void => {
  store.set(key, value)
}

export const setForegroundColor = (color: string): void => {
  store.set('foregroundColor', color)
}

export const setBackgroundColor = (color: string): void => {
  store.set('backgroundColor', color)
}

export default store
