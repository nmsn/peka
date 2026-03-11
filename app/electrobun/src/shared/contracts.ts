export type ValidationStatus = 'pending' | 'passed' | 'failed'

export type WindowCommand = 'minimize' | 'toggle-maximize' | 'close'

export type AppEventName =
  | 'window:maximized'
  | 'shortcut:pick-foreground'
  | 'shortcut:pick-background'
  | 'color:picked'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ColorPickResult {
  hex: string
  source: 'interactive' | 'pixel-read'
  cursor?: Point
}

export interface RuntimeFacts {
  packageName: string
  packageVersion: string
  verifiedViaPackageInspection: boolean
  verifiedWindowApi: boolean
  verifiedTrayApi: boolean
  verifiedShortcutApi: boolean
  verifiedRpcApi: boolean
  verifiedColorPickApi: boolean
  rendererReady: boolean
  windowCreated: boolean
  trayCreated: boolean
  globalShortcutRegistered: boolean
  eventPushConfirmed: boolean
  requiredTargetIds: string[]
}

export interface ValidationTarget {
  id: string
  title: string
  status: ValidationStatus
  required: boolean
  notes: string[]
}

export interface RendererBridge {
  getValidationTargets(): Promise<ValidationTarget[]>
  sendWindowCommand(command: WindowCommand): Promise<boolean>
  requestColorPick(kind: 'foreground' | 'background'): Promise<ColorPickResult | null>
  onEvent(eventName: AppEventName, callback: (payload: unknown) => void): void
}

export interface RuntimeWindowOptions {
  title: string
  width: number
  height: number
  frameless: boolean
  url: string
  alwaysOnTop?: boolean
  styleMask?: Record<string, boolean>
}

export interface RuntimeWindow {
  id: number
  loadURL(url: string): Promise<void>
  loadFile(filePath: string): Promise<void>
  show(): void
  hide(): void
  minimize(): void
  maximize(): void
  unmaximize(): void
  close(): void
  on(eventName: string, callback: () => void): void
}

export interface RuntimeTray {
  setTooltip(text: string): void
  setMenu(items: Array<{ label: string; action: string }>): void
  onClick(callback: () => void): void
}

export interface ElectrobunRuntimeAdapter {
  createWindow(options: RuntimeWindowOptions & { rpc?: unknown }): Promise<RuntimeWindow>
  createTray(iconPath: string): Promise<RuntimeTray>
  registerGlobalShortcut(accelerator: string, action: () => void): Promise<boolean>
  unregisterAllShortcuts(): Promise<void>
  pickColor(kind: 'foreground' | 'background'): Promise<ColorPickResult | null>
}
