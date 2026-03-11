import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import type { Settings, ColorFormat, CopyFormat, AppMode, ContrastStandard, LanguageCode } from '../shared/types'

const DEFAULT_SETTINGS: Settings = {
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
  backgroundColor: '#ffffff',
  language: 'en'
}

class SettingsStore {
  private settings: Settings
  private storePath: string

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp'
    const appDir =
      process.platform === 'darwin'
        ? join(homeDir, 'Library', 'Application Support', 'Peka')
        : join(homeDir, '.peka')
    
    if (!existsSync(appDir)) {
      mkdirSync(appDir, { recursive: true })
    }
    
    this.storePath = join(appDir, 'settings.json')
    this.settings = this.load()
  }

  private load(): Settings {
    try {
      if (existsSync(this.storePath)) {
        const data = readFileSync(this.storePath, 'utf-8')
        const parsed = JSON.parse(data) as Partial<Settings>
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  private save(): void {
    try {
      writeFileSync(this.storePath, JSON.stringify(this.settings, null, 2))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  get(): Settings {
    return { ...this.settings }
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings = { ...this.settings, [key]: value }
    this.save()
  }

  setForegroundColor(color: string): void {
    this.settings.foregroundColor = color
    this.save()
  }

  setBackgroundColor(color: string): void {
    this.settings.backgroundColor = color
    this.save()
  }
}

export const settingsStore = new SettingsStore()

export const getSettings = (): Settings => settingsStore.get()
export const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]): void => settingsStore.set(key, value)
export const setForegroundColor = (color: string): void => settingsStore.setForegroundColor(color)
export const setBackgroundColor = (color: string): void => settingsStore.setBackgroundColor(color)
