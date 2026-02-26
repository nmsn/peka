import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useColorStore } from '../stores/colorStore'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps): React.ReactNode {
  const {
    launchAtLogin,
    hidePekaWhilePicking,
    hideColorName,
    appMode,
    setLaunchAtLogin,
    setHidePekaWhilePicking,
    setHideColorName,
    setAppMode
  } = useColorStore()

  useEffect(() => {
    if (!open) return

    const loadSettings = async (): Promise<void> => {
      try {
        const stored = await window.api.getSettings()
        setLaunchAtLogin(stored.launchAtLogin ?? false)
        setHidePekaWhilePicking(stored.hidePekaWhilePicking ?? false)
        setHideColorName(stored.hideColorName ?? false)
        setAppMode(stored.appMode ?? 'menubar')
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    void loadSettings()
  }, [open, setLaunchAtLogin, setHidePekaWhilePicking, setHideColorName, setAppMode])

  const updateSetting = async (key: string, value: unknown): Promise<void> => {
    if (key === 'launchAtLogin') {
      setLaunchAtLogin(Boolean(value))
    } else if (key === 'hidePekaWhilePicking') {
      setHidePekaWhilePicking(Boolean(value))
    } else if (key === 'hideColorName') {
      setHideColorName(Boolean(value))
    } else if (key === 'appMode') {
      setAppMode(value as 'menubar' | 'dock')
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
                checked={launchAtLogin}
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
                checked={hidePekaWhilePicking}
                onChange={(e) => void updateSetting('hidePekaWhilePicking', e.target.checked)}
              />
              <span>选择颜色时隐藏 Peka</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={hideColorName}
                onChange={(e) => void updateSetting('hideColorName', e.target.checked)}
              />
              <span>隐藏颜色名称</span>
            </label>
          </section>

          <section className="settings-section">
            <h3>应用设置</h3>
            <div className="settings-radio-group">
              <label className={`settings-radio ${appMode === 'menubar' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="appMode"
                  value="menubar"
                  checked={appMode === 'menubar'}
                  onChange={() => void updateSetting('appMode', 'menubar')}
                />
                <span>在菜单栏显示</span>
              </label>
              <label className={`settings-radio ${appMode === 'dock' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="appMode"
                  value="dock"
                  checked={appMode === 'dock'}
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
