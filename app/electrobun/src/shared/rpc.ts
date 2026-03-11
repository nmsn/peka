import type { ElectrobunRPCSchema, RPCSchema, RPCWithTransport } from 'electrobun/bun'

import type { ColorPickResult, RuntimeFacts, ValidationTarget, WindowCommand } from './contracts'
import type { Settings, ColorFormat, CopyFormat, ColorValue, ContrastResult, APCAResult, AppInfo } from './types'

export type PekaRPCSchema = RPCWithTransport & ElectrobunRPCSchema & {
  bun: RPCSchema<{
    requests: {
      getValidationTargets: { params: undefined; response: ValidationTarget[] }
      getRuntimeFacts: { params: undefined; response: RuntimeFacts }
      sendWindowCommand: { params: { command: WindowCommand }; response: boolean }
      requestColorPick: {
        params: { kind: 'foreground' | 'background' }
        response: string | null
      }
      getSettings: { params: undefined; response: Settings }
      setSetting: { params: { key: string; value: unknown }; response: boolean }
      setForegroundColor: { params: { color: string }; response: boolean }
      setBackgroundColor: { params: { color: string }; response: boolean }
      formatColor: { params: { hex: string; format: ColorFormat }; response: string }
      formatForCopy: { params: { hex: string; style: CopyFormat }; response: string }
      getColorName: { params: { hex: string }; response: string | null }
      parseColor: { params: { input: string }; response: string | null }
      getColorValue: { params: { hex: string }; response: ColorValue }
      getWcagContrast: { params: { foreground: string; background: string }; response: ContrastResult }
      getApcbContrast: { params: { foreground: string; background: string }; response: APCAResult }
      copyToClipboard: { params: { text: string }; response: boolean }
      captureScreen: { params: undefined; response: string | null }
      getCursorPosition: { params: undefined; response: { x: number; y: number } }
      getScreenSize: { params: undefined; response: { width: number; height: number } }
      isWindowMaximized: { params: undefined; response: boolean }
      showWindow: { params: undefined; response: boolean }
      hideWindow: { params: undefined; response: boolean }
      getAppInfo: { params: undefined; response: AppInfo }
      checkForUpdates: { params: undefined; response: boolean }
      quitApp: { params: undefined; response: boolean }
      openSettingsWindow: { params: undefined; response: boolean }
    }
    messages: {
      rendererReady: { userAgent: string }
      log: { message: string }
    }
  }>
  webview: RPCSchema<{
    requests: {}
    messages: {
      validationSnapshot: { targets: ValidationTarget[]; runtime: RuntimeFacts }
      runtimeFactsUpdated: RuntimeFacts
      shortcutTriggered: {
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
      }
      colorPickResult: { kind: 'foreground' | 'background'; result: string | null }
      note: { message: string }
      settingsChanged: Settings
      windowMaximizedChange: boolean
    }
  }>
}
