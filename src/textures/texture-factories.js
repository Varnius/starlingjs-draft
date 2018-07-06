import SubTexture from './subtexture'

export const fromTexture = (
  texture,
  region = null,
  frame = null,
  rotated = false,
  scaleModifier = 1.0
) => new SubTexture(texture, region, false, frame, rotated, scaleModifier)
