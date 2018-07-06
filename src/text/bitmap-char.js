/** A BitmapChar contains the information about one char of a bitmap font.
 *  <em>You don't have to use this class directly in most cases.
 *  The TextField class contains methods that handle bitmap fonts for you.</em>
 */
export default class BitmapChar {
  _texture
  _charID
  _xOffset
  _yOffset
  _xAdvance
  _kernings

  /** Creates a char with a texture and its properties. */
  constructor(id, texture, xOffset, yOffset, xAdvance) {
    this._charID = id
    this._texture = texture
    this._xOffset = xOffset
    this._yOffset = yOffset
    this._xAdvance = xAdvance
    this._kernings = null
  }

  /** Adds kerning information relative to a specific other character ID. */
  addKerning(charID, amount) {
    if (!this._kernings) this._kernings = new Map()

    this._kernings.set(charID, amount)
  }

  /** Retrieve kerning information relative to the given character ID. */
  getKerning(charID) {
    if (!this._kernings || !this._kernings.get(charID)) return 0.0
    else return this._kernings.get(charID)
  }

  /** Creates an image of the char. */
  createImage() {
    return new Image(this._texture)
  }

  /** The unicode ID of the char. */
  get charID() {
    return this._charID
  }

  /** The number of points to move the char in x direction on character arrangement. */
  get xOffset() {
    return this._xOffset
  }

  /** The number of points to move the char in y direction on character arrangement. */
  get yOffset() {
    return this._yOffset
  }

  /** The number of points the cursor has to be moved to the right for the next char. */
  get xAdvance() {
    return this._xAdvance
  }

  /** The texture of the character. */
  get texture() {
    return this._texture
  }

  /** The width of the character in points. */
  get width() {
    return this._texture ? this._texture.width : 0
  }

  /** The height of the character in points. */
  get height() {
    return this._texture ? this._texture.height : 0
  }
}
