import { useEffect, useState } from 'react'
import { useColorStore } from '../stores/colorStore'
import type { ContrastResult, APCAResult } from '../types'

import type { ReactNode } from 'react'

export function AccessibilityPanel(): ReactNode {
  const { foreground, background, contrastStandard, contrastResult, setContrastResult, setContrastStandard } =
    useColorStore()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkContrast = async (): Promise<void> => {
      setLoading(true)
      try {
        if (contrastStandard === 'wcag') {
          const result = await window.api.getWcagContrast(foreground, background)
          setContrastResult(result)
        } else {
          const result = await window.api.getApcbContrast(foreground, background)
          setContrastResult(result)
        }
      } catch (error) {
        console.error('Failed to check contrast:', error)
      } finally {
        setLoading(false)
      }
    }

    checkContrast()
  }, [foreground, background, contrastStandard, setContrastResult])

  const renderWCAG = (result: ContrastResult): ReactNode => (
    <div className="wcag-results">
      <div className="contrast-ratio">
        <span className="ratio-value">{result.ratio.toFixed(2)}</span>
        <span className="ratio-label">:1</span>
      </div>
      <div className="wcag-levels">
        <div className={`wcag-item ${result.wcagAALarge ? 'pass' : 'fail'}`}>
          <span className="wcag-badge">AA Large</span>
          <span className="wcag-status">{result.wcagAALarge ? '✓ Pass' : '✗ Fail'}</span>
        </div>
        <div className={`wcag-item ${result.wcagAA ? 'pass' : 'fail'}`}>
          <span className="wcag-badge">AA</span>
          <span className="wcag-status">{result.wcagAA ? '✓ Pass' : '✗ Fail'}</span>
        </div>
        <div className={`wcag-item ${result.wcagAAA ? 'pass' : 'fail'}`}>
          <span className="wcag-badge">AAA</span>
          <span className="wcag-status">{result.wcagAAA ? '✓ Pass' : '✗ Fail'}</span>
        </div>
      </div>
    </div>
  )

  const renderAPCA = (result: APCAResult): ReactNode => (
    <div className="apca-results">
      <div className="contrast-ratio">
        <span className="ratio-value">{result.lc.toFixed(0)}</span>
        <span className="ratio-label">Lc</span>
      </div>
      <div className="apca-levels">
        <div className={`apca-item ${result.level !== 'Fail' ? 'pass' : 'fail'}`}>
          <span className="apca-badge">Level</span>
          <span className="apca-status">{result.level}</span>
        </div>
        <div className="apca-item">
          <span className="apca-badge">Font Size</span>
          <span className="apca-status">{result.fontSize}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="accessibility-panel">
      <div className="panel-header">
        <h3>Contrast</h3>
        <div className="standard-toggle">
          <button
            className={contrastStandard === 'wcag' ? 'active' : ''}
            onClick={(): void => setContrastStandard('wcag')}
          >
            WCAG
          </button>
          <button
            className={contrastStandard === 'apca' ? 'active' : ''}
            onClick={(): void => setContrastStandard('apca')}
          >
            APCA
          </button>
        </div>
      </div>

      <div className="color-preview-bar">
        <div className="preview-sample" style={{ backgroundColor: foreground, color: background }}>
          Aa
        </div>
        <div className="preview-sample" style={{ backgroundColor: background, color: foreground }}>
          Aa
        </div>
      </div>

      {loading ? (
        <div className="loading">Calculating...</div>
      ) : contrastResult ? (
        contrastStandard === 'wcag' ? (
          renderWCAG(contrastResult as ContrastResult)
        ) : (
          renderAPCA(contrastResult as APCAResult)
        )
      ) : (
        <div className="no-result">No result</div>
      )}
    </div>
  )
}
