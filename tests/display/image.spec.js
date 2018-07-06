import Rectangle from '../../src/math/rectangle'
import Image from '../../src/display/image'
import MockTexture from '../test-utils/mock-texture'
import Helpers from '../helpers'

describe('Mesh', () => {
  const E = 0.00001

  it('should bind scale9grid to texture', () => {
    const texture = new MockTexture(16, 16)
    const texture2 = new MockTexture(16, 16)
    const scale9Grid = new Rectangle(2, 2, 12, 12)

    Image.bindScale9GridToTexture(texture, scale9Grid)

    let image = new Image(texture)
    Helpers.compareRectangles(image.scale9Grid, scale9Grid)

    image.texture = texture2
    expect(image.scale9Grid).to.be.null

    Image.resetSetupForTexture(texture)

    image = new Image(texture)
    expect(image.scale9Grid).to.be.null
  })

  it('should bind pivot point to texture', () => {
    let image
    const texture = new MockTexture(16, 16)
    const texture2 = new MockTexture(16, 16)
    const pivotX = 4
    const pivotY = 8

    Image.bindPivotPointToTexture(texture, pivotX, pivotY)

    image = new Image(texture)
    expect(image.pivotX).to.be.closeTo(pivotX, E)
    expect(image.pivotY).to.be.closeTo(pivotY, E)

    image.texture = texture2
    expect(image.pivotX).to.equal(0)
    expect(image.pivotY).to.equal(0)

    Image.resetSetupForTexture(texture)

    image = new Image(texture)
    expect(image.pivotX).to.equal(0)
    expect(image.pivotY).to.equal(0)
  })
})
