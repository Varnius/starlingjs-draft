import { Sprite, TouchEvent, TouchPhase, Point } from '../../../../src/index'

export default class TouchSheet extends Sprite {
  constructor(contents = null) {
    super()

    this.addEventListener(TouchEvent.TOUCH, this.onTouch)
    this.useHandCursor = true

    if (contents) {
      contents.x = Math.floor(contents.width / -2)
      contents.y = Math.floor(contents.height / -2)
      this.addChild(contents)
    }
  }

  onTouch = event => {
    const touches = event.getTouches(this, TouchPhase.MOVED)
    const parent = this.parent

    if (touches.length === 1) {
      // one finger touching -> move
      const delta = touches[0].getMovement(parent)
      this.x += delta.x
      this.y += delta.y
    } else if (touches.length === 2) {
      // two fingers touching -> rotate and scale
      const touchA = touches[0]
      const touchB = touches[1]

      const currentPosA = touchA.getLocation(parent)
      const previousPosA = touchA.getPreviousLocation(parent)
      const currentPosB = touchB.getLocation(parent)
      const previousPosB = touchB.getPreviousLocation(parent)

      const currentVector = currentPosA.subtract(currentPosB)
      const previousVector = previousPosA.subtract(previousPosB)

      const currentAngle = Math.atan2(currentVector.y, currentVector.x)
      const previousAngle = Math.atan2(previousVector.y, previousVector.x)
      const deltaAngle = currentAngle - previousAngle

      // update pivot point based on previous center
      const previousLocalA = touchA.getPreviousLocation(this)
      const previousLocalB = touchB.getPreviousLocation(this)
      this.pivotX = (previousLocalA.x + previousLocalB.x) * 0.5
      this.pivotY = (previousLocalA.y + previousLocalB.y) * 0.5

      // update location based on the current center
      this.x = (currentPosA.x + currentPosB.x) * 0.5
      this.y = (currentPosA.y + currentPosB.y) * 0.5

      // rotate
      this.rotation += deltaAngle

      // scale
      const sizeDiff = currentVector.length / previousVector.length
      this.scaleX *= sizeDiff
      this.scaleY *= sizeDiff
    }

    const touch = event.getTouch(this, TouchPhase.ENDED)

    if (touch && touch.tapCount === 2) parent.addChild(this) // bring self to front

    // enable this code to see when you're hovering over the object
    // touch = event.getTouch(this, TouchPhase.HOVER);
    // alpha = touch ? 0.8 : 1.0;
  }

  dispose() {
    this.removeEventListener(TouchEvent.TOUCH, this.onTouch)
    super.dispose()
  }
}
