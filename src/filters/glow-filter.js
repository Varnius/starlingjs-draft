import FragmentFilter from './fragment-filter'
import BlurFilter from './blur-filter'
import CompositeFilter from './composite-filter'

/** The GlowFilter class lets you apply a glow effect to display objects.
 *  It is similar to the drop shadow filter with the distance and angle properties set to 0.
 *
 *  <p>This filter can also be used to create outlines around objects. The trick is to
 *  assign an alpha value that's (much) greater than <code>1.0</code>, and full resolution.
 *  For example, the following code will yield a nice black outline:</p>
 *
 *  <listing>object.filter = new GlowFilter(0x0, 30, 1, 1.0);</listing>
 */
export default class GlowFilter extends FragmentFilter {
  _blurFilter
  _compositeFilter

  /** Initializes a new GlowFilter instance with the specified parameters.
   *
   * @param color      the color of the glow
   * @param alpha      the alpha value of the glow. Values between 0 and 1 modify the
   *                   opacity; values > 1 will make it stronger, i.e. produce a harder edge.
   * @param blur       the amount of blur used to create the glow. Note that high
   *                   values will cause the number of render passes to grow.
   * @param resolution the resolution of the filter texture. '1' means full resolution,
   *                   '0.5' half resolution, etc.
   */
  constructor(color = 0xffff00, alpha = 1.0, blur = 1.0, resolution = 0.5) {
    super()
    this._blurFilter = new BlurFilter(blur, blur, resolution)
    this._compositeFilter = new CompositeFilter()
    this._compositeFilter.setColorAt(0, color, true)
    this._compositeFilter.setAlphaAt(0, alpha)

    this.updatePadding()
  }

  /** @inheritDoc */
  dispose() {
    this._blurFilter.dispose()
    this._compositeFilter.dispose()

    super.dispose()
  }

  /** @private */
  process(painter, helper, input0 = null) {
    const glow = this._blurFilter.process(painter, helper, input0)
    const result = this._compositeFilter.process(painter, helper, glow, input0)
    helper.putTexture(glow)
    return result
  }

  /** @private */
  get numPasses() {
    return this._blurFilter.numPasses + this._compositeFilter.numPasses
  }

  updatePadding() {
    this.padding.copyFrom(this._blurFilter.padding)
  }

  /** The color of the glow. @default 0xffff00 */
  get color() {
    return this._compositeFilter.getColorAt(0)
  }

  set color(value) {
    if (this.color !== value) {
      this._compositeFilter.setColorAt(0, value, true)
      this.setRequiresRedraw()
    }
  }

  /** The alpha value of the glow. Values between 0 and 1 modify the opacity;
   *  values > 1 will make it stronger, i.e. produce a harder edge. @default 1.0 */
  get alpha() {
    return this._compositeFilter.getAlphaAt(0)
  }

  set alpha(value) {
    if (this.alpha !== value) {
      this._compositeFilter.setAlphaAt(0, value)
      this.setRequiresRedraw()
    }
  }

  /** The amount of blur with which the glow is created.
   *  The number of required passes will be <code>Math.ceil(value) × 2</code>.
   *  @default 1.0 */
  get blur() {
    return this._blurFilter.blurX
  }

  set blur(value) {
    if (this.blur !== value) {
      this._blurFilter.blurX = this._blurFilter.blurY = value
      this.setRequiresRedraw()
      this.updatePadding()
    }
  }

  /** @private */
  get resolution() {
    return this._blurFilter.resolution
  }

  set resolution(value) {
    if (this.resolution !== value) {
      this._blurFilter.resolution = value
      this.setRequiresRedraw()
      this.updatePadding()
    }
  }
}
