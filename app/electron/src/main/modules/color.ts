import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'
import namesPlugin from 'colord/plugins/names'

extend([labPlugin, namesPlugin])

export type ColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'oklch'
export type CopyFormat = 'css' | 'design' | 'swiftui' | 'unformatted'

export interface ColorValue {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsb: { h: number; s: number; b: number }
  hsl: { h: number; s: number; l: number }
  lab: { l: number; a: number; b: number }
  oklch: { l: number; c: number; h: number; a: number }
}

const srgbToLinear = (value: number): number => {
  const normalized = value / 255
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

const rgbToOklch = (r: number, g: number, b: number): { l: number; c: number; h: number } => {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)

  const oklabL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot
  const oklabA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot
  const oklabB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot

  const chroma = Math.sqrt(oklabA ** 2 + oklabB ** 2)
  const hue = ((Math.atan2(oklabB, oklabA) * 180) / Math.PI + 360) % 360

  return { l: oklabL, c: chroma, h: hue }
}

export const hexToColorValue = (hex: string): ColorValue => {
  const color = colord(hex)
  const rgb = color.toRgb()
  const hsl = color.toHsl()
  const hsb = { h: hsl.h, s: hsl.s, b: (rgb.r > 0 ? Math.max(rgb.r, Math.max(rgb.g, rgb.b)) / 255 : 0) * 100 }
  const lab = color.toLab()
  const alpha = rgb.a
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b)

  return {
    hex: color.toHex(),
    rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    hsb,
    hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
    lab: { l: lab.l, a: lab.a, b: lab.b },
    oklch: {
      l: oklch.l,
      c: oklch.c,
      h: oklch.h,
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
    case 'oklch':
      const rgbVal = color.toRgb()
      const oklch = rgbToOklch(rgbVal.r, rgbVal.g, rgbVal.b)
      return `oklch(${(oklch.l * 100).toFixed(2)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)}${rgbVal.a < 1 ? ` / ${rgbVal.a.toFixed(2)}` : ''})`
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
