import './assets/main.css'
import '../../shared/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SettingsWindow } from './SettingsWindow'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsWindow />
  </StrictMode>
)
