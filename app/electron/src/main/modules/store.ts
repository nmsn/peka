import Store from 'electron-store'
import log from 'electron-log'

export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'opengl'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'
export type AppMode = 'menubar' | 'regular' | 'hidden'
export type ContrastStandard = 'wcag' | 'apca'

interface StoreSchema {
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

const store = new Store<StoreSchema>({
  defaults: {
    colorFormat: 'hex',
    copyFormat: 'css',
    appMode: 'menubar',
    appFloating: true,
    hidePikaWhilePicking: false,
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
  return {
    colorFormat: store.get('colorFormat'),
    copyFormat: store.get('copyFormat'),
    appMode: store.get('appMode'),
    appFloating: store.get('appFloating'),
    hidePikaWhilePicking: store.get('hidePikaWhilePicking'),
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
