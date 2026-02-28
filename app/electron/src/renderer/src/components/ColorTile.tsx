import { Check, Copy, Palette, Pipette } from 'lucide-react'
import { getReadableTextColor } from '../utils/colorUtils'

interface ColorTileProps {
  label: string
  color: string
  formattedColor: string
  colorName: string
  colorFormat: string
  pickShortcut: string
  copyShortcut: string
  isPicking: boolean
  copied: boolean
  hideColorName: boolean
  onPick: () => void
  onCopy: () => void
  onPickInput: () => void
}

export function ColorTile({
  label,
  color,
  formattedColor,
  colorName,
  colorFormat,
  pickShortcut,
  copyShortcut,
  isPicking,
  copied,
  hideColorName,
  onPick,
  onCopy,
  onPickInput
}: ColorTileProps): React.ReactNode {
  return (
    <div
      className="color-section color-tile"
      style={{ backgroundColor: color, color: getReadableTextColor(color) }}
      onClick={() => onPick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPick()
        }
      }}
    >
      <div className="color-tile-overlay">
        <div className="color-header">
          <span className="color-label">{label}</span>
          <div className="color-actions">
            <button
              className={`pick-btn hover-reveal ${isPicking ? 'picking' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onPick()
              }}
              title={`Pick color (${pickShortcut})`}
              aria-label={`Pick ${label.toLowerCase()} color`}
            >
              <Pipette className="icon-lucide" />
            </button>
            <button
              className="color-input-btn hover-reveal"
              onClick={(e) => {
                e.stopPropagation()
                onPickInput()
              }}
              title="Color picker"
              aria-label={`Open ${label.toLowerCase()} color picker`}
            >
              <Palette className="icon-lucide" />
            </button>
          </div>
        </div>
        <div className="color-info">
          <div className="color-meta">
            <span className="color-value">{formattedColor || color}</span>
            {!hideColorName && (
              <span className={`color-name ${colorFormat === 'oklch' ? 'oklch' : ''}`}>
                {colorName}
              </span>
            )}
          </div>
          <button
            className={`copy-btn hover-reveal ${copied ? 'copied' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onCopy()
            }}
            title={`Copy (${copyShortcut})`}
            aria-label={`Copy ${label.toLowerCase()} color`}
          >
            {copied ? <Check className="icon-lucide" /> : <Copy className="icon-lucide" />}
          </button>
        </div>
      </div>
    </div>
  )
}
