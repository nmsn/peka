import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const labelKey = label.toLowerCase() as 'foreground' | 'background'

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
          <span className="color-label">{t(`color.${labelKey}`)}</span>
          <div className="color-actions">
            <button
              className={`pick-btn hover-reveal ${isPicking ? 'picking' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onPick()
              }}
              title={`${t('color.pickColor')} (${pickShortcut})`}
              aria-label={t(`color.pick${label === 'Foreground' ? 'Foreground' : 'Background'}`)}
            >
              <Pipette className="icon-lucide" />
            </button>
            <button
              className="color-input-btn hover-reveal"
              onClick={(e) => {
                e.stopPropagation()
                onPickInput()
              }}
              title={t('color.colorPicker')}
              aria-label={t(
                `color.open${label === 'Foreground' ? 'Foreground' : 'Background'}Picker`
              )}
            >
              <Palette className="icon-lucide" />
            </button>
          </div>
        </div>
        <div className="color-info">
          <div className="color-meta">
            <span className={`color-value ${colorFormat === 'oklch' ? 'oklch' : ''}`}>
              {formattedColor || color}
            </span>
            {!hideColorName && <span className="color-name">{colorName}</span>}
          </div>
          <button
            className={`copy-btn hover-reveal ${copied ? 'copied' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onCopy()
            }}
            title={`${t('color.copy')} (${copyShortcut})`}
            aria-label={t(`color.copy${label === 'Foreground' ? 'Foreground' : 'Background'}`)}
          >
            {copied ? <Check className="icon-lucide" /> : <Copy className="icon-lucide" />}
          </button>
        </div>
      </div>
    </div>
  )
}
