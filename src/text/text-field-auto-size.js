/** This class is an enumeration of constant values used in setting the
 *  autoSize property of the TextField class. */
export default class TextFieldAutoSize {
  /** @private */
  constructor() {
    throw new Error('[AbstractClassError]')
  }

  /** No auto-sizing will happen. */
  static NONE = 'none'

  /** The text field will grow/shrink sidewards; no line-breaks will be added.
   *  The height of the text field remains unchanged. Not supported for HTML text! */
  static HORIZONTAL = 'horizontal'

  /** The text field will grow/shrink downwards, adding line-breaks when necessary.
   * The width of the text field remains unchanged. */
  static VERTICAL = 'vertical'

  /** The text field will grow to the right and bottom; no line-breaks will be added. */
  static BOTH_DIRECTIONS = 'bothDirections'
}
