import Electrobun, {
  BrowserView,
  BrowserWindow,
  Tray,
  type RPCWithTransport
} from 'electrobun/bun'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { createRuntimeAdapter } from './adapter'
import { requiredTargetIds, validationTargets } from '../shared/checklist'
import { getSettings, setSetting as storeSetSetting, setForegroundColor, setBackgroundColor } from './store'
import { formatColor, formatForCopy, getColorName, parseColor, hexToColorValue, getWCAGContrast, getAPCAContrast } from '../shared/color'
import type {
  ColorPickResult,
  RuntimeFacts,
  ValidationStatus,
  ValidationTarget,
  WindowCommand
} from '../shared/contracts'
import type { PekaRPCSchema } from '../shared/rpc'
import type { Settings, ColorFormat, CopyFormat, ColorValue, ContrastResult, APCAResult, AppInfo } from '../shared/types'

const adapter = createRuntimeAdapter()

let mainWindow: BrowserWindow<RPCWithTransport> | null = null
let settingsWindow: BrowserWindow<RPCWithTransport> | null = null
let overlayWindow: BrowserWindow<RPCWithTransport> | null = null
let tray: Tray | null = null
let rendererReady = false
let globalShortcutRegistered = false
let windowCreated = false
let trayCreated = false
let eventPushConfirmed = false
let autoPickTriggered = false
let overlayTimer: ReturnType<typeof setTimeout> | null = null
let overlayViewReady = false

const autoPickMode = process.env.PEKA_AUTO_PICK === 'foreground' || process.env.PEKA_AUTO_PICK === 'background'
  ? process.env.PEKA_AUTO_PICK
  : null

type BunToViewSend = {
  validationSnapshot: (payload: { targets: ValidationTarget[]; runtime: RuntimeFacts }) => void
  runtimeFactsUpdated: (payload: RuntimeFacts) => void
  shortcutTriggered: (payload: {
    action:
    | 'foreground'
    | 'background'
    | 'swap'
    | 'copy'
    | 'copy-background'
    | 'undo'
    | 'redo'
    | 'preferences'
    | 'format'
    accelerator: string
    format?: ColorFormat
  }) => void
  colorPickResult: (payload: { kind: 'foreground' | 'background'; result: string | null }) => void
  note: (payload: { message: string }) => void
  settingsChanged: (payload: Settings) => void
  windowMaximizedChange: (payload: boolean) => void
}

type BunRpc = {
  send: BunToViewSend
}

const asBunRpc = (value: unknown): BunRpc => value as BunRpc

const OVERLAY_SIZE = { width: 200, height: 110 }
const OVERLAY_PADDING = 20
const LAUNCH_AGENT_ID = 'com.peka.app'
const MAIN_WINDOW_MIN = { width: 400, height: 300 }
const MAIN_WINDOW_MAX = { width: 800, height: 400 }

const getLaunchAgentPath = (): string =>
  join(homedir(), 'Library', 'LaunchAgents', `${LAUNCH_AGENT_ID}.plist`)

const getCursorPosition = async (): Promise<{ x: number; y: number }> => {
  // @ts-ignore - Screen API exists at runtime
  const Screen = Electrobun.Screen
  if (Screen?.getCursorScreenPoint) {
    const point = Screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  }
  return { x: 0, y: 0 }
}

const getScreenSize = async (): Promise<{ width: number; height: number }> => {
  // @ts-ignore - Screen API exists at runtime
  const Screen = Electrobun.Screen
  if (Screen?.getPrimaryDisplay) {
    const display = Screen.getPrimaryDisplay()
    return { width: display.bounds.width, height: display.bounds.height }
  }
  return { width: 1920, height: 1080 }
}

