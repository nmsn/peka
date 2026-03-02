import { useEffect, useCallback, useRef } from 'react'
import { useColorStore } from './stores/colorStore'
import { ColorDisplay } from './components/ColorDisplay'
import { AccessibilityPanel } from './components/AccessibilityPanel'
import { TitleBar } from './components/TitleBar'
import { AboutModal } from './components/AboutModal'
import './assets/main.css'

import type { ReactNode } from 'react'

declare global {
  interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>
  }
  interface Window {
    EyeDropper: new () => EyeDropper
  }
}

function App(): ReactNode {
  const {
    loadSettings,
    undo,
    redo,
    swapColors,
    setColorFormat,
    showAbout,
    setShowAbout,
    setForeground,
    setBackground,
    setPickerActive,
    hidePekaWhilePicking
  } = useColorStore()

  const hidePekaWhilePickingRef = useRef(hidePekaWhilePicking)
  hidePekaWhilePickingRef.current = hidePekaWhilePicking

  const pickColor = useCallback(
    async (target: 'foreground' | 'background'): Promise<void> => {
      if (!window.EyeDropper) {
        console.error('EyeDropper API not supported')
        return
      }

      setPickerActive(true, target)

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
        setPickerActive(false)
        if (hidePekaWhilePickingRef.current) {
          await window.api.showWindow()
        }
      }
    },
    [setForeground, setBackground, setPickerActive]
  )

  const handleOpenSettings = useCallback((): void => {
    void window.api.openSettingsWindow()
  }, [])

  useEffect(() => {
    const init = async (): Promise<void> => {
      const settings = await window.api.getSettings()
      loadSettings(settings)
    }
    init()

    window.api.onPickForeground(() => {
      pickColor('foreground')
    })

    window.api.onPickBackground(() => {
      pickColor('background')
    })

    window.api.onFormatChange((format) => {
      setColorFormat(format as Parameters<typeof setColorFormat>[0])
    })

    window.api.onCopy(() => {
      console.log('Copy foreground')
    })

    window.api.onCopyBackground(() => {
      console.log('Copy background')
    })

    window.api.onSwap(() => {
      swapColors()
    })

    window.api.onUndo(() => {
      undo()
    })

    window.api.onRedo(() => {
      redo()
    })

    window.api.onPreferences(() => {
      handleOpenSettings()
    })
  }, [loadSettings, undo, redo, swapColors, setColorFormat, pickColor, handleOpenSettings])

  return (
    <div className="app">
      <TitleBar
        onOpenSettings={handleOpenSettings}
        onOpenAbout={() => setShowAbout(true)}
      />
      <main className="app-main">
        <ColorDisplay />
        <AccessibilityPanel />
      </main>
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  )
}

export default App
