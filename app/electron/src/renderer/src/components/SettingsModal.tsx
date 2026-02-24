import { useState, useEffect } from 'react'
import { Monitor, Moon, Sun, Keyboard, X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

interface AppSettings {
  launchAtLogin: boolean
  hideMenuBarIcon: boolean
  hidePekaWhilePicking: boolean
  hideColorName: boolean
  appMode: 'menubar' | 'dock' | 'regular'
  globalShortcut: string
}

export function SettingsModal({ open, onClose }: SettingsModalProps): React.ReactNode {
  const [settings, setSettings] = useState<AppSettings>({
    launchAtLogin: false,
    hideMenuBarIcon: false,
    hidePekaWhilePicking: false,
    hideColorName: false,
    appMode: 'menubar',
    globalShortcut: 'CmdOrCtrl+Shift+P'
  })

  useEffect(() => {
    if (!open) return

    const loadSettings = async (): Promise<void> => {
      try {
        const stored = await window.api.getSettings()
        setSettings({
          launchAtLogin: (stored as Record<string, unknown>).launchAtLogin as boolean ?? false,
          hideMenuBarIcon: (stored as Record<string, unknown>).hideMenuBarIcon as boolean ?? false,
          hidePekaWhilePicking: stored.hidePikaWhilePicking ?? false,
          hideColorName: (stored as Record<string, unknown>).hideColorName as boolean ?? false,
          appMode: (stored as Record<string, unknown>).appMode as 'menubar' | 'dock' | 'regular' ?? 'menubar',
          globalShortcut: (stored as Record<string, unknown>).globalShortcut as string ?? 'CmdOrCtrl+Shift+P'
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    void loadSettings()
  }, [open])

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    await window.api.setSetting(key, value)
  }

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="button"
      tabIndex={-1}
      aria-label="Close settings"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <h2>设置</h2>
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close settings">
            <X className="icon-lucide" />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>常规设置</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.launchAtLogin}
                onChange={(e) => void updateSetting('launchAtLogin', e.target.checked)}
              />
              <span>登录时启动</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.hideMenuBarIcon}
                onChange={(e) => void updateSetting('hideMenuBarIcon', e.target.checked)}
              />
              <span>隐藏菜单栏图标</span>
            </label>
          </section>

          <section className="settings-section">
            <h3>选择设置</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.hidePekaWhilePicking}
                onChange={(e) => void updateSetting('hidePekaWhilePicking', e.target.checked)}
              />
              <span>选择颜色时隐藏 Peka</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.hideColorName}
                onChange={(e) => void updateSetting('hideColorName', e.target.checked)}
              />
              <span>隐藏颜色名称</span>
            </label>
          </section>

          <section className="settings-section">
            <h3>应用设置</h3>
            <div className="settings-radio-group">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="appMode"
                  value="menubar"
                  checked={settings.appMode === 'menubar'}
                  onChange={() => void updateSetting('appMode', 'menubar')}
                />
                <Moon className="icon-lucide" />
                <span>在菜单栏显示</span>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="appMode"
                  value="dock"
                  checked={settings.appMode === 'dock'}
                  onChange={() => void updateSetting('appMode', 'dock')}
                />
                <Monitor className="icon-lucide" />
                <span>在 Dock 栏显示</span>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="appMode"
                  value="regular"
                  checked={settings.appMode === 'regular'}
                  onChange={() => void updateSetting('appMode', 'regular')}
                />
                <Sun className="icon-lucide" />
                <span>常规窗口</span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h3>全局快捷键</h3>
            <div className="settings-shortcut">
              <Keyboard className="icon-lucide" />
              <span className="shortcut-key">{settings.globalShortcut}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
