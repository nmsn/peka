import { useEffect, useCallback, useRef } from 'react'
import { useColorStore } from '../../shared/colorStore'
import { ColorDisplay } from './components/ColorDisplay'
import { AccessibilityPanel } from './components/AccessibilityPanel'
import { TitleBar } from './components/TitleBar'
import { AboutModal } from './components/AboutModal'
import i18n from '../../shared/i18n'

import type { ReactNode } from 'react'

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
    hidePekaWhilePicking,
    language,
    foreground,
    background,
    colorFormat
  } = useColorStore()

  const hidePekaWhilePickingRef = useRef(hidePekaWhilePicking)
  hidePekaWhilePickingRef.current = hidePekaWhilePicking

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  const pickColor = useCallback(
    async (target: 'foreground' | 'background'): Promise<void> => {
      setPickerActive(true, target)

      if (hidePekaWhilePickingRef.current) {
        await window.api.hideWindow()
        // Wait for macOS to complete window minimization and focus change
        // before launching the Swift color picker helper
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      try {
        const result = await window.api.pickColor(target)
        const color = result ?? null

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

    const handleCopy = async (target: 'foreground' | 'background'): Promise<void> => {
      const color = target === 'foreground' ? foreground : background
      const formatted = await window.api.formatColor(color, colorFormat)
      await window.api.copyToClipboard(formatted)
    }

    window.api.onCopy(() => {
      void handleCopy('foreground')
    })

    window.api.onCopyBackground(() => {
      void handleCopy('background')
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

    window.api.onSettingsChanged((settings) => {
      loadSettings(settings)
    })

    const handleShowAbout = (): void => {
      setShowAbout(true)
    }

    window.addEventListener('peka-show-about', handleShowAbout)
    return () => {
      window.removeEventListener('peka-show-about', handleShowAbout)
    }
  }, [
    loadSettings,
    undo,
    redo,
    swapColors,
    setColorFormat,
    pickColor,
    handleOpenSettings,
    setShowAbout,
    foreground,
    background,
    colorFormat
  ])

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
