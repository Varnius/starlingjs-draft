import { Sprite } from '../../../../src/index'
import Constants from '../constants'
import MenuButton from '../utils/menu-button'

export default class Scene extends Sprite {
  _backButton

  constructor() {
    super()

    // the main menu listens for TRIGGERED events, so we just need to add the button.
    // (the event will bubble up when it's dispatched.)

    this._backButton = new MenuButton('Back', 88, 50)
    this._backButton.x = Constants.CenterX - this._backButton.width / 2
    this._backButton.y = Constants.StageHeight - this._backButton.height + 12
    this._backButton.name = 'backButton'
    this._backButton.textBounds.y -= 3
    this._backButton.readjustSize() // forces textBounds to update

    this.addChild(this._backButton)
  }
}
