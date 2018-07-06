import FragmentFilter from './fragment-filter'
import BlurFilter from './blur-filter'
import CompositeFilter from './composite-filter'

/** The DropShadowFilter class lets you add a drop shadow to display objects.
 *  To create the shadow, the class internally uses the BlurFilter.
 */
export default class DropShadowFilter extends FragmentFilter {
  _blurFilter
  _compositeFilter
  _distance
  _angle

  /** Creates a new DropShadowFilter instance with the specified parameters.
   *
   * @param distance   the offset distance of the shadow, in points.
   * @param angle      the angle with which the shadow is offset, in radians.
   * @param color      the color of the shadow.
   * @param alpha      the alpha value of the shadow. Values between 0 and 1 modify the
   *                   opacity; values > 1 will make it stronger, i.e. produce a harder edge.
   * @param blur       the amount of blur with which the shadow is created. Note that high
   *                   values will cause the number of render passes to grow.
   * @param resolution the resolution of the filter texture. '1' means full resolution,
   *                   '0.5' half resolution, etc.
   */
  constructor(
    distance = 4.0,
    angle = 0.785,
    color = 0x0,
    alpha = 0.5,
    blur = 1.0,
    resolution = 0.5
  ) {
    super()
    this._compositeFilter = new CompositeFilter()
    this._blurFilter = new BlurFilter(blur, blur, resolution)
    this._distance = distance
    this._angle = angle

    this.color = color
    this.alpha = alpha

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
    const shadow = this._blurFilter.process(painter, helper, input0)
    const result = this._compositeFilter.process(
      painter,
      helper,
      shadow,
      input0
    )
    helper.putTexture(shadow)
    return result
  }

  /** @private */
  get numPasses() {
    return this._blurFilter.numPasses + this._compositeFilter.numPasses
  }

  updatePadding() {
    const offsetX = Math.cos(this._angle) * this._distance
    const offsetY = Math.sin(this._angle) * this._distance

    this._compositeFilter.setOffsetAt(0, offsetX, offsetY)

    const blurPadding = this._blurFilter.padding
    let left = blurPadding.left
    let right = blurPadding.right
    let top = blurPadding.top
    let bottom = blurPadding.bottom

    if (offsetX > 0) right += offsetX
    else left -= offsetX
    if (offsetY > 0) bottom += offsetY
    else top -= offsetY

    this.padding.setTo(left, right, top, bottom)
  }

  /** The color of the shadow. @default 0x0 */
  get color() {
    return this._compositeFilter.getColorAt(0)
  }

  set color(value) {
    if (this.color !== value) {
      this._compositeFilter.setColorAt(0, value, true)
      this.setRequiresRedraw()
    }
  }

  /** The alpha value of the shadow. Values between 0 and 1 modify the opacity;
   *  values > 1 will make it stronger, i.e. produce a harder edge. @default 0.5 */
  get alpha() {
    return this._compositeFilter.getAlphaAt(0)
  }

  set alpha(value) {
    if (this.alpha !== value) {
      this._compositeFilter.setAlphaAt(0, value)
      this.setRequiresRedraw()
    }
  }

  /** The offset distance for the shadow, in points. @default 4.0 */
  get distance() {
    return this._distance
  }

  set distance(value) {
    if (this._distance !== value) {
      this._distance = value
      this.setRequiresRedraw()
      this.updatePadding()
    }
  }

  /** The angle with which the shadow is offset, in radians. @default Math.PI / 4 */
  get angle() {
    return this._angle
  }

  set angle(value) {
    if (this._angle !== value) {
      this._angle = value
      this.setRequiresRedraw()
      this.updatePadding()
    }
  }

  /** The amount of blur with which the shadow is created.
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
