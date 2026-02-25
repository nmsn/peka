import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useColorStore } from '../stores/colorStore'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

interface AppSettings {
  launchAtLogin: boolean
  hidePekaWhilePicking: boolean
  hideColorName: boolean
  appMode: 'menubar' | 'dock'
}

export function SettingsModal({ open, onClose }: SettingsModalProps): React.ReactNode {
  const [settings, setSettings] = useState<AppSettings>({
    launchAtLogin: false,
    hidePekaWhilePicking: false,
    hideColorName: false,
    appMode: 'menubar'
  })
  const setHideColorName = useColorStore((state) => state.setHideColorName)

  useEffect(() => {
    if (!open) return

    const loadSettings = async (): Promise<void> => {
      try {
        const stored = await window.api.getSettings()
        setSettings({
          launchAtLogin: stored.launchAtLogin ?? false,
          hidePekaWhilePicking: stored.hidePikaWhilePicking ?? false,
          hideColorName: stored.hideColorName ?? false,
          appMode: stored.appMode ?? 'menubar'
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    void loadSettings()
  }, [open])

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    if (key === 'hideColorName') {
      setHideColorName(Boolean(value))
    }
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
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="icon-lucide" />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>通用设置</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.launchAtLogin}
                onChange={(e) => void updateSetting('launchAtLogin', e.target.checked)}
              />
              <span>登录时启动</span>
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
              <label
                className={`settings-radio ${settings.appMode === 'menubar' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="appMode"
                  value="menubar"
                  checked={settings.appMode === 'menubar'}
                  onChange={() => void updateSetting('appMode', 'menubar')}
                />
                <span>在菜单栏显示</span>
              </label>
              <label className={`settings-radio ${settings.appMode === 'dock' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="appMode"
                  value="dock"
                  checked={settings.appMode === 'dock'}
                  onChange={() => void updateSetting('appMode', 'dock')}
                />
                <span>在 Dock 栏显示</span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
