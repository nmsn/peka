import { useColorStore } from '../../../shared/colorStore'
import { SettingsMenu } from './SettingsMenu'
import type { ColorFormat } from '../../../shared/types'

interface TitleBarProps {
  onOpenSettings: () => void
  onOpenAbout: () => void
}

const TITLEBAR_FORMATS: { value: ColorFormat; label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsb', label: 'HSB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'lab', label: 'LAB' },
  { value: 'oklch', label: 'OKLCH' }
]

export function TitleBar({ onOpenSettings, onOpenAbout }: TitleBarProps): React.ReactNode {
  const { colorFormat, visibleColorFormats, setColorFormat } = useColorStore()
  const isMac = navigator.platform.toLowerCase().includes('mac')

  return (
    <header className="titlebar electrobun-webkit-app-region-drag">
      <div className="titlebar-drag" />
      <div className="titlebar-actions electrobun-webkit-app-region-no-drag">
        <div className="titlebar-format-tabs" aria-label="Color format">
          {TITLEBAR_FORMATS.filter((format) => visibleColorFormats.includes(format.value)).map(
            (format) => (
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
            )
          )}
        </div>
        <SettingsMenu onOpenSettings={onOpenSettings} onOpenAbout={onOpenAbout} />
      </div>
    </header>
  )
}
