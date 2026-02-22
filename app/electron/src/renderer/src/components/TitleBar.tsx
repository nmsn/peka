import { useColorStore } from '../stores/colorStore'
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
        <button
          className="titlebar-settings-icon"
          onClick={onOpenSettings}
          title="Settings (⌘,)"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>
    </header>
  )
}
