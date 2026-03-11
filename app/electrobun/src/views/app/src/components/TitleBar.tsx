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
    <header className="titlebar">
      {isMac ? (
        <div className="titlebar-traffic" aria-label="Window controls">
          <button
            type="button"
            className="traffic-btn traffic-close"
            aria-label="Close window"
            onClick={() => void window.api.closeWindow()}
          />
          <button
            type="button"
            className="traffic-btn traffic-minimize"
            aria-label="Minimize window"
            onClick={() => void window.api.minimizeWindow()}
          />
          <button
            type="button"
            className="traffic-btn traffic-maximize"
            aria-label="Toggle maximize window"
            onClick={() => void window.api.toggleMaximizeWindow()}
          />
        </div>
      ) : null}
      <div className="titlebar-drag" />
      <div className="titlebar-actions">
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
