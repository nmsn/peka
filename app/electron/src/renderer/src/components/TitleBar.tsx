import { useEffect, useRef, useState } from 'react'
import { useColorStore } from '../stores/colorStore'
import { Info, Settings, RefreshCcw, LogOut } from 'lucide-react'
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
  { value: 'opengl', label: 'OpenGL' }
]

export function TitleBar({ onOpenSettings }: TitleBarProps): React.ReactNode {
  const { colorFormat, setColorFormat } = useColorStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header className="titlebar">
      <div className="titlebar-drag" />
      <div className="titlebar-actions">
        <div className="titlebar-format-tabs" aria-label="Color format">
          {TITLEBAR_FORMATS.map((format) => (
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
