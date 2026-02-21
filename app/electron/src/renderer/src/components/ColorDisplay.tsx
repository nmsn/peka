import { useCallback, useEffect, useState } from 'react'
import { useColorStore } from '../stores/colorStore'
import type { ColorFormat, CopyFormat } from '../types'

declare global {
  interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>
  }
  interface Window {
    EyeDropper: new () => EyeDropper
  }
}

const COLOR_FORMATS: { value: ColorFormat; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsb', label: 'HSB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'lab', label: 'LAB' },
  { value: 'opengl', label: 'OpenGL' }
]

const COPY_FORMATS: { value: CopyFormat; label: string }[] = [
  { value: 'css', label: 'CSS' },
  { value: 'design', label: 'Design' },
  { value: 'swiftui', label: 'SwiftUI' },
  { value: 'unformatted', label: 'Unformatted' }
]

export function ColorDisplay(): React.ReactNode {
  const {
    foreground,
    background,
    colorFormat,
    copyFormat,
    setForeground,
    setBackground,
    swapColors,
    setColorFormat,
    setCopyFormat
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
      <div className="color-section">
        <div className="color-header">
          <span className="color-label">Foreground</span>
          <div className="color-actions">
            <button
              className={`pick-btn ${isPicking === 'foreground' ? 'picking' : ''}`}
              onClick={() => handlePickColor('foreground')}
              title="Pick color (⌘D)"
            >
              🎨
            </button>
            <button
              className="color-input-btn"
              onClick={() => handlePickColorInput('foreground')}
              title="Color picker"
            >
              📱
            </button>
          </div>
        </div>
        <div
          className="color-preview"
          style={{ backgroundColor: foreground }}
          onClick={() => handlePickColorInput('foreground')}
        />
        <div className="color-info">
          <span className="color-value">{formattedForeground || foreground}</span>
          <button
            className={`copy-btn ${copied === 'foreground' ? 'copied' : ''}`}
            onClick={() => handleCopy('foreground')}
            title="Copy (⌘C)"
          >
            {copied === 'foreground' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="color-section">
        <div className="color-header">
          <span className="color-label">Background</span>
          <div className="color-actions">
            <button
              className={`pick-btn ${isPicking === 'background' ? 'picking' : ''}`}
              onClick={() => handlePickColor('background')}
              title="Pick color (⌘⇧D)"
            >
              🎨
            </button>
            <button
              className="color-input-btn"
              onClick={() => handlePickColorInput('background')}
              title="Color picker"
            >
              📱
            </button>
          </div>
        </div>
        <div
          className="color-preview"
          style={{ backgroundColor: background }}
          onClick={() => handlePickColorInput('background')}
        />
        <div className="color-info">
          <span className="color-value">{formattedBackground || background}</span>
          <button
            className={`copy-btn ${copied === 'background' ? 'copied' : ''}`}
            onClick={() => handleCopy('background')}
            title="Copy (⌘⇧C)"
          >
            {copied === 'background' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <button className="swap-btn" onClick={swapColors} title="Swap colors (⌘X)">
        ⇄
      </button>

      <div className="format-selector">
        <span className="format-label">Format:</span>
        <select
          value={colorFormat}
          onChange={(e) => setColorFormat(e.target.value as ColorFormat)}
        >
          {COLOR_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="format-selector">
        <span className="format-label">Copy:</span>
        <select
          value={copyFormat}
          onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
        >
          {COPY_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
