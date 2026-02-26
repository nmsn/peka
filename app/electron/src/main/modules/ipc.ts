import { ipcMain, clipboard, BrowserWindow, app } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getSettings, setSetting, setForegroundColor, setBackgroundColor } from './store'
import { formatColor, formatForCopy, getColorName, parseColor, hexToColorValue } from './color'
import { getWCAGContrast, getAPCAContrast } from './accessibility'
import { getColorPicker, destroyTray, applyAppMode } from '../index'

export const registerIpcHandlers = (): void => {
  log.info('Registering IPC handlers')

  ipcMain.handle('get-settings', () => {
    const settings = getSettings()
    return {
      ...settings,
      launchAtLogin: app.getLoginItemSettings().openAtLogin
    }
  })

  ipcMain.handle('set-setting', (_event, key: string, value: unknown) => {
    if (key === 'launchAtLogin') {
      const openAtLogin = Boolean(value)
      app.setLoginItemSettings({ openAtLogin })
      setSetting('launchAtLogin', openAtLogin)
      return true
    }

    if (key === 'appMode') {
      const appMode = value === 'menubar' ? 'menubar' : 'dock'
      setSetting('appMode', appMode)
      applyAppMode(appMode)
      return true
    }

    setSetting(key as keyof ReturnType<typeof getSettings>, value as never)
    return true
  })

  ipcMain.handle('set-foreground-color', (_event, color: string) => {
    setForegroundColor(color)
    return true
  })

  ipcMain.handle('set-background-color', (_event, color: string) => {
    setBackgroundColor(color)
    return true
  })

  ipcMain.handle('format-color', (_event, hex: string, format: string) => {
    return formatColor(hex, format as Parameters<typeof formatColor>[1])
  })

  ipcMain.handle('format-for-copy', (_event, hex: string, style: string) => {
    return formatForCopy(hex, style as Parameters<typeof formatForCopy>[1])
  })

  ipcMain.handle('get-color-name', (_event, hex: string) => {
    return getColorName(hex)
  })

  ipcMain.handle('parse-color', (_event, input: string) => {
    return parseColor(input)
  })

  ipcMain.handle('get-color-value', (_event, hex: string) => {
    return hexToColorValue(hex)
  })

  ipcMain.handle('get-wcag-contrast', (_event, foreground: string, background: string) => {
    return getWCAGContrast(foreground, background)
  })

  ipcMain.handle('get-apca-contrast', (_event, foreground: string, background: string) => {
    return getAPCAContrast(foreground, background)
  })

  ipcMain.handle('copy-to-clipboard', (_event, text: string) => {
    clipboard.writeText(text)
    return true
  })

  ipcMain.handle('capture-screen', async () => {
    try {
      const sources = await (async () => {
        const { desktopCapturer } = await import('electron')
        return desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1, height: 1 }
        })
      })()
      
      if (sources.length > 0) {
        return sources[0].thumbnail.toDataURL()
      }
      return null
    } catch (error) {
      log.error('Failed to capture screen:', error)
      return null
    }
  })

  ipcMain.handle('get-cursor-position', () => {
    const { screen } = require('electron')
    const point = screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  })

  ipcMain.handle('get-screen-size', () => {
    const { screen } = require('electron')
    const display = screen.getPrimaryDisplay()
    return { width: display.size.width, height: display.size.height }
  })

  ipcMain.handle('pick-color', async (_event, type: 'foreground' | 'background') => {
    const colorPicker = getColorPicker()
    if (!colorPicker) {
      log.error('Color picker not initialized')
      return null
    }

    const color = await colorPicker.start()
    if (color) {
      if (type === 'foreground') {
        setForegroundColor(color)
      } else {
        setBackgroundColor(color)
      }
    }
    return color
  })

  ipcMain.handle('window-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
    return true
  })

  ipcMain.handle('window-toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return false
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
    return true
  })

  ipcMain.handle('window-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
    return true
  })

  ipcMain.handle('window-is-maximized', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isMaximized() ?? false
  })

  ipcMain.handle('window-hide', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.hide()
    return true
  })

  ipcMain.handle('window-show', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.show()
    window?.focus()
    return true
  })

  ipcMain.handle('app-show-about', () => {
    app.showAboutPanel()
    return true
  })

  ipcMain.handle('app-get-info', async () => {
    let version = app.getVersion()

    try {
      const packageJsonPath = join(app.getAppPath(), 'package.json')
      const packageContent = await readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageContent) as { version?: string }
      if (typeof packageJson.version === 'string' && packageJson.version.trim()) {
        version = packageJson.version.trim()
      }
    } catch (error) {
      log.warn('Failed to read version from package.json, fallback to app.getVersion()', error)
    }

    return {
      name: app.getName(),
      version
    }
  })

  ipcMain.handle('app-check-for-updates', async () => {
    try {
      await autoUpdater.checkForUpdatesAndNotify()
      return true
    } catch (error) {
      log.error('Failed to check for updates:', error)
      return false
    }
  })

  ipcMain.handle('app-quit', () => {
    destroyTray()
    app.exit(0)
    return true
  })

  log.info('IPC handlers registered')
}

export const registerShortcuts = (_mainWindow: BrowserWindow): void => {
  log.info('Registering global shortcuts')
  log.info('Global shortcuts registered')
}

export const unregisterShortcuts = (): void => {
  const { globalShortcut } = require('electron')
  globalShortcut.unregisterAll()
  log.info('Global shortcuts unregistered')
}
