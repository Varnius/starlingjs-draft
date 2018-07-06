import { TextField, Align, BitmapFont, Color } from '../../../../src/index'

import Scene from './scene'

export default class TextScene extends Scene {
  constructor() {
    super()
    this.init()
  }

  init() {
    // TrueType fonts

    const offset = 10
    const ttFont = 'Tahoma'
    const ttFontSize = 19

    const colorTF = new TextField(
      300,
      80,
      'TextFields can have a border and a color. They can be aligned in different ways, ...'
    )
    colorTF.format.setTo(ttFont, ttFontSize, 0x33399)
    colorTF.x = colorTF.y = offset
    colorTF.border = true
    colorTF.padding = 4
    this.addChild(colorTF)

    const leftTF = new TextField(145, 80, '... e.g.\ntop-left ...')
    leftTF.format.setTo(ttFont, ttFontSize, 0x993333)
    leftTF.format.horizontalAlign = Align.LEFT
    leftTF.format.verticalAlign = Align.TOP
    leftTF.x = offset
    leftTF.y = colorTF.y + colorTF.height + offset
    leftTF.border = true
    leftTF.padding = 4
    this.addChild(leftTF)

    const rightTF = new TextField(145, 80, '... or\nbottom right ...')
    rightTF.format.setTo(ttFont, ttFontSize, 0x208020)
    rightTF.format.horizontalAlign = Align.RIGHT
    rightTF.format.verticalAlign = Align.BOTTOM
    rightTF.border = true
    rightTF.padding = 4
    rightTF.x = 2 * offset + leftTF.width
    rightTF.y = leftTF.y
    this.addChild(rightTF)

    // Bitmap fonts!

    // First, you will need to create a bitmap font texture.
    //
    // E.g. with this tool: www.angelcode.com/products/bmfont/ or one that uses the same
    // data format. Export the font data as an XML file, and the texture as a png with
    // white (!) characters on a transparent background (32 bit).
    //
    // Then, you just have to register the font at the TextField class.
    // Look at the file 'Assets.as' to see how this is done.
    // After that, you can use them just like a conventional TrueType font.

    const bmpFontTF = new TextField(
      300,
      150,
      'It is very easy to use Bitmap fonts,\nas well!'
    )
    bmpFontTF.format.font = 'Desyrel'
    bmpFontTF.format.size = BitmapFont.NATIVE_SIZE // native bitmap font size, no scaling
    bmpFontTF.format.color = Color.WHITE // white will draw the texture as is (no tinting)
    bmpFontTF.x = offset
    bmpFontTF.y = rightTF.y + rightTF.height + offset
    this.addChild(bmpFontTF)

    // A tip: you can also add the font-texture to your standard texture atlas!
  }
}
