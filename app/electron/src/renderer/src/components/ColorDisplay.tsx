import { useCallback, useEffect, useState } from 'react'
import { useColorStore } from '../stores/colorStore'

declare global {
  interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>
  }
  interface Window {
    EyeDropper: new () => EyeDropper
  }
}

export function ColorDisplay(): React.ReactNode {
  const {
    foreground,
    background,
    colorFormat,
    copyFormat,
    setForeground,
    setBackground,
    swapColors
  } = useColorStore()

  const [formattedForeground, setFormattedForeground] = useState('')
  const [formattedBackground, setFormattedBackground] = useState('')
  const [copied, setCopied] = useState<'foreground' | 'background' | null>(null)
  const [isPicking, setIsPicking] = useState<'foreground' | 'background' | null>(null)

  useEffect(() => {
    const updateFormats = async (): Promise<void> => {
      const fg = await window.api.formatColor(foreground, colorFormat)
      const bg = await window.api.formatColor(background, colorFormat)
      setFormattedForeground(fg)
      setFormattedBackground(bg)
    }
    updateFormats()
  }, [foreground, background, colorFormat])

  const handleCopy = useCallback(
    async (target: 'foreground' | 'background'): Promise<void> => {
      const color = target === 'foreground' ? foreground : background
      const formatted = await window.api.formatForCopy(color, copyFormat)
      await window.api.copyToClipboard(formatted)
      setCopied(target)
      setTimeout(() => setCopied(null), 1500)
    },
    [foreground, background, copyFormat]
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
          style={{ backgroundColor: foreground }}
          onClick={() => handlePickColorInput('foreground')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handlePickColorInput('foreground')
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
                  🎨
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
                  📱
                </button>
              </div>
            </div>
            <div className="color-info">
              <span className="color-value">{formattedForeground || foreground}</span>
              <button
                className={`copy-btn hover-reveal ${copied === 'foreground' ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleCopy('foreground')
                }}
                title="Copy (⌘C)"
              >
                {copied === 'foreground' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div
          className="color-section color-tile"
          style={{ backgroundColor: background }}
          onClick={() => handlePickColorInput('background')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handlePickColorInput('background')
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
                  🎨
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
                  📱
                </button>
              </div>
            </div>
            <div className="color-info">
              <span className="color-value">{formattedBackground || background}</span>
              <button
                className={`copy-btn hover-reveal ${copied === 'background' ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleCopy('background')
                }}
                title="Copy (⌘⇧C)"
              >
                {copied === 'background' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="color-meta-row">
        <button className="swap-btn" onClick={swapColors} title="Swap colors (⌘X)">
          ⇄
        </button>
      </div>
    </div>
  )
}
