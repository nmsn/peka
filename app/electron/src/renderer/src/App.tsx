import { useEffect, useCallback } from 'react'
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
    setShowPreferences,
    showAbout,
    setShowAbout,
    setForeground,
    setBackground,
    setPickerActive
  } = useColorStore()

  const pickColor = useCallback(async (target: 'foreground' | 'background'): Promise<void> => {
    if (!window.EyeDropper) {
      console.error('EyeDropper API not supported')
      return
    }

    setPickerActive(true, target)
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
    }
  }, [setForeground, setBackground, setPickerActive])

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
      setShowPreferences(true)
    })
  }, [loadSettings, undo, redo, swapColors, setColorFormat, setShowPreferences, pickColor])

  return (
    <div className="app">
      <TitleBar
        onOpenSettings={() => setShowPreferences(true)}
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
