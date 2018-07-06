export default {
  HOVER: 'hover',

  /** The finger touched the screen just now, or the mouse button was pressed. */
  BEGAN: 'began',

  /** The finger moves around on the screen, or the mouse is moved while the button is
   *  pressed. */
  MOVED: 'moved',

  /** The finger or mouse (with pressed button) has not moved since the last frame. */
  STATIONARY: 'stationary',

  /** The finger was lifted from the screen or from the mouse button. */
  ENDED: 'ended'
}
