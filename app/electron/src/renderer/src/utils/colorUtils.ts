import { colornames } from 'color-name-list'

interface ColorNameItem {
  name: string
  hex: string
}

const COLOR_NAMES = colornames as ColorNameItem[]
const COLOR_NAME_CACHE = new Map<string, string>()

export const normalizeHex = (hex: string): string | null => {
  const raw = hex.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  if (raw.length === 3) {
    return raw
      .split('')
      .map((c) => `${c}${c}`)
      .join('')
      .toUpperCase()
  }
  return raw.toUpperCase()
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => ({
  r: Number.parseInt(hex.slice(0, 2), 16),
  g: Number.parseInt(hex.slice(2, 4), 16),
  b: Number.parseInt(hex.slice(4, 6), 16)
})

export const getClosestColorName = (hex: string): string => {
  const normalizedHex = normalizeHex(hex)
  if (!normalizedHex) return 'Unknown'

  const cached = COLOR_NAME_CACHE.get(normalizedHex)
  if (cached) return cached

  const target = hexToRgb(normalizedHex)
  let closest = 'Unknown'
  let minDistance = Number.POSITIVE_INFINITY

  for (const item of COLOR_NAMES) {
    const listHex = normalizeHex(item.hex)
    if (!listHex) continue
    const rgb = hexToRgb(listHex)
    const distance = (target.r - rgb.r) ** 2 + (target.g - rgb.g) ** 2 + (target.b - rgb.b) ** 2

    if (distance < minDistance) {
      minDistance = distance
      closest = item.name
      if (distance === 0) break
    }
  }

  COLOR_NAME_CACHE.set(normalizedHex, closest)
  return closest
}

export const normalizeDisplayValue = (value: string, format: string): string => {
  if (format === 'oklch') {
    return value
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return value.replace(/\s+/g, '')
}

export const getReadableTextColor = (hex: string): string => {
  const raw = hex.replace('#', '')
  const fullHex =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : raw
  const r = Number.parseInt(fullHex.slice(0, 2), 16)
  const g = Number.parseInt(fullHex.slice(2, 4), 16)
  const b = Number.parseInt(fullHex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#111111' : '#ffffff'
}
