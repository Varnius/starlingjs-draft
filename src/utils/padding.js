import EventDispatcher from '../events/event-dispatcher'
import Event from '../events/event'

/** The padding class stores one number for each of four directions,
 *  thus describing the padding around a 2D object. */
export default class Padding extends EventDispatcher {
  _left
  _right
  _top
  _bottom

  /** Creates a new instance with the given properties. */
  constructor(left = 0, right = 0, top = 0, bottom = 0) {
    super()
    this.setTo(left, right, top, bottom)
  }

  /** Sets all four sides at once. */
  setTo(left = 0, right = 0, top = 0, bottom = 0) {
    const changed =
      this._left !== left ||
      this._right !== right ||
      this._top !== top ||
      this._bottom !== bottom

    this._left = left
    this._right = right
    this._top = top
    this._bottom = bottom

    if (changed) this.dispatchEventWith(Event.CHANGE)
  }

  /** Sets all four sides to the same value. */
  setToUniform(value) {
    this.setTo(value, value, value, value)
  }

  /** Sets left and right to <code>horizontal</code>, top and bottom to <code>vertical</code>. */
  setToSymmetric(horizontal, vertical) {
    this.setTo(horizontal, horizontal, vertical, vertical)
  }

  /** Copies all properties from another Padding instance.
   *  Pass <code>null</code> to reset all values to zero. */
  copyFrom(padding) {
    if (!padding) this.setTo(0, 0, 0, 0)
    else
      this.setTo(padding._left, padding._right, padding._top, padding._bottom)
  }

  /** Creates a new instance with the exact same values. */
  clone() {
    return new Padding(this._left, this._right, this._top, this._bottom)
  }

  /** The padding on the left side. */
  get left() {
    return this._left
  }

  set left(value) {
    if (this._left !== value) {
      this._left = value
      this.dispatchEventWith(Event.CHANGE)
    }
  }

  /** The padding on the right side. */
  get right() {
    return this._right
  }

  set right(value) {
    if (this._right !== value) {
      this._right = value
      this.dispatchEventWith(Event.CHANGE)
    }
  }

  /** The padding towards the top. */
  get top() {
    return this._top
  }

  set top(value) {
    if (this._top !== value) {
      this._top = value
      this.dispatchEventWith(Event.CHANGE)
    }
  }

  /** The padding towards the bottom. */
  get bottom() {
    return this._bottom
  }

  set bottom(value) {
    if (this._bottom !== value) {
      this._bottom = value
      this.dispatchEventWith(Event.CHANGE)
    }
  }

  /** The sum of left and right padding. */
  get horizontal() {
    return this._left + this._right
  }

  /** The sum of top and bottom padding. */
  get vertical() {
    return this._top + this._bottom
  }
}
