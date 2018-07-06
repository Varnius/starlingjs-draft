import { BlendMode, Event, Image } from '../../../../src/index'

import Game from '../game'
import Scene from './scene'
import Constants from '../constants'
import MenuButton from '../utils/menu-button'

export default class BlendModeScene extends Scene {
  _button
  _image
  _infoText

  _blendModes = [
    BlendMode.NORMAL,
    BlendMode.MULTIPLY,
    BlendMode.SCREEN,
    BlendMode.ADD,
    BlendMode.ERASE,
    BlendMode.NONE
  ]

  constructor() {
    super()

    this._button = new MenuButton('Switch Mode')
    this._button.x = Math.floor(Constants.CenterX - this._button.width / 2)
    this._button.y = 15
    this._button.addEventListener(Event.TRIGGERED, this.onButtonTriggered)
    this.addChild(this._button)

    this._image = new Image(Game.assets.getTexture('starling_rocket'))
    this._image.x = Math.floor(Constants.CenterX - this._image.width / 2)
    this._image.y = 170
    this.addChild(this._image)

    //this._infoText = new TextField(300, 32);
    //this._infoText.format.size = 19;
    //this._infoText.x = 10;
    //this._infoText.y = 330;
    //addChild(this._infoText);

    this.onButtonTriggered()
  }

  onButtonTriggered = () => {
    const blendMode = this._blendModes.shift()
    this._blendModes.push(blendMode)

    //_infoText.text = blendMode;
    this._image.blendMode = blendMode
  }
}