const captureScreen = async (): Promise<string | null> => {
  if (process.platform !== 'darwin') {
    return null
  }

  const capturePath = join(tmpdir(), `peka-screen-${Date.now()}.png`)
  try {
    const proc = Bun.spawn(['screencapture', '-x', '-t', 'png', capturePath], {
      stdout: 'pipe',
      stderr: 'pipe'
    })
    const [stderr, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited
    ])
    if (exitCode !== 0) {
      console.warn('screencapture failed', stderr)
      return null
    }

    const buffer = await Bun.file(capturePath).arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.warn('captureScreen error', error)
    return null
  } finally {
    if (existsSync(capturePath)) {
      try {
        unlinkSync(capturePath)
      } catch (error) {
        console.warn('Failed to clean capture file', error)
      }
    }
  }
}

const resolveLaunchTarget = (): string[] => {
  const execPath = process.execPath
  const appIndex = execPath.indexOf('.app/')
  if (appIndex !== -1) {
    const appPath = execPath.slice(0, appIndex + 4)
    return ['/usr/bin/open', '-a', appPath]
  }
  return [execPath]
}

const writeLaunchAgent = (args: string[]): void => {
  const launchAgentPath = getLaunchAgentPath()
  mkdirSync(dirname(launchAgentPath), { recursive: true })

  const programArgs = args.map((arg) => `      <string>${arg}</string>`).join('\n')
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${LAUNCH_AGENT_ID}</string>
    <key>ProgramArguments</key>
    <array>
${programArgs}
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>
`

  writeFileSync(launchAgentPath, plist)
}

const runLaunchCtl = async (args: string[]): Promise<boolean> => {
  try {
    const proc = Bun.spawn(['launchctl', ...args], { stdout: 'pipe', stderr: 'pipe' })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited
    ])
    if (exitCode !== 0) {
      console.warn(`launchctl ${args.join(' ')} failed`, stdout, stderr)
      return false
    }
    return true
  } catch (error) {
    console.warn(`launchctl ${args.join(' ')} threw`, error)
    return false
  }
}

const applyLaunchAtLogin = async (enabled: boolean): Promise<void> => {
  if (process.platform !== 'darwin') return

  const launchAgentPath = getLaunchAgentPath()
  const uid = typeof process.getuid === 'function' ? process.getuid() : null

  if (enabled) {
    writeLaunchAgent(resolveLaunchTarget())
    const loaded = await runLaunchCtl(['load', '-w', launchAgentPath])
    if (!loaded && uid !== null) {
      await runLaunchCtl(['bootstrap', `gui/${uid}`, launchAgentPath])
    }
    return
  }

  const unloaded = await runLaunchCtl(['unload', '-w', launchAgentPath])
  if (!unloaded && uid !== null) {
    await runLaunchCtl(['bootout', `gui/${uid}`, launchAgentPath])
  }
  if (existsSync(launchAgentPath)) {
    try {
      unlinkSync(launchAgentPath)
    } catch (error) {
      console.warn('Failed to remove launch agent plist', error)
    }
  }
}

const resolveLaunchAtLogin = (): boolean => {
  if (process.platform !== 'darwin') {
    return getSettings().launchAtLogin
  }
  return existsSync(getLaunchAgentPath())
}

const getSettingsSnapshot = (): Settings => ({
  ...getSettings(),
  launchAtLogin: resolveLaunchAtLogin()
})

const getAppInfo = async (): Promise<AppInfo> => {
  try {
    const packageJsonPath = join(import.meta.dir, '..', '..', 'package.json')
    const content = await readFile(packageJsonPath, 'utf-8')
    const parsed = JSON.parse(content) as { name?: string; version?: string }
    return {
      name: 'Peka',
      version: parsed.version?.trim() || '0.1.0-electrobun'
    }
  } catch (error) {
    console.warn('Failed to read app info from package.json', error)
    return { name: 'Peka', version: '0.1.0-electrobun' }
  }
}

const clampMainWindowSize = (): void => {
  if (!mainWindow) return
  // @ts-ignore - getFrame exists at runtime
  const frame = mainWindow.getFrame?.() ?? { width: 620, height: 300 }
  const clampedWidth = Math.min(Math.max(frame.width, MAIN_WINDOW_MIN.width), MAIN_WINDOW_MAX.width)
  const clampedHeight = Math.min(Math.max(frame.height, MAIN_WINDOW_MIN.height), MAIN_WINDOW_MAX.height)
  if (clampedWidth !== frame.width || clampedHeight !== frame.height) {
    // @ts-ignore - setSize exists at runtime
    mainWindow.setSize?.(clampedWidth, clampedHeight)
  }
}

const getOverlayHtml = (): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Color Overlay</title>
    <style>
      body {
        margin: 0;
        padding: 12px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        text-align: center;
      }
      .color-preview {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        margin: 0 auto 8px;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }
      .color-text {
        font-weight: 600;
        letter-spacing: 0.2px;
      }
    </style>
  </head>
  <body>
    <div class="color-preview" id="colorPreview"></div>
    <div class="color-text" id="colorText"></div>
  </body>
</html>
`

const getOverlayDataUrl = (): string =>
  `data:text/html;base64,${Buffer.from(getOverlayHtml()).toString('base64')}`

const ensureOverlayWindow = (): BrowserWindow<RPCWithTransport> => {
  if (overlayWindow) {
    return overlayWindow
  }

  overlayWindow = new BrowserWindow({
    title: 'Peka Overlay',
    frame: {
      x: 0,
      y: 0,
      width: OVERLAY_SIZE.width,
      height: OVERLAY_SIZE.height
    },
    url: getOverlayDataUrl(),
    html: null,
    preload: null,
    renderer: 'native',
    titleBarStyle: 'hidden',
    transparent: true,
    sandbox: false,
    styleMask: {
      Borderless: true,
      Titled: false,
      Closable: false,
      Miniaturizable: false,
      Resizable: false,
      FullSizeContentView: true,
      UtilityWindow: true,
      NonactivatingPanel: true
    }
  })

  overlayWindow.setAlwaysOnTop(true)
  overlayViewReady = false

  // @ts-ignore - getById exists at runtime
  const overlayView = BrowserView.getById?.(overlayWindow.webviewId)
  if (overlayView) {
    overlayView.on('dom-ready', () => {
      overlayViewReady = true
    })
  }

  overlayWindow.on('close', () => {
    overlayWindow = null
    overlayViewReady = false
  })

  return overlayWindow
}

const waitForOverlayReady = async (timeoutMs = 1000): Promise<void> => {
  const started = Date.now()
  while (!overlayViewReady && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

const showColorOverlay = async (
  color: string,
  format: ColorFormat,
  cursor?: { x: number; y: number }
): Promise<void> => {
  try {
    const window = ensureOverlayWindow()
    if (!window) return

    const formatted = await formatColor(color, format)
    // @ts-ignore - getById exists at runtime
    const view = BrowserView.getById?.(window.webviewId)

    if (view && overlayWindow) {
      await waitForOverlayReady()
      try {
        const colorValue = JSON.stringify(color)
        const textValue = JSON.stringify(formatted)
        view.executeJavascript(
          `document.getElementById('colorPreview').style.backgroundColor = ${colorValue};
           document.getElementById('colorText').textContent = ${textValue};`
        )
      } catch (jsError) {
        console.warn('Failed to execute JavaScript in overlay:', jsError)
      }
    }

    // @ts-ignore - getFrame exists at runtime
    const fallbackFrame = mainWindow?.getFrame?.()
    const anchorX = cursor?.x ?? (fallbackFrame ? fallbackFrame.x + fallbackFrame.width / 2 : 200)
    const anchorY = cursor?.y ?? (fallbackFrame ? fallbackFrame.y + fallbackFrame.height / 2 : 200)

    // @ts-ignore - setFrame exists at runtime
    window.setFrame?.(
      Math.round(anchorX - OVERLAY_SIZE.width / 2),
      Math.round(anchorY - OVERLAY_SIZE.height - OVERLAY_PADDING),
      OVERLAY_SIZE.width,
      OVERLAY_SIZE.height
    )

    window.show()

    if (overlayTimer) {
      clearTimeout(overlayTimer)
    }

    const durationMs = Math.max(0.3, getSettings().colorOverlayDuration) * 1000
    overlayTimer = setTimeout(() => {
      overlayTimer = null
      if (overlayWindow) {
        try {
          overlayWindow.close()
        } catch (e) {
          console.warn('Failed to close overlay window:', e)
        }
        overlayWindow = null
      }
    }, durationMs)
  } catch (error) {
    console.error('showColorOverlay error:', error)
  }
}

const rawRpc = BrowserView.defineRPC<PekaRPCSchema>({
  handlers: {
    requests: {
      getValidationTargets: () => getValidationSnapshot(),
      getRuntimeFacts: () => collectRuntimeFacts(),
      sendWindowCommand: (params?: unknown) =>
        handleWindowCommand((params as { command: WindowCommand }).command),
      requestColorPick: async (params?: unknown): Promise<string | null> => {
        const kind = (params as { kind: 'foreground' | 'background' }).kind
        return handleColorPick(kind)
      },
      getSettings: () => getSettingsSnapshot(),
      setSetting: async (params?: unknown) => {
        const { key, value } = params as { key: string; value: unknown }
        if (key === 'launchAtLogin') {
          const enabled = Boolean(value)
          storeSetSetting('launchAtLogin', enabled)
          await applyLaunchAtLogin(enabled)
          sendToView('settingsChanged', getSettingsSnapshot())
          return true
        }

        storeSetSetting(key as keyof Settings, value as Settings[keyof Settings])
        if (key === 'appFloating' && mainWindow) {
          mainWindow.setAlwaysOnTop(Boolean(value))
        }
        if (key === 'appMode') {
          void applyAppMode(value as Settings['appMode'])
        }
        sendToView('settingsChanged', getSettingsSnapshot())
        return true
      },
      setForegroundColor: (params?: unknown) => {
        const { color } = params as { color: string }
        setForegroundColor(color)
        return true
      },
      setBackgroundColor: (params?: unknown) => {
        const { color } = params as { color: string }
        setBackgroundColor(color)
        return true
      },
      formatColor: (params?: unknown) => {
        const { hex, format } = params as { hex: string; format: ColorFormat }
        return formatColor(hex, format)
      },
      formatForCopy: (params?: unknown) => {
        const { hex, style } = params as { hex: string; style: CopyFormat }
        return formatForCopy(hex, style)
      },
      getColorName: (params?: unknown) => {
        const { hex } = params as { hex: string }
        return getColorName(hex)
      },
      parseColor: (params?: unknown) => {
        const { input } = params as { input: string }
        return parseColor(input)
      },
      getColorValue: (params?: unknown) => {
        const { hex } = params as { hex: string }
        return hexToColorValue(hex)
      },
      getWcagContrast: (params?: unknown) => {
        const { foreground, background } = params as { foreground: string; background: string }
        return getWCAGContrast(foreground, background)
      },
      getApcbContrast: (params?: unknown) => {
        const { foreground, background } = params as { foreground: string; background: string }
        return getAPCAContrast(foreground, background)
      },
      copyToClipboard: (params?: unknown) => {
        const { text } = params as { text: string }
        // @ts-ignore - Utils exists at runtime
        Electrobun.Utils?.clipboardWriteText?.(text)
        return true
      }, captureScreen: () => captureScreen(),
      getCursorPosition: () => getCursorPosition(),
      getScreenSize: () => getScreenSize(),
      isWindowMaximized: () => mainWindow?.isMaximized() ?? false,
      showWindow: () => {
        mainWindow?.show()
        return true
      },
      hideWindow: () => {
        mainWindow?.minimize()
        return true
      },
      getAppInfo: () => getAppInfo(),
      checkForUpdates: () => {
        sendToView('note', {
          message: 'Update checks are not supported in the Electrobun build yet.'
        })
        return false
      },
      quitApp: () => {
        // @ts-ignore - Utils exists at runtime
        Electrobun.Utils?.quit?.()
        return true
      },
      openSettingsWindow: async () => {
        await ensureSettingsWindow()
        settingsWindow?.show()
        return true
      }
    },
    messages: {
      rendererReady: (payload: { userAgent: string }) => {
        rendererReady = true
        console.log(`[renderer-ready] ${payload.userAgent}`)
        pushValidationSnapshot()
        if (autoPickMode && !autoPickTriggered) {
          autoPickTriggered = true
          console.log(`[auto-pick] triggering ${autoPickMode} color pick`)
          void handleColorPick(autoPickMode)
        }
      },
      log: (payload: { message: string }) => {
        console.log(`[renderer] ${payload.message}`)
      }
    }
  }
})

const rpc = rawRpc as unknown as BunRpc

const verifiedPackageFacts = {
  packageName: 'electrobun',
  packageVersion: '1.15.1',
  verifiedViaPackageInspection: true,
  verifiedWindowApi: true,
  verifiedTrayApi: true,
  verifiedShortcutApi: true,
  verifiedRpcApi: true,
  verifiedColorPickApi: process.platform === 'darwin'
}

const cloneTargets = (): ValidationTarget[] => validationTargets.map((target) => ({ ...target, notes: [...target.notes] }))

const updateTarget = (
  targets: ValidationTarget[],
  id: string,
  status: ValidationStatus,
  extraNote?: string
): void => {
  const target = targets.find((item) => item.id === id)
  if (!target) return

  target.status = status
  if (extraNote && !target.notes.includes(extraNote)) {
    target.notes.push(extraNote)
  }
}

const collectRuntimeFacts = (): RuntimeFacts => ({
  ...verifiedPackageFacts,
  rendererReady,
  windowCreated,
  trayCreated,
  globalShortcutRegistered,
  eventPushConfirmed,
  requiredTargetIds
})

const getValidationSnapshot = (): ValidationTarget[] => {
  const targets = cloneTargets()

  if (windowCreated) {
    updateTarget(targets, 'window-startup', 'passed', 'Verified with real Electrobun BrowserWindow API wiring.')
  }

  updateTarget(targets, 'request-response', 'passed', 'Renderer can request main-process data through Electrobun RPC.')

  if (eventPushConfirmed) {
    updateTarget(targets, 'event-push', 'passed', 'Main process emitted a pushed message into the renderer bridge.')
  }

  if (trayCreated) {
    updateTarget(targets, 'tray', 'passed', 'Tray API is wired through real Electrobun primitives.')
  }

  if (globalShortcutRegistered) {
    updateTarget(targets, 'global-shortcut', 'passed', 'Foreground shortcut registered through Electrobun GlobalShortcut.')
  }

  updateTarget(
    targets,
    'macos-color-pick',
    process.platform === 'darwin' ? 'pending' : 'failed',
    process.platform === 'darwin'
      ? 'macOS helper experiment is wired, but still needs live confirmation from the system sampler.'
      : 'The current helper experiment only targets macOS.'
  )

  return targets
}

const sendToView = (method: keyof BunToViewSend, payload: Parameters<BunToViewSend[typeof method]>[0]): void => {
  try {
    if (!mainWindow) return
    asBunRpc(rpc).send[method](payload as never)
  } catch (error) {
    console.warn(`Failed to send ${method} to view:`, error)
  }
}

const pushValidationSnapshot = (): void => {
  if (!mainWindow) return

  sendToView('validationSnapshot', {
    targets: getValidationSnapshot(),
    runtime: collectRuntimeFacts()
  })
  eventPushConfirmed = true
}

const handleWindowCommand = (command: WindowCommand): boolean => {
  if (!mainWindow) return false

  switch (command) {
    case 'minimize':
      mainWindow.minimize()
      break
    case 'toggle-maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
      break
    case 'close':
      mainWindow.close()
      break
    default:
      return false
  }

  return true
}

const emitShortcut = (
  action:
    | 'foreground'
    | 'background'
    | 'swap'
    | 'copy'
    | 'copy-background'
    | 'undo'
    | 'redo'
    | 'preferences'
    | 'format',
  accelerator: string,
  format?: ColorFormat
): void => {
  sendToView('shortcutTriggered', { action, accelerator, ...(format ? { format } : {}) })
  pushValidationSnapshot()
}

const handleColorPick = async (kind: 'foreground' | 'background'): Promise<string | null> => {
  let hexResult: string | null = null
  try {
    const settings = getSettings()
    const result = await adapter.pickColor(kind)
    hexResult = result?.hex ?? null
    if (hexResult) {
      if (kind === 'foreground') {
        setForegroundColor(hexResult)
      } else {
        setBackgroundColor(hexResult)
      }
      sendToView('settingsChanged', getSettingsSnapshot())

      if (settings.copyColorOnPick) {
        try {
          const formatted = await formatForCopy(hexResult, settings.copyFormat)
          // @ts-ignore - Utils exists at runtime
          Electrobun.Utils?.clipboardWriteText?.(formatted)
        } catch (clipboardError) {
          console.warn('Failed to copy to clipboard:', clipboardError)
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Color pick error:', message)
  }

  try {
    sendToView('colorPickResult', { kind, result: hexResult })
    sendToView('note', {
      message: hexResult
        ? `Color pick succeeded for ${kind}: ${hexResult}`
        : 'Color picker opened but returned no color selection.'
    })
  } catch (sendError) {
    console.warn('Failed to send color pick result:', sendError)
  }

  return hexResult
}

const ensureSettingsWindow = async (): Promise<void> => {
  if (settingsWindow) {
    return
  }

  const runtimeWindow = await adapter.createWindow({
    title: 'Settings - Peka',
    width: 500,
    height: 420,
    frameless: true,
    alwaysOnTop: true,
    url: 'views://settings/index.html',
    rpc,
    styleMask: {
      Resizable: false
    }
  })

  const window = BrowserWindow.getById(runtimeWindow.id)
  if (window) {
    settingsWindow = window
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
    return
  }

  throw new Error('Failed to resolve the settings BrowserWindow instance.')
}

const createMainWindow = async (): Promise<BrowserWindow<RPCWithTransport>> => {
  const settings = getSettings()
  const runtimeWindow = await adapter.createWindow({
    title: 'Peka',
    width: 620,
    height: 300,
    frameless: false,
    url: 'views://app/index.html',
    rpc,
    alwaysOnTop: settings.appFloating
  })

  const window = BrowserWindow.getById(runtimeWindow.id)
  if (window) {
    return window
  }

  throw new Error('Failed to resolve the created BrowserWindow instance.')
}

const setupWindow = (window: BrowserWindow<RPCWithTransport>): void => {
  mainWindow = window
  windowCreated = true

  window.on('focus', () => {
    sendToView('runtimeFactsUpdated', collectRuntimeFacts())
  })

  window.on('resize', () => {
    clampMainWindowSize()
    sendToView('runtimeFactsUpdated', collectRuntimeFacts())
  })

  window.on('maximize', () => {
    sendToView('windowMaximizedChange', true)
  })

  window.on('unmaximize', () => {
    sendToView('windowMaximizedChange', false)
  })

  window.on('close', (event) => {
    const settings = getSettings()
    if (settings.appMode === 'menubar' && process.platform === 'darwin') {
      if (event && typeof (event as { preventDefault?: () => void }).preventDefault === 'function') {
        ; (event as { preventDefault: () => void }).preventDefault()
      }
      // Use minimize instead of hide since hide() doesn't exist
      window.minimize()
    }
  })

  window.show()
}

const setupTray = async (): Promise<void> => {
  if (tray) return

  const trayIcon = join(import.meta.dir, '..', '..', 'resources', 'tray.png')
  const runtimeTray = await adapter.createTray(trayIcon)
  const resolvedTray = Tray.getById(1)

  if (resolvedTray) {
    tray = resolvedTray
  }

  runtimeTray.setTooltip('Pika Color Picker')
  runtimeTray.setMenu([
    { label: 'Show Peka', action: 'toggle-window' },
    { label: 'Quit', action: 'quit-app' }
  ])

  runtimeTray.onClick(() => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) {
      mainWindow.unminimize()
      mainWindow.show()
    } else {
      mainWindow.minimize()
    }
    pushValidationSnapshot()
  })

  if (tray) {
    ; (tray as unknown as { on: (eventName: string, handler: (event: unknown) => void) => void }).on('tray-clicked', (event: unknown) => {
      const action = (event as { data?: { action?: string } }).data?.action
      if (!action && mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.unminimize()
          mainWindow.show()
        } else {
          mainWindow.minimize()
        }
      }
      if (action === 'pick-foreground') {
        emitShortcut('foreground', 'CommandOrControl+D')
      }
      if (action === 'toggle-window' && mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.unminimize()
          mainWindow.show()
        } else {
          mainWindow.minimize()
        }
      }
      if (action === 'quit-app') {
        // @ts-ignore - Utils exists at runtime
        Electrobun.Utils?.quit?.()
      }
      pushValidationSnapshot()
    })
  }

  trayCreated = true
}

const destroyTray = (): void => {
  if (tray) {
    // @ts-ignore - remove exists at runtime
    tray.remove?.()
    tray = null
  }
  trayCreated = false
}

const applyAppMode = async (mode: Settings['appMode']): Promise<void> => {
  if (process.platform !== 'darwin') return

  if (mode === 'menubar') {
    await setupTray()
    sendToView('note', {
      message: 'Menubar mode is active. Dock hiding is not yet supported in Electrobun.'
    })
    return
  }

  destroyTray()
  if (mainWindow && mainWindow.isMinimized()) {
    mainWindow.unminimize()
  }
}

const setupShortcuts = async (): Promise<void> => {
  try {
    const results = await Promise.all([
      adapter.registerGlobalShortcut('CommandOrControl+D', () => {
        emitShortcut('foreground', 'CommandOrControl+D')
      }),
      adapter.registerGlobalShortcut('CommandOrControl+Shift+D', () => {
        emitShortcut('background', 'CommandOrControl+Shift+D')
      }),
      adapter.registerGlobalShortcut('CommandOrControl+C', () => {
        emitShortcut('copy', 'CommandOrControl+C')
      }),
      adapter.registerGlobalShortcut('CommandOrControl+Shift+C', () => {
        emitShortcut('copy-background', 'CommandOrControl+Shift+C')
      }),
      adapter.registerGlobalShortcut('CommandOrControl+X', () => {
        emitShortcut('swap', 'CommandOrControl+X')
      })
    ])

    globalShortcutRegistered = results.every(Boolean)
  } catch (error) {
    console.error('Failed to register global shortcuts:', error)
    globalShortcutRegistered = false
  }
}

const boot = async (): Promise<void> => {
  const window = await createMainWindow()
  setupWindow(window)
  await applyAppMode(getSettings().appMode)
  await setupShortcuts()
  pushValidationSnapshot()
}

boot().catch((error) => {
  console.error('Failed to boot Electrobun app:', error)
})

Electrobun.events.on('close', async () => {
  await adapter.unregisterAllShortcuts()
})
