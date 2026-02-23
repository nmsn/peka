import { useEffect, useRef, useState } from 'react'
import { useColorStore } from '../stores/colorStore'
import { Check, ChevronRight, ClipboardCopy, Info, LogOut, RefreshCcw, Settings } from 'lucide-react'
import type { ColorFormat } from '../types'

interface TitleBarProps {
  onOpenSettings: () => void
}

const TITLEBAR_FORMATS: { value: ColorFormat; label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsb', label: 'HSB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'lab', label: 'LAB' },
  { value: 'oklch', label: 'OKLCH' }
]

export function TitleBar({ onOpenSettings }: TitleBarProps): React.ReactNode {
  const {
    colorFormat,
    visibleColorFormats,
    foreground,
    background,
    setColorFormat,
    toggleVisibleColorFormat
  } = useColorStore()
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

  return (
    <header className="titlebar">
      <div className="titlebar-drag" />
      <div className="titlebar-actions">
        <div className="titlebar-format-tabs" aria-label="Color format">
          {TITLEBAR_FORMATS.filter((format) => visibleColorFormats.includes(format.value)).map((format) => (
            <button
              key={format.value}
              type="button"
              className={`titlebar-format-tab ${colorFormat === format.value ? 'active' : ''}`}
              onClick={() => setColorFormat(format.value)}
              title={`Switch format to ${format.label}`}
              aria-label={`Switch format to ${format.label}`}
            >
              {format.label}
            </button>
          ))}
        </div>
        <div className="settings-menu" ref={menuRef}>
          <button
            className="titlebar-settings-icon"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Open menu"
            aria-label="Open menu"
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
                  className={`settings-item ${isFormatMenuOpen ? 'active' : ''}`}
                  role="menuitem"
                  onClick={() => setIsFormatMenuOpen((prev) => !prev)}
                >
                  <span>颜色类型</span>
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
                          <span className="settings-check">{checked ? <Check className="icon-lucide" /> : null}</span>
                          <span>{format.label}</span>
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
                <span>设置</span>
              </button>
              <button
                type="button"
                className="settings-item"
                role="menuitem"
                onClick={async () => {
                  await window.api.showAbout()
                  setIsMenuOpen(false)
                }}
              >
                <Info className="icon-lucide" />
                <span>关于</span>
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
                <span>检查更新</span>
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
                <span>复制全部为 JSON</span>
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
                <span>退出</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
