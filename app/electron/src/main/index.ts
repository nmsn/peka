import { app, shell, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import icon from '../../resources/tray.png?asset'
import dockIcon from '../../resources/icon.png?asset'
import { registerIpcHandlers, registerShortcuts, unregisterShortcuts } from './modules/ipc'
import { getSettings, type AppMode } from './modules/store'
import ScreenColorPicker from './modules/eyedropper'

log.initialize()
log.info('Application starting...')

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let colorPicker: ScreenColorPicker | null = null

function createWindow(): void {
  log.info('Creating main window')

  mainWindow = new BrowserWindow({
    width: 620,
    height: 300,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 800,
    maxHeight: 400,
    show: false,
    frame: false,
    title: 'Peka',
    titleBarStyle: 'hidden',
    resizable: true,
    alwaysOnTop: getSettings().appFloating,
    skipTaskbar: getSettings().appMode === 'menubar',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    log.info('Main window shown')
  })

  mainWindow.on('close', (event) => {
    if (getSettings().appMode === 'menubar' && process.platform === 'darwin') {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    colorPicker?.destroy()
    colorPicker = null
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  registerShortcuts(mainWindow)
  colorPicker = new ScreenColorPicker(mainWindow)
}

function createTray(): void {
  if (process.platform !== 'darwin') return

  try {
    const trayIcon = nativeImage.createFromPath(icon)
    const resizedIcon = trayIcon.resize({ width: 22, height: 22 })
    resizedIcon.setTemplateImage(true)
    tray = new Tray(resizedIcon)

    const showMainWindow = (): void => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
        return
      }

      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Pika',
        click: (): void => {
          showMainWindow()
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: (): void => {
          app.quit()
        }
      }
    ])

    tray.setToolTip('Pika Color Picker')

    const toggleMainWindow = (): void => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
        return
      }

      if (mainWindow.isVisible()) {
        mainWindow.hide()
        return
      }

      showMainWindow()
    }

    tray.on('click', (event) => {
      // macOS: ctrl + left click should behave like right click
      if (event.ctrlKey) {
        tray?.popUpContextMenu(contextMenu)
        return
      }
      toggleMainWindow()
    })

    tray.on('right-click', () => {
      tray?.popUpContextMenu(contextMenu)
    })

    log.info('Tray created')
  } catch (error) {
    log.error('Failed to create tray:', error)
  }
}

export function getColorPicker(): ScreenColorPicker | null {
  return colorPicker
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

export function applyAppMode(mode: AppMode): void {
  if (process.platform !== 'darwin') return

  if (mode === 'menubar') {
    if (!tray) {
      createTray()
    }
    app.dock?.hide()
    mainWindow?.setSkipTaskbar(true)
    return
  }

  destroyTray()
  app.dock?.show()
  mainWindow?.setSkipTaskbar(false)
}

app.whenReady().then(() => {
  log.info('App ready')

  electronApp.setAppUserModelId('com.peka.app')

  if (process.platform === 'darwin') {
    const dockIconImage = nativeImage.createFromPath(dockIcon)
    app.dock?.setIcon(dockIconImage)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  registerIpcHandlers()
  applyAppMode(getSettings().appMode)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  destroyTray()
  if (process.platform !== 'darwin') {
    app.quit()
  } else {
    app.exit(0)
  }
})

app.on('will-quit', () => {
  unregisterShortcuts()
  log.info('Application quitting')
})

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason)
})
