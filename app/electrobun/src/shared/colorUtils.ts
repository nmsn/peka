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

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = normalizeHex(hex)
  if (!normalized) return { r: 0, g: 0, b: 0 }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

const colorNameList: Array<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Lime', hex: '#00FF00' },
  { name: 'Aqua', hex: '#00FFFF' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Fuchsia', hex: '#FF00FF' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Salmon', hex: '#FA8072' },
  { name: 'Tomato', hex: '#FF6347' },
  { name: 'Indigo', hex: '#4B0082' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Chocolate', hex: '#D2691E' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Khaki', hex: '#F0E68C' }
]

const COLOR_NAME_CACHE = new Map<string, string>()

export const getClosestColorName = (hex: string): string => {
  const normalizedHex = normalizeHex(hex)
  if (!normalizedHex) return 'Unknown'

  const cached = COLOR_NAME_CACHE.get(normalizedHex)
  if (cached) return cached

  const target = hexToRgb(normalizedHex)
  let closest = 'Unknown'
  let minDistance = Number.POSITIVE_INFINITY

  for (const item of colorNameList) {
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
