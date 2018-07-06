import { Image, Utils, TextField } from '../../../../src/index'

import Scene from './scene'
import Game from '../game'
import Constants from '../constants'
import TouchSheet from '../utils/touch-sheet'

export default class TouchScene extends Scene {
  constructor() {
    super()

    const description = '[use "z" to simulate multi-touch]'

    const infoText = new TextField(300, 25, description)
    infoText.x = infoText.y = 10
    this.addChild(infoText)

    // to find out how to react to touch events have a look at the TouchSheet class!
    // It's part of the demo.

    const sheet = new TouchSheet(
      new Image(Game.assets.getTexture('starling_sheet'))
    )
    sheet.x = Constants.CenterX
    sheet.y = Constants.CenterY
    sheet.rotation = Utils.deg2rad(10)
    this.addChild(sheet)
  }
}
