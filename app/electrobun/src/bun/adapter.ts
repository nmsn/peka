import { BrowserWindow, GlobalShortcut, Tray } from 'electrobun/bun'
import type { RPCWithTransport } from 'electrobun/bun'

import { pickColorWithMacOSHelper } from './macosColorPicker'
import type {
  ColorPickResult,
  ElectrobunRuntimeAdapter,
  RuntimeTray,
  RuntimeWindow,
  RuntimeWindowOptions
} from '../shared/contracts'

class ElectrobunWindowAdapter implements RuntimeWindow {
  constructor(private readonly window: BrowserWindow<RPCWithTransport>) {}

  get id(): number {
    return this.window.id
  }

  async loadURL(_url: string): Promise<void> {
    return Promise.resolve()
  }

  async loadFile(_filePath: string): Promise<void> {
    return Promise.resolve()
  }

  show(): void {
    this.window.show()
  }

  hide(): void {
    this.window.minimize()
  }

  minimize(): void {
    this.window.minimize()
  }

  maximize(): void {
    this.window.maximize()
  }

  unmaximize(): void {
    this.window.unmaximize()
  }

  close(): void {
    this.window.close()
  }

  on(eventName: string, callback: () => void): void {
    this.window.on(eventName, callback)
  }
}

class ElectrobunTrayAdapter implements RuntimeTray {
  constructor(private readonly tray: Tray) {}

  setTooltip(text: string): void {
    this.tray.setTitle(text)
  }

  setMenu(items: Array<{ label: string; action: string }>): void {
    this.tray.setMenu(items.map((item) => ({ type: 'normal', label: item.label, action: item.action })))
  }

  onClick(callback: () => void): void {
    this.tray.on('tray-clicked', callback)
  }
}

export class VerifiedElectrobunAdapter implements ElectrobunRuntimeAdapter {
  async createWindow(options: RuntimeWindowOptions & { rpc?: RPCWithTransport }): Promise<RuntimeWindow> {
    const window = new BrowserWindow({
      title: options.title,
      frame: {
        x: 80,
        y: 80,
        width: options.width,
        height: options.height
      },
      url: options.url,
      html: null,
      preload: null,
      renderer: 'native',
      rpc: options.rpc,
      titleBarStyle: options.frameless ? 'hidden' : 'default',
      transparent: false,
      sandbox: false,
      styleMask: options.styleMask
    })

    if (options.alwaysOnTop) {
      window.setAlwaysOnTop(true)
    }

    return new ElectrobunWindowAdapter(window)
  }

  async createTray(_iconPath: string): Promise<RuntimeTray> {
    const tray = new Tray({ title: '', template: true })
    if (_iconPath) {
      tray.setImage(_iconPath)
    }
    return new ElectrobunTrayAdapter(tray)
  }

  async registerGlobalShortcut(accelerator: string, action: () => void): Promise<boolean> {
    return GlobalShortcut.register(accelerator, action)
  }

  async unregisterAllShortcuts(): Promise<void> {
    GlobalShortcut.unregisterAll()
  }

  async pickColor(_kind: 'foreground' | 'background'): Promise<ColorPickResult | null> {
    if (process.platform !== 'darwin') {
      return null
    }

    return pickColorWithMacOSHelper()
  }
}

export const createRuntimeAdapter = (): ElectrobunRuntimeAdapter => new VerifiedElectrobunAdapter()
