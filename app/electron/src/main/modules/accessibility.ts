import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'
import a11yPlugin from 'colord/plugins/a11y'

extend([labPlugin, a11yPlugin])

export interface ContrastResult {
  ratio: number
  wcagAA: boolean
  wcagAALarge: boolean
  wcagAAA: boolean
  wcagAAALarge: boolean
}

export interface APCAResult {
  lc: number
  level: 'AA' | 'AAA' | 'Fail'
  fontSize: 'normal' | 'large' | 'heading' | 'graphic'
}

export const getWCAGContrast = (foreground: string, background: string): ContrastResult => {
  const fg = colord(foreground)
  const bg = colord(background)
  
  const ratio = fg.contrast(bg)
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAALarge: ratio >= 3,
    wcagAAA: ratio >= 7,
    wcagAAALarge: ratio >= 4.5
  }
}

const sRGBtoY = (c: number): number => {
  c = c / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

const getAPCALuminance = (hex: string): number => {
  const color = colord(hex).toRgb()
  const r = sRGBtoY(color.r)
  const g = sRGBtoY(color.g)
  const b = sRGBtoY(color.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const getAPCAContrast = (foreground: string, background: string): APCAResult => {
  const Yfg = getAPCALuminance(foreground)
  const Ybg = getAPCALuminance(background)
  
  let lc: number
  
  if (Ybg > Yfg) {
    lc = (Ybg ** 0.56 - Yfg ** 0.56) * 100
  } else {
    lc = (Yfg ** 0.46 - Ybg ** 0.46) * 100
  }
  
  lc = Math.round(lc * 100) / 100
  
  let level: 'AA' | 'AAA' | 'Fail'
  let fontSize: 'normal' | 'large' | 'heading' | 'graphic'
  
  if (lc >= 75) {
    level = 'AAA'
    fontSize = 'graphic'
  } else if (lc >= 60) {
    level = 'AAA'
    fontSize = 'heading'
  } else if (lc >= 45) {
    level = 'AA'
    fontSize = 'large'
  } else if (lc >= 30) {
    level = 'AA'
    fontSize = 'normal'
  } else {
    level = 'Fail'
    fontSize = 'normal'
  }
  
  return { lc, level, fontSize }
}

export const checkAccessibility = (
  foreground: string,
  background: string,
  standard: 'wcag' | 'apca'
): ContrastResult | APCAResult => {
  if (standard === 'wcag') {
    return getWCAGContrast(foreground, background)
  }
  return getAPCAContrast(foreground, background)
}
