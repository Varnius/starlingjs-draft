/** A utility class containing predefined colors and methods converting between different
 *  color representations. */

export function premultiplyAlpha(rgba) {
  const alpha = rgba & 0xff

  if (alpha === 0xff) return rgba
  else {
    const factor = alpha / 255.0
    const r = ((rgba >> 24) & 0xff) * factor
    const g = ((rgba >> 16) & 0xff) * factor
    const b = ((rgba >> 8) & 0xff) * factor

    return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | alpha
  }
}

export function unmultiplyAlpha(rgba) {
  const alpha = rgba & 0xff

  if (alpha === 0xff || alpha === 0x0) return rgba
  else {
    const factor = alpha / 255.0
    const r = ((rgba >> 24) & 0xff) / factor
    const g = ((rgba >> 16) & 0xff) / factor
    const b = ((rgba >> 8) & 0xff) / factor

    return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | alpha
  }
}

export const toCssRgbString = color =>
  `rgb(${Color.getRed(color)}, ${Color.getGreen(color)}, ${Color.getBlue(
    color
  )})`

export default class Color {
  static WHITE = 0xffffff
  static SILVER = 0xc0c0c0
  static GRAY = 0x808080
  static BLACK = 0x000000
  static RED = 0xff0000
  static MAROON = 0x800000
  static YELLOW = 0xffff00
  static OLIVE = 0x808000
  static LIME = 0x00ff00
  static GREEN = 0x008000
  static AQUA = 0x00ffff
  static TEAL = 0x008080
  static BLUE = 0x0000ff
  static NAVY = 0x000080
  static FUCHSIA = 0xff00ff
  static PURPLE = 0x800080

  /** Returns the alpha part of an ARGB color (0 - 255). */
  static getAlpha(color) {
    return (color >> 24) & 0xff
  }

  static getAlphaRgba(color) {
    return color & 0xff
  }

  /** Returns the red part of an (A)RGB color (0 - 255). */
  static getRed(color) {
    return (color >> 16) & 0xff
  }

  /** Returns the green part of an (A)RGB color (0 - 255). */
  static getGreen(color) {
    return (color >> 8) & 0xff
  }

  /** Returns the blue part of an (A)RGB color (0 - 255). */
  static getBlue(color) {
    return color & 0xff
  }

  /** Sets the alpha part of an ARGB color (0 - 255). */
  static setAlpha(color, alpha) {
    return (color & 0x00ffffff) | ((alpha & 0xff) << 24)
  }

  static setAlphaRgba(color, alpha) {
    return (color & 0xffffff00) | (alpha & 0xff)
  }

  /** Sets the red part of an (A)RGB color (0 - 255). */
  static setRed(color, red) {
    return (color & 0xff00ffff) | ((red & 0xff) << 16)
  }

  /** Sets the green part of an (A)RGB color (0 - 255). */
  static setGreen(color, green) {
    return (color & 0xffff00ff) | ((green & 0xff) << 8)
  }

  /** Sets the blue part of an (A)RGB color (0 - 255). */
  static setBlue(color, blue) {
    return (color & 0xffffff00) | (blue & 0xff)
  }

  /** Creates an RGB color, stored in an unsigned integer. Channels are expected
   *  in the range 0 - 255. */
  static rgb(red, green, blue) {
    return (red << 16) | (green << 8) | blue
  }

  static rgba(red, green, blue, alpha) {
    return (red << 24) | (green << 16) | (blue << 8) | (0xff * alpha)
  }

  /** Creates an ARGB color, stored in an unsigned integer. Channels are expected
   *  in the range 0 - 255. */
  static argb(alpha, red, green, blue) {
    return (alpha << 24) | (red << 16) | (green << 8) | blue
  }

  /** Converts a color to a vector containing the RGBA components (in this order) scaled
   *  between 0 and 1. */
  static toVector(color, out = null) {
    if (!out) out = []

    out[0] = ((color >> 16) & 0xff) / 255.0
    out[1] = ((color >> 8) & 0xff) / 255.0
    out[2] = (color & 0xff) / 255.0
    out[3] = ((color >> 24) & 0xff) / 255.0

    return out
  }

  /** Multiplies all channels of an (A)RGB color with a certain factor. */
  static multiply(color, factor) {
    let alpha = ((color >> 24) & 0xff) * factor
    let red = ((color >> 16) & 0xff) * factor
    let green = ((color >> 8) & 0xff) * factor
    let blue = (color & 0xff) * factor

    if (alpha > 255) alpha = 255
    if (red > 255) red = 255
    if (green > 255) green = 255
    if (blue > 255) blue = 255

    return Color.argb(alpha, red, green, blue)
  }

  /** Calculates a smooth transition between one color to the next.
   *  <code>ratio</code> is expected between 0 and 1. */
  static interpolate(startColor, endColor, ratio) {
    const startA = (startColor >> 24) & 0xff
    const startR = (startColor >> 16) & 0xff
    const startG = (startColor >> 8) & 0xff
    const startB = startColor & 0xff

    const endA = (endColor >> 24) & 0xff
    const endR = (endColor >> 16) & 0xff
    const endG = (endColor >> 8) & 0xff
    const endB = endColor & 0xff

    const newA = startA + (endA - startA) * ratio
    const newR = startR + (endR - startR) * ratio
    const newG = startG + (endG - startG) * ratio
    const newB = startB + (endB - startB) * ratio

    return (newA << 24) | (newR << 16) | (newG << 8) | newB
  }
}
