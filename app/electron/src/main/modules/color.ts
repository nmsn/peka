import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'
import namesPlugin from 'colord/plugins/names'

extend([labPlugin, namesPlugin])

export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'opengl'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'

export interface ColorValue {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsb: { h: number; s: number; b: number }
  hsl: { h: number; s: number; l: number }
  lab: { l: number; a: number; b: number }
  opengl: { r: number; g: number; b: number; a: number }
}

export const hexToColorValue = (hex: string): ColorValue => {
  const color = colord(hex)
  const rgb = color.toRgb()
  const hsl = color.toHsl()
  const hsb = { h: hsl.h, s: hsl.s, b: (rgb.r > 0 ? Math.max(rgb.r, Math.max(rgb.g, rgb.b)) / 255 : 0) * 100 }
  const lab = color.toLab()
  const alpha = rgb.a

  return {
    hex: color.toHex(),
    rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    hsb,
    hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
    lab: { l: lab.l, a: lab.a, b: lab.b },
    opengl: {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
      a: alpha
    }
  }
}

export const formatColor = (hex: string, format: ColorFormat): string => {
  const color = colord(hex)
  switch (format) {
    case 'hex':
      return color.toHex()
    case 'rgb':
      return color.toRgbString()
    case 'hsb':
      const hsl = color.toHsl()
      const rgb = color.toRgb()
      const b = Math.max(rgb.r, rgb.g, rgb.b) / 255 * 100
      return `hsb(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(b)}%)`
    case 'hsl':
      return color.toHslString()
    case 'lab':
      const lab = color.toLab()
      return `lab(${Math.round(lab.l)}%, ${Math.round(lab.a * 100) / 100}, ${Math.round(lab.b * 100) / 100})`
    case 'opengl':
      const rgbVal = color.toRgb()
      return `glColor4f(${rgbVal.r / 255}, ${rgbVal.g / 255}, ${rgbVal.b / 255}, ${rgbVal.a})`
    default:
      return color.toHex()
  }
}

export const formatForCopy = (hex: string, style: CopyFormat): string => {
  const color = colord(hex)
  const rgb = color.toRgb()

  switch (style) {
    case 'css':
      return color.toRgbString()
    case 'design':
      return `R:${rgb.r} G:${rgb.g} B:${rgb.b}`
    case 'swiftui':
      return `Color(red: ${(rgb.r / 255).toFixed(2)}, green: ${(rgb.g / 255).toFixed(2)}, blue: ${(rgb.b / 255).toFixed(2)})`
    case 'unformatted':
      return `${rgb.r}, ${rgb.g}, ${rgb.b}`
    default:
      return color.toRgbString()
  }
}

export const getColorName = (hex: string): string | null => {
  const color = colord(hex)
  return color.toName() || null
}

export const parseColor = (input: string): string | null => {
  const color = colord(input)
  if (color.isValid()) {
    return color.toHex()
  }
  return null
}
