import { NEAREST, LINEAR } from 'gl-constants'

/** A class that provides constant values for the possible smoothing algorithms of a texture. */
export default class TextureSmoothing {
  /** No smoothing, also called "Nearest Neighbor". Pixels will scale up as big rectangles. */
  static NONE = NEAREST

  /** Bilinear filtering. Creates smooth transitions between pixels. */
  static BILINEAR = LINEAR

  /** Determines whether a smoothing value is valid. */
  static isValid(smoothing) {
    return (
      smoothing === TextureSmoothing.NONE ||
      smoothing === TextureSmoothing.BILINEAR
    )
  }
}
