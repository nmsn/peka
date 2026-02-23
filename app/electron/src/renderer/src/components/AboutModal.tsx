import { useEffect, useState } from 'react'

import type { AppInfo } from '../types'

interface AboutModalProps {
  open: boolean
  onClose: () => void
}

export function AboutModal({ open, onClose }: AboutModalProps): React.ReactNode {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    if (!open) return

    const loadInfo = async (): Promise<void> => {
      try {
        const info = await window.api.getAppInfo()
        setAppInfo(info)
      } catch (error) {
        console.error('Failed to get app info:', error)
        setAppInfo({ name: 'Peka', version: 'Unknown' })
      }
    }

    void loadInfo()
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="button"
      tabIndex={-1}
      aria-label="Close about dialog"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className="about-modal"
        role="dialog"
        aria-modal="true"
        aria-label="About this app"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="about-header">关于</div>
        <div className="about-body">
          <div className="about-name">Peka</div>
          <div className="about-version">版本 {appInfo?.version ?? '...'}</div>
        </div>
        <button type="button" className="about-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  )
}
