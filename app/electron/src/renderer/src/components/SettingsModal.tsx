import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useColorStore } from '../stores/colorStore'
import { supportedLanguages, type LanguageCode } from '../i18n'
import i18n from '../i18n'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps): React.ReactNode {
  const { t } = useTranslation()
  const {
    launchAtLogin,
    hidePekaWhilePicking,
    hideColorName,
    appMode,
    language,
    setLaunchAtLogin,
    setHidePekaWhilePicking,
    setHideColorName,
    setAppMode,
    setLanguage
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
        const storedLang = (stored as { language?: LanguageCode }).language ?? 'en'
        setLanguage(storedLang)
        i18n.changeLanguage(storedLang)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    void loadSettings()
  }, [open, setLaunchAtLogin, setHidePekaWhilePicking, setHideColorName, setAppMode, setLanguage])

  const updateSetting = async (key: string, value: unknown): Promise<void> => {
    if (key === 'launchAtLogin') {
      setLaunchAtLogin(Boolean(value))
    } else if (key === 'hidePekaWhilePicking') {
      setHidePekaWhilePicking(Boolean(value))
    } else if (key === 'hideColorName') {
      setHideColorName(Boolean(value))
    } else if (key === 'appMode') {
      setAppMode(value as 'menubar' | 'dock')
    } else if (key === 'language') {
      const lang = value as LanguageCode
      setLanguage(lang)
      i18n.changeLanguage(lang)
    }
    await window.api.setSetting(key, value)
  }

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="button"
      tabIndex={-1}
      aria-label={t('settings.close')}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            <X className="icon-lucide" />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>{t('settings.general')}</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={launchAtLogin}
                onChange={(e) => void updateSetting('launchAtLogin', e.target.checked)}
              />
              <span>{t('settings.launchAtLogin')}</span>
            </label>
            <div className="settings-language">
              <label className="settings-label">{t('settings.language')}</label>
              <div className="language-buttons">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`language-btn ${language === lang.code ? 'active' : ''}`}
                    onClick={() => void updateSetting('language', lang.code)}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t('settings.picker')}</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={hidePekaWhilePicking}
                onChange={(e) => void updateSetting('hidePekaWhilePicking', e.target.checked)}
              />
              <span>{t('settings.hidePekaWhilePicking')}</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={hideColorName}
                onChange={(e) => void updateSetting('hideColorName', e.target.checked)}
              />
              <span>{t('settings.hideColorName')}</span>
            </label>
          </section>

          <section className="settings-section">
            <h3>{t('settings.app')}</h3>
            <div className="settings-radio-group">
              <label className={`settings-radio ${appMode === 'menubar' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="appMode"
                  value="menubar"
                  checked={appMode === 'menubar'}
                  onChange={() => void updateSetting('appMode', 'menubar')}
                />
                <span>{t('settings.showInMenubar')}</span>
              </label>
              <label className={`settings-radio ${appMode === 'dock' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="appMode"
                  value="dock"
                  checked={appMode === 'dock'}
                  onChange={() => void updateSetting('appMode', 'dock')}
                />
                <span>{t('settings.showInDock')}</span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
