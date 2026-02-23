import { useEffect, useState } from 'react'
import { useColorStore } from '../stores/colorStore'
import type { ContrastResult, APCAResult } from '../types'

import type { ReactNode } from 'react'

const isWCAGResult = (value: unknown): value is ContrastResult => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ContrastResult>
  return (
    typeof candidate.ratio === 'number' &&
    typeof candidate.wcagAA === 'boolean' &&
    typeof candidate.wcagAALarge === 'boolean' &&
    typeof candidate.wcagAAA === 'boolean' &&
    typeof candidate.wcagAAALarge === 'boolean'
  )
}

const isAPCAResult = (value: unknown): value is APCAResult => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<APCAResult>
  return (
    typeof candidate.lc === 'number' &&
    (candidate.level === 'AA' || candidate.level === 'AAA' || candidate.level === 'Fail') &&
    (candidate.fontSize === 'normal' ||
      candidate.fontSize === 'large' ||
      candidate.fontSize === 'heading' ||
      candidate.fontSize === 'graphic')
  )
}

export function AccessibilityPanel(): ReactNode {
  const { foreground, background, contrastStandard, contrastResult, setContrastResult, setContrastStandard } =
    useColorStore()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const checkContrast = async (): Promise<void> => {
      setLoading(true)
      try {
        if (contrastStandard === 'wcag') {
          const result = await window.api.getWcagContrast(foreground, background)
          if (!active) return
          setContrastResult(isWCAGResult(result) ? result : null)
        } else {
          const result = await window.api.getApcbContrast(foreground, background)
          if (!active) return
          setContrastResult(isAPCAResult(result) ? result : null)
        }
      } catch (error) {
        console.error('Failed to check contrast:', error)
        if (active) setContrastResult(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void checkContrast()

    return () => {
      active = false
    }
  }, [foreground, background, contrastStandard, setContrastResult])

  const renderComplianceToggle = (label: string, pass: boolean): ReactNode => (
    <div className={`compliance-toggle ${pass ? 'pass' : 'fail'}`}>
      <span className="toggle-icon" aria-hidden="true">
        {pass ? '✓' : '✕'}
      </span>
      <span className="toggle-label">{label}</span>
    </div>
  )

  const renderWCAG = (result: ContrastResult): ReactNode => (
    <>
      <div className="ratio-block">
        <span className="contrast-caption">Contrast Ratio</span>
        <div className="contrast-ratio-value">
          <span className="ratio-main">{result.ratio.toFixed(2)}</span>
          <span className="ratio-separator">:</span>
          <span className="ratio-one">1</span>
        </div>
      </div>
      <div className="footer-divider" />
      <div className="compliance-block">
        <div className="compliance-header">
          <span className="contrast-caption">WCAG Compliance</span>
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
        <div className="compliance-group">
          {renderComplianceToggle('AA', result.wcagAA)}
          {renderComplianceToggle('AAA', result.wcagAAA)}
          {renderComplianceToggle('AA Large', result.wcagAALarge)}
          {renderComplianceToggle('AAA Large', result.wcagAAALarge)}
        </div>
      </div>
    </>
  )

  const renderAPCA = (result: APCAResult): ReactNode => {
    const lc = Math.abs(result.lc)
    return (
      <>
        <div className="ratio-block">
          <span className="contrast-caption">Lightness Contrast</span>
          <div className="contrast-ratio-value">
            <span className="ratio-main">{lc.toFixed(0)}</span>
            <span className="ratio-separator">Lc</span>
          </div>
        </div>
        <div className="footer-divider" />
        <div className="compliance-block">
          <div className="compliance-header">
            <span className="contrast-caption">APCA Compliance</span>
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
          <div className="compliance-group">
            {renderComplianceToggle('Baseline 30+', lc >= 30)}
            {renderComplianceToggle('Headline 45+', lc >= 45)}
            {renderComplianceToggle('Title 60+', lc >= 60)}
            {renderComplianceToggle('Body 75+', lc >= 75)}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="accessibility-panel">
      {loading ? (
        <div className="loading">Calculating...</div>
      ) : contrastResult && contrastStandard === 'wcag' && isWCAGResult(contrastResult) ? (
        <div className="contrast-footer-layout">
          {renderWCAG(contrastResult)}
        </div>
      ) : contrastResult && contrastStandard === 'apca' && isAPCAResult(contrastResult) ? (
        <div className="contrast-footer-layout">
          {renderAPCA(contrastResult)}
        </div>
      ) : (
        <div className="no-result">No result</div>
      )}
    </div>
  )
}
