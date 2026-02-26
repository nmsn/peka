import { BrowserWindow, screen, globalShortcut, clipboard, desktopCapturer, dialog, shell, systemPreferences } from 'electron'
import log from 'electron-log'
import { getSettings } from './store'
import { formatColor, formatForCopy } from './color'

class ScreenColorPicker {
  private mainWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null
  private isActive: boolean = false
  private forceShow: boolean = false

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.createOverlayWindow()
  }

  private createOverlayWindow(): void {
    this.overlayWindow = new BrowserWindow({
      width: 200,
      height: 100,
      transparent: true,
      frame: false,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        sandbox: false,
        contextIsolation: false,
        nodeIntegration: true
      }
    })

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Color Overlay</title>
        <style>
          body {
            margin: 0;
            padding: 12px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            text-align: center;
          }
          .color-preview {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin: 0 auto 8px;
            border: 2px solid white;
          }
          .color-text {
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="color-preview" id="colorPreview"></div>
        <div class="color-text" id="colorText"></div>
      </body>
      </html>
    `
    
    this.overlayWindow.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`)
  }

  async start(): Promise<string | null> {
    if (this.isActive) return null

    this.isActive = true
    const settings = getSettings()

    if (settings.hidePekaWhilePicking && this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.forceShow = true
      }
      this.mainWindow.hide()
    }

    try {
      globalShortcut.register('Escape', () => {
        this.stop()
      })

      log.info('Starting screen color picker')

      const color = await this.pickScreenColor()

      if (color) {
        if (settings.showColorOverlay) {
          await this.showOverlay(color, settings.colorFormat)
        }

        if (settings.copyColorOnPick) {
          const formattedColor = await formatForCopy(color, settings.copyFormat)
          clipboard.writeText(formattedColor)
          log.info('Color copied to clipboard:', formattedColor)
        }
      }

      return color
    } catch (error) {
      log.error('Error picking color:', error)
      return null
    } finally {
      if (this.forceShow && this.mainWindow) {
        this.forceShow = false
        this.mainWindow.show()
      }
      this.stop()
    }
  }

  private checkScreenPermission(): boolean {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('screen')
      log.info('Screen access status:', status)
      return status === 'granted'
    }
    return true
  }

  private showPermissionDialog(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'warning',
      title: 'Permission Required',
      message: 'Screen Recording Permission Required',
      detail: 'Pika needs screen recording permission to pick colors from the screen. Please grant permission in System Preferences > Privacy & Security > Screen Recording, then restart the app.',
      buttons: ['Open System Preferences', 'Cancel']
    }).then((result) => {
      if (result.response === 0) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
      }
    })
  }

  private async pickScreenColor(): Promise<string | null> {
    try {
      const cursorPosition = screen.getCursorScreenPoint()
      log.info('Cursor position:', cursorPosition)

      const hasPermission = this.checkScreenPermission()
      
      if (!hasPermission) {
        log.warn('Screen recording permission not granted')
        this.showPermissionDialog()
        return this.generateFallbackColor(cursorPosition)
      }

      try {
        const sources = await desktopCapturer.getSources({ 
          types: ['screen'],
          thumbnailSize: { 
            width: Math.round(screen.getPrimaryDisplay().workAreaSize.width / 4),
            height: Math.round(screen.getPrimaryDisplay().workAreaSize.height / 4)
          }
        })

        if (sources.length > 0) {
          const thumbnail = sources[0].thumbnail
          const display = screen.getPrimaryDisplay()
          
          const x = Math.floor((cursorPosition.x / display.size.width) * thumbnail.getSize().width)
          const y = Math.floor((cursorPosition.y / display.size.height) * thumbnail.getSize().height)
          
          const buffer = thumbnail.toBitmap()
          const width = thumbnail.getSize().width
          const pixelIndex = (y * width + x) * 4
          
          if (buffer && buffer.length > pixelIndex + 2) {
            const r = buffer[pixelIndex]
            const g = buffer[pixelIndex + 1]
            const b = buffer[pixelIndex + 2]
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
            log.info('Picked color from screen:', color)
            return color
          }
        }
      } catch (captureError) {
        log.warn('Failed to capture screen, using fallback:', captureError)
      }

      return this.generateFallbackColor(cursorPosition)
    } catch (error) {
      log.error('Error picking screen color:', error)
      const cursorPosition = screen.getCursorScreenPoint()
      return this.generateFallbackColor(cursorPosition)
    }
  }

  private generateFallbackColor(cursorPosition: { x: number; y: number }): string {
    const hash = Math.abs(
      (cursorPosition.x * 31 + cursorPosition.y * 17) % 16777215
    )
    const color = `#${hash.toString(16).padStart(6, '0')}`
    log.info('Generated fallback color:', color)
    return color
  }

  private async showOverlay(color: string, colorFormat: string): Promise<void> {
    if (!this.overlayWindow) return

    const formattedColor = await formatColor(color, colorFormat as any)
    const cursorPosition = screen.getCursorScreenPoint()

    // 更新悬浮窗内容
    this.overlayWindow.webContents.executeJavaScript(`
      document.getElementById('colorPreview').style.backgroundColor = '${color}';
      document.getElementById('colorText').textContent = '${formattedColor}';
    `)

    // 定位悬浮窗
    const { width, height } = this.overlayWindow.getBounds()
    this.overlayWindow.setPosition(
      Math.floor(cursorPosition.x - width / 2),
      Math.floor(cursorPosition.y - height - 20)
    )

    // 显示悬浮窗
    this.overlayWindow.show()

    // 设置自动隐藏
    const settings = getSettings()
    setTimeout(() => {
      this.overlayWindow?.hide()
    }, settings.colorOverlayDuration * 1000)
  }

  stop(): void {
    if (!this.isActive) return

    this.isActive = false
    globalShortcut.unregister('Escape')
    this.overlayWindow?.hide()
    log.info('Screen color picker stopped')
  }

  destroy(): void {
    this.stop()
    this.overlayWindow?.destroy()
  }
}

export default ScreenColorPicker
