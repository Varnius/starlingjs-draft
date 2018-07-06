import Quad from '../../src/display/quad'
import Sprite from '../../src/display/sprite'
import Rectangle from '../../src/math/rectangle'
import Point from '../../src/math/point'
import Color from '../../src/utils/color'
import Helpers from '../helpers'

import MockTexture from '../test-utils/mock-texture'

describe('Quad', () => {
  const E = 0.0001

  it('should work', () => {
    const quad = new Quad(100, 200, Color.AQUA)
    expect(quad.color).to.equal(Color.AQUA)
  })

  it('should allow to be colored', () => {
    const quad = new Quad(100, 100)
    quad.setVertexColor(0, Color.AQUA)
    quad.setVertexColor(1, Color.BLACK)
    quad.setVertexColor(2, Color.BLUE)
    quad.setVertexColor(3, Color.FUCHSIA)

    expect(quad.getVertexColor(0)).to.equal(Color.AQUA)
    expect(quad.getVertexColor(1)).to.equal(Color.BLACK)
    expect(quad.getVertexColor(2)).to.equal(Color.BLUE)
    expect(quad.getVertexColor(3)).to.equal(Color.FUCHSIA)
  })

  it('should return correct bounds', () => {
    const quad = new Quad(100, 200)
    Helpers.compareRectangles(new Rectangle(0, 0, 100, 200), quad.bounds)

    quad.pivotX = 50
    Helpers.compareRectangles(new Rectangle(-50, 0, 100, 200), quad.bounds)

    quad.pivotY = 60
    Helpers.compareRectangles(new Rectangle(-50, -60, 100, 200), quad.bounds)

    quad.scaleX = 2
    Helpers.compareRectangles(new Rectangle(-100, -60, 200, 200), quad.bounds)

    quad.scaleY = 0.5
    Helpers.compareRectangles(new Rectangle(-100, -30, 200, 100), quad.bounds)

    quad.x = 10
    Helpers.compareRectangles(new Rectangle(-90, -30, 200, 100), quad.bounds)

    quad.y = 20
    Helpers.compareRectangles(new Rectangle(-90, -10, 200, 100), quad.bounds)

    const parent = new Sprite()
    parent.addChild(quad)

    Helpers.compareRectangles(parent.bounds, quad.bounds)
  })

  it('should have correct width and height', () => {
    const quad = new Quad(100, 50)
    expect(quad.width).to.equal(100)
    expect(quad.height).to.equal(50)

    quad.scaleX = -1
    expect(quad.width).to.equal(100)

    quad.pivotX = 100
    expect(quad.width).to.equal(100)

    quad.pivotX = -10
    expect(quad.width).to.equal(100)

    quad.scaleY = -1
    expect(quad.height).to.equal(50)

    quad.pivotY = 20
    expect(quad.height).to.equal(50)
  })

  it('should correctly hit test', () => {
    const quad = new Quad(100, 50)
    expect(quad).to.equal(quad.hitTest(new Point(0.1, 0.1)))
    expect(quad).to.equal(quad.hitTest(new Point(99.9, 49.9)))
    expect(quad.hitTest(new Point(-0.1, -0.1))).to.be.null
    expect(quad.hitTest(new Point(100.1, 25))).to.be.null
    expect(quad.hitTest(new Point(50, 50.1))).to.be.null
    expect(quad.hitTest(new Point(100.1, 50.1))).to.be.null
  })

  it('should correctly readjust size', () => {
    const texture = new MockTexture(100, 50)
    const quad = new Quad(10, 20)

    quad.texture = texture
    expect(quad.width).to.be.closeTo(10, E)
    expect(quad.height).to.be.closeTo(20, E)
    expect(texture).to.equal(quad.texture)

    quad.readjustSize()

    expect(quad.width).to.be.closeTo(texture.frameWidth, E)
    expect(quad.height).to.be.closeTo(texture.frameHeight, E)

    const newWidth = 64
    const newHeight = 32

    quad.readjustSize(newWidth, newHeight)

    expect(quad.width).to.be.closeTo(newWidth, E)
    expect(quad.height).to.be.closeTo(newHeight, E)

    quad.texture = null
    quad.readjustSize() // shouldn't change anything

    expect(quad.width).to.be.closeTo(newWidth, E)
    expect(quad.height).to.be.closeTo(newHeight, E)
  })
})
