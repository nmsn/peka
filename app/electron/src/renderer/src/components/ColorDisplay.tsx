import { useCallback, useEffect, useState } from 'react'
import { ArrowRightLeft, Check, Copy, Palette, Pipette } from 'lucide-react'
import { colornames } from 'color-name-list'
import { useColorStore } from '../stores/colorStore'

declare global {
  interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>
  }
  interface Window {
    EyeDropper: new () => EyeDropper
  }
}

interface ColorNameItem {
  name: string
  hex: string
}

const COLOR_NAMES = colornames as ColorNameItem[]
const COLOR_NAME_CACHE = new Map<string, string>()

const normalizeHex = (hex: string): string | null => {
  const raw = hex.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  if (raw.length === 3) {
    return raw
      .split('')
      .map((c) => `${c}${c}`)
      .join('')
      .toUpperCase()
  }
  return raw.toUpperCase()
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => ({
  r: Number.parseInt(hex.slice(0, 2), 16),
  g: Number.parseInt(hex.slice(2, 4), 16),
  b: Number.parseInt(hex.slice(4, 6), 16)
})

const getClosestColorName = (hex: string): string => {
  const normalizedHex = normalizeHex(hex)
  if (!normalizedHex) return 'Unknown'

  const cached = COLOR_NAME_CACHE.get(normalizedHex)
  if (cached) return cached

  const target = hexToRgb(normalizedHex)
  let closest = 'Unknown'
  let minDistance = Number.POSITIVE_INFINITY

  for (const item of COLOR_NAMES) {
    const listHex = normalizeHex(item.hex)
    if (!listHex) continue
    const rgb = hexToRgb(listHex)
    const distance =
      (target.r - rgb.r) ** 2 + (target.g - rgb.g) ** 2 + (target.b - rgb.b) ** 2

    if (distance < minDistance) {
      minDistance = distance
      closest = item.name
      if (distance === 0) break
    }
  }

  COLOR_NAME_CACHE.set(normalizedHex, closest)
  return closest
}

const normalizeDisplayValue = (value: string, format: string): string => {
  if (format === 'oklch') {
    return value
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return value.replace(/\s+/g, '')
}

export function ColorDisplay(): React.ReactNode {
  const {
    foreground,
    background,
    colorFormat,
    hideColorName,
    setForeground,
    setBackground,
    swapColors
  } = useColorStore()

  const [formattedForeground, setFormattedForeground] = useState('')
  const [formattedBackground, setFormattedBackground] = useState('')
  const [foregroundName, setForegroundName] = useState('Unknown')
  const [backgroundName, setBackgroundName] = useState('Unknown')
  const [copied, setCopied] = useState<'foreground' | 'background' | null>(null)
  const [isPicking, setIsPicking] = useState<'foreground' | 'background' | null>(null)

  useEffect(() => {
    const updateFormats = async (): Promise<void> => {
      const fg = await window.api.formatColor(foreground, colorFormat)
      const bg = await window.api.formatColor(background, colorFormat)
      setFormattedForeground(normalizeDisplayValue(fg, colorFormat))
      setFormattedBackground(normalizeDisplayValue(bg, colorFormat))
      setForegroundName(getClosestColorName(foreground))
      setBackgroundName(getClosestColorName(background))
    }
    updateFormats()
  }, [foreground, background, colorFormat])

  const getReadableTextColor = (hex: string): string => {
    const raw = hex.replace('#', '')
    const fullHex =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => `${c}${c}`)
            .join('')
        : raw
    const r = Number.parseInt(fullHex.slice(0, 2), 16)
    const g = Number.parseInt(fullHex.slice(2, 4), 16)
    const b = Number.parseInt(fullHex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.62 ? '#111111' : '#ffffff'
  }

  const handleCopy = useCallback(
    async (target: 'foreground' | 'background'): Promise<void> => {
      const color = target === 'foreground' ? foreground : background
      const formatted = await window.api.formatColor(color, colorFormat)
      await window.api.copyToClipboard(formatted)
      setCopied(target)
      setTimeout(() => setCopied(null), 1500)
    },
    [foreground, background, colorFormat]
  )

  const handlePickColor = useCallback(
    async (target: 'foreground' | 'background'): Promise<void> => {
      if (!window.EyeDropper) {
        console.error('EyeDropper API not supported')
        return
      }

      setIsPicking(target)
      try {
        const eyeDropper = new window.EyeDropper()
        const result = await eyeDropper.open()
        const color = result.sRGBHex

        if (color) {
          if (target === 'foreground') {
            setForeground(color)
            await window.api.setForegroundColor(color)
          } else {
            setBackground(color)
            await window.api.setBackgroundColor(color)
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to pick color:', error)
        }
      } finally {
        setIsPicking(null)
      }
    },
    [setForeground, setBackground]
  )

  const handlePickColorInput = useCallback(
    (target: 'foreground' | 'background'): void => {
      const input = document.createElement('input')
      input.type = 'color'
      input.value = target === 'foreground' ? foreground : background
      input.onchange = async (e): Promise<void> => {
        const color = (e.target as HTMLInputElement).value
        if (target === 'foreground') {
          setForeground(color)
          await window.api.setForegroundColor(color)
        } else {
          setBackground(color)
          await window.api.setBackgroundColor(color)
        }
      }
      input.click()
    },
    [foreground, background, setForeground, setBackground]
  )

  return (
    <div className="color-display">
      <div className="color-pair-row">
        <div
          className="color-section color-tile"
          style={{ backgroundColor: foreground, color: getReadableTextColor(foreground) }}
          onClick={() => void handlePickColor('foreground')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              void handlePickColor('foreground')
            }
          }}
        >
          <div className="color-tile-overlay">
            <div className="color-header">
              <span className="color-label">Foreground</span>
              <div className="color-actions">
                <button
                  className={`pick-btn hover-reveal ${isPicking === 'foreground' ? 'picking' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    void handlePickColor('foreground')
                  }}
                  title="Pick color (⌘D)"
                  aria-label="Pick foreground color"
                >
                  <Pipette className="icon-lucide" />
                </button>
                <button
                  className="color-input-btn hover-reveal"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePickColorInput('foreground')
                  }}
                  title="Color picker"
                  aria-label="Open foreground color picker"
                >
                  <Palette className="icon-lucide" />
                </button>
              </div>
            </div>
            <div className="color-info">
              <div className="color-meta">
                <span className="color-value">{formattedForeground || foreground}</span>
                {!hideColorName && <span className="color-name">{foregroundName}</span>}
              </div>
              <button
                className={`copy-btn hover-reveal ${copied === 'foreground' ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleCopy('foreground')
                }}
                title="Copy (⌘C)"
                aria-label="Copy foreground color"
              >
                {copied === 'foreground' ? (
                  <Check className="icon-lucide" />
                ) : (
                  <Copy className="icon-lucide" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className="color-section color-tile"
          style={{ backgroundColor: background, color: getReadableTextColor(background) }}
          onClick={() => void handlePickColor('background')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              void handlePickColor('background')
            }
          }}
        >
          <div className="color-tile-overlay">
            <div className="color-header">
              <span className="color-label">Background</span>
              <div className="color-actions">
                <button
                  className={`pick-btn hover-reveal ${isPicking === 'background' ? 'picking' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    void handlePickColor('background')
                  }}
                  title="Pick color (⌘⇧D)"
                  aria-label="Pick background color"
                >
                  <Pipette className="icon-lucide" />
                </button>
                <button
                  className="color-input-btn hover-reveal"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePickColorInput('background')
                  }}
                  title="Color picker"
                  aria-label="Open background color picker"
                >
                  <Palette className="icon-lucide" />
                </button>
              </div>
            </div>
            <div className="color-info">
              <div className="color-meta">
                <span className="color-value">{formattedBackground || background}</span>
                {!hideColorName && <span className="color-name">{backgroundName}</span>}
              </div>
              <button
                className={`copy-btn hover-reveal ${copied === 'background' ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleCopy('background')
                }}
                title="Copy (⌘⇧C)"
                aria-label="Copy background color"
              >
                {copied === 'background' ? (
                  <Check className="icon-lucide" />
                ) : (
                  <Copy className="icon-lucide" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button className="swap-btn" onClick={swapColors} title="Swap colors (⌘X)" aria-label="Swap colors">
          <ArrowRightLeft className="icon-lucide" />
        </button>
      </div>
    </div>
  )
}
