import { Button, Rectangle } from '../../../../src/index'

import Game from '../game'

/** A simple button that uses "scale9grid" with a single texture. */
export default class MenuButton extends Button {
  constructor(text, width = 128, height = 32) {
    super(Game.assets.getTexture('button'), text)

    this.scale9Grid = new Rectangle(12.5, 12.5, 20, 20)
    this.width = width
    this.height = height
  }
}
