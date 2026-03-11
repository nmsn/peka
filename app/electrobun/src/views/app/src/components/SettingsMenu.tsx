import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorStore } from '../../../shared/colorStore'
import {
  Check,
  ChevronRight,
  ClipboardCopy,
  FileText,
  Info,
  LogOut,
  Palette,
  RefreshCcw,
  Settings
} from 'lucide-react'
import type { ColorFormat } from '../../../shared/types'

const TITLEBAR_FORMATS: { value: ColorFormat; labelKey: string }[] = [
  { value: 'hex', labelKey: 'HEX' },
  { value: 'rgb', labelKey: 'RGB' },
  { value: 'hsb', labelKey: 'HSB' },
  { value: 'hsl', labelKey: 'HSL' },
  { value: 'lab', labelKey: 'LAB' },
  { value: 'oklch', labelKey: 'OKLCH' }
]

interface SettingsMenuProps {
  onOpenSettings: () => void
  onOpenAbout: () => void
}

export function SettingsMenu({ onOpenSettings, onOpenAbout }: SettingsMenuProps): React.ReactNode {
  const { t } = useTranslation()
  const { visibleColorFormats, foreground, background, toggleVisibleColorFormat } = useColorStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
        setIsFormatMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsFormatMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleCopyAllAsJSON = async (): Promise<void> => {
    const entries = await Promise.all(
      visibleColorFormats.map(async (format) => {
        const fg = await window.api.formatColor(foreground, format)
        const bg = await window.api.formatColor(background, format)
        return [format, { foreground: fg, background: bg }] as const
      })
    )

    const payload = Object.fromEntries(entries)
    await window.api.copyToClipboard(JSON.stringify(payload, null, 2))
    setIsMenuOpen(false)
    setIsFormatMenuOpen(false)
  }

  const handleCopyAllAsText = async (): Promise<void> => {
    const entries = await Promise.all(
      visibleColorFormats.map(async (format) => {
        const fg = await window.api.formatColor(foreground, format)
        const bg = await window.api.formatColor(background, format)
        return `${format}\nforeground: ${fg}\nbackground: ${bg}`
      })
    )

    await window.api.copyToClipboard(entries.join('\n\n'))
    setIsMenuOpen(false)
    setIsFormatMenuOpen(false)
  }

  return (
    <div className="settings-menu" ref={menuRef}>
      <button
        className="titlebar-settings-icon"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        title={t('menu.openMenu')}
        aria-label={t('menu.openMenu')}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <Settings className="icon-lucide" />
      </button>
      {isMenuOpen ? (
        <div className="settings-dropdown" role="menu" aria-label="Settings menu">
          <div className="settings-submenu-wrapper">
            <button
              type="button"
              className="settings-item"
              role="menuitem"
              onClick={() => setIsFormatMenuOpen((prev) => !prev)}
            >
              <Palette className="icon-lucide" />
              <span>{t('menu.colorType')}</span>
              <ChevronRight className="icon-lucide settings-chevron" />
            </button>
            {isFormatMenuOpen ? (
              <div className="settings-submenu" role="menu" aria-label="Color formats">
                {TITLEBAR_FORMATS.map((format) => {
                  const checked = visibleColorFormats.includes(format.value)
                  return (
                    <button
                      key={format.value}
                      type="button"
                      className="settings-item"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      onClick={() => toggleVisibleColorFormat(format.value)}
                    >
                      <span className="settings-check">
                        {checked ? <Check className="icon-lucide" /> : null}
                      </span>
                      <span>{format.labelKey}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="settings-item"
            role="menuitem"
            onClick={() => {
              onOpenSettings()
              setIsMenuOpen(false)
            }}
          >
            <Settings className="icon-lucide" />
            <span>{t('menu.settings')}</span>
          </button>
          <button
            type="button"
            className="settings-item"
            role="menuitem"
            onClick={() => {
              onOpenAbout()
              setIsMenuOpen(false)
            }}
          >
            <Info className="icon-lucide" />
            <span>{t('menu.about')}</span>
          </button>
          <button
            type="button"
            className="settings-item"
            role="menuitem"
            onClick={async () => {
              await window.api.checkForUpdates()
              setIsMenuOpen(false)
            }}
          >
            <RefreshCcw className="icon-lucide" />
            <span>{t('menu.checkUpdates')}</span>
          </button>
          <button
            type="button"
            className="settings-item"
            role="menuitem"
            onClick={async () => {
              await handleCopyAllAsJSON()
            }}
          >
            <ClipboardCopy className="icon-lucide" />
            <span>{t('menu.copyAllAsJSON')}</span>
          </button>
          <button
            type="button"
            className="settings-item"
            role="menuitem"
            onClick={async () => {
              await handleCopyAllAsText()
            }}
          >
            <FileText className="icon-lucide" />
            <span>{t('menu.copyAllAsText')}</span>
          </button>
          <button
            type="button"
            className="settings-item danger"
            role="menuitem"
            onClick={async () => {
              await window.api.quitApp()
              setIsMenuOpen(false)
            }}
          >
            <LogOut className="icon-lucide" />
            <span>{t('menu.exit')}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
