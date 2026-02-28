import { useCallback, useEffect, useState, useRef } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useColorStore } from '../stores/colorStore'
import { ColorTile } from './ColorTile'
import { getClosestColorName, normalizeDisplayValue } from '../utils/colorUtils'

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
    hideColorName,
    hidePekaWhilePicking,
    setForeground,
    setBackground,
    swapColors
  } = useColorStore()

  const hidePekaWhilePickingRef = useRef(hidePekaWhilePicking)
  hidePekaWhilePickingRef.current = hidePekaWhilePicking

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

      if (hidePekaWhilePickingRef.current) {
        await window.api.hideWindow()
      }

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
        if (hidePekaWhilePickingRef.current) {
          await window.api.showWindow()
        }
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
        <ColorTile
          label="Foreground"
          color={foreground}
          formattedColor={formattedForeground}
          colorName={foregroundName}
          colorFormat={colorFormat}
          pickShortcut="⌘D"
          copyShortcut="⌘C"
          isPicking={isPicking === 'foreground'}
          copied={copied === 'foreground'}
          hideColorName={hideColorName}
          onPick={() => void handlePickColor('foreground')}
          onCopy={() => void handleCopy('foreground')}
          onPickInput={() => handlePickColorInput('foreground')}
        />

        <ColorTile
          label="Background"
          color={background}
          formattedColor={formattedBackground}
          colorName={backgroundName}
          colorFormat={colorFormat}
          pickShortcut="⌘⇧D"
          copyShortcut="⌘⇧C"
          isPicking={isPicking === 'background'}
          copied={copied === 'background'}
          hideColorName={hideColorName}
          onPick={() => void handlePickColor('background')}
          onCopy={() => void handleCopy('background')}
          onPickInput={() => handlePickColorInput('background')}
        />

        <button
          className="swap-btn"
          onClick={swapColors}
          title="Swap colors (⌘X)"
          aria-label="Swap colors"
        >
          <ArrowRightLeft className="icon-lucide" />
        </button>
      </div>
    </div>
  )
}
