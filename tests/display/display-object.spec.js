import Sprite from '../../src/display/sprite'
import Stage from '../../src/display/stage'
import Quad from '../../src/display/quad'

import Matrix from '../../src/math/matrix'
import Point from '../../src/math/point'
import deg2rad from '../../src/utils/deg2rad'
import Align from '../../src/utils/align'

import Helpers from '../helpers'

describe('DisplayObject', () => {
  const E = 0.0001

  it('should add child elements', () => {
    const object1 = new Sprite()
    const object2 = new Sprite()
    const object3 = new Sprite()

    object1.addChild(object2)
    object2.addChild(object3)

    expect(object1).to.be.equal(object1.base)
    expect(object1).to.be.equal(object2.base)
    expect(object1).to.be.equal(object3.base)

    const quad = new Quad(100, 100)
    expect(quad).to.be.equal(quad.base)
  })

  it('should have working root and stage', () => {
    const object1 = new Sprite()
    const object2 = new Sprite()
    const object3 = new Sprite()

    object1.addChild(object2)
    object2.addChild(object3)

    expect(object1.root).to.equal(null)
    expect(object2.root).to.equal(null)
    expect(object3.root).to.equal(null)
    expect(object1.stage).to.equal(null)
    expect(object2.stage).to.equal(null)
    expect(object3.stage).to.equal(null)

    const stage = new Stage(100, 100)
    stage.addChild(object1)

    expect(object1).to.equal(object1.root)
    expect(object1).to.equal(object2.root)
    expect(object1).to.equal(object3.root)

    expect(stage).to.equal(object1.stage)
    expect(stage).to.equal(object2.stage)
    expect(stage).to.equal(object3.stage)
  })

  it('should be able to get transformation matrix', () => {
    const sprite = new Sprite()
    const child = new Sprite()
    child.x = 30
    child.y = 20
    child.scaleX = 1.2
    child.scaleY = 1.5
    child.rotation = Math.PI / 4.0
    sprite.addChild(child)

    let matrix = sprite.getTransformationMatrix(child)
    const expectedMatrix = child.transformationMatrix
    expectedMatrix.invert()
    Helpers.compareMatrices(expectedMatrix, matrix)

    matrix = child.getTransformationMatrix(sprite)
    Helpers.compareMatrices(child.transformationMatrix, matrix)

    // more is tested indirectly via 'testBoundsInSpace' in DisplayObjectContainerTest
  })

  it('should be able to set transformation matrix', () => {
    const sprite = new Sprite()
    const matrix = new Matrix()
    matrix.scale(1.5, 2.0)
    matrix.rotate(0.25)
    matrix.translate(10, 20)

    sprite.transformationMatrix = matrix

    expect(sprite.scaleX).to.be.closeTo(1.5, E)
    expect(sprite.scaleY).to.be.closeTo(2.0, E)
    expect(sprite.rotation).to.be.closeTo(0.25, E)
    expect(sprite.x).to.be.closeTo(10, E)
    expect(sprite.y).to.be.closeTo(20, E)

    Helpers.compareMatrices(matrix, sprite.transformationMatrix)
  })

  it('should be able to set transformation matrix with pivot', () => {
    // pivot point information is redundant; instead, x/y properties will be modified.

    const sprite = new Sprite()
    sprite.pivotX = 50
    sprite.pivotY = 20

    const matrix = sprite.transformationMatrix
    sprite.transformationMatrix = matrix

    expect(sprite.x).to.be.closeTo(-50, E)
    expect(sprite.y).to.be.closeTo(-20, E)
    expect(sprite.pivotX).to.be.closeTo(0, E)
    expect(sprite.pivotY).to.be.closeTo(0, E)
  })

  it('should be able to set transformation matrix with right angles', () => {
    const sprite = new Sprite()
    const matrix = new Matrix()
    const angles = [Math.PI / 2.0, Math.PI / -2.0]

    for (const angle of angles) {
      matrix.identity()
      matrix.rotate(angle)
      sprite.transformationMatrix = matrix

      expect(sprite.x).to.be.closeTo(0, E)
      expect(sprite.y).to.be.closeTo(0, E)
      expect(sprite.skewX).to.be.closeTo(0.0, E)
      expect(sprite.skewY).to.be.closeTo(0.0, E)
      expect(sprite.rotation).to.be.closeTo(angle, E)
    }
  })

  it('should be able to set transformation matrix with zero values', () => {
    const sprite = new Sprite()
    const matrix = new Matrix(0, 0, 0, 0, 0, 0)
    sprite.transformationMatrix = matrix

    expect(sprite.x).to.equal(0.0)
    expect(sprite.y).to.equal(0.0)
    expect(sprite.scaleX).to.equal(0.0)
    expect(sprite.scaleY).to.equal(0.0)
    expect(sprite.rotation).to.equal(0.0)
    expect(sprite.skewX).to.equal(0.0)
    expect(sprite.skewY).to.equal(0.0)
  })

  it('should have correct bounds', () => {
    const quad = new Quad(10, 20)
    quad.x = -10
    quad.y = 10
    quad.rotation = Math.PI / 2

    const bounds = quad.bounds

    expect(bounds.x).to.be.closeTo(-30, E)
    expect(bounds.y).to.be.closeTo(10, E)
    expect(bounds.width).to.be.closeTo(20, E)
    expect(bounds.height).to.be.closeTo(10, E)
  })

  it('should behave ok with zero size', () => {
    const sprite = new Sprite()
    expect(sprite.scaleX).to.equal(1.0)
    expect(sprite.scaleY).to.equal(1.0)

    //// sprite is empty, scaling should thus have no effect!
    sprite.width = 100
    sprite.height = 200
    expect(sprite.scaleX).to.equal(1.0)
    expect(sprite.scaleY).to.equal(1.0)
    expect(sprite.width).to.equal(0.0)
    expect(sprite.height).to.equal(0.0)

    // setting a value to zero should be no problem -- and the original size
    // should be remembered.
    let quad = new Quad(100, 200)
    quad.scaleX = 0.0
    quad.scaleY = 0.0
    expect(quad.width).to.be.closeTo(0, E)
    expect(quad.height).to.be.closeTo(0, E)

    quad.scaleX = 1.0
    quad.scaleY = 1.0
    expect(quad.width).to.be.closeTo(100, E)
    expect(quad.height).to.be.closeTo(200, E)

    // the same should work with width & height
    quad = new Quad(100, 200)
    quad.width = 0
    quad.height = 0
    expect(quad.width).to.be.closeTo(0, E)
    expect(quad.height).to.be.closeTo(0, E)

    quad.width = 50
    quad.height = 100
    expect(quad.scaleX).to.be.closeTo(0.5, E)
    expect(quad.scaleY).to.be.closeTo(0.5, E)
  })

  it('should provide localToGlobal', () => {
    const root = new Sprite()
    const sprite = new Sprite()
    sprite.x = 10
    sprite.y = 20
    root.addChild(sprite)
    const sprite2 = new Sprite()
    sprite2.x = 150
    sprite2.y = 200
    sprite.addChild(sprite2)

    const localPoint = new Point(0, 0)
    let globalPoint = sprite2.localToGlobal(localPoint)
    const expectedPoint = new Point(160, 220)
    Helpers.comparePoints(expectedPoint, globalPoint)

    // the position of the root object should be irrelevant -- we want the coordinates
    // *within* the root coordinate system!
    root.x = 50
    globalPoint = sprite2.localToGlobal(localPoint)
    Helpers.comparePoints(expectedPoint, globalPoint)
  })

  it('should provide globalToLocal', () => {
    const root = new Sprite()
    const sprite = new Sprite()
    sprite.x = 10
    sprite.y = 20
    root.addChild(sprite)
    const sprite2 = new Sprite()
    sprite2.x = 150
    sprite2.y = 200
    sprite.addChild(sprite2)

    const globalPoint = new Point(160, 220)
    let localPoint = sprite2.globalToLocal(globalPoint)
    const expectedPoint = new Point()
    Helpers.comparePoints(expectedPoint, localPoint)

    // the position of the root object should be irrelevant -- we want the coordinates
    // *within* the root coordinate system!
    root.x = 50
    localPoint = sprite2.globalToLocal(globalPoint)
    Helpers.comparePoints(expectedPoint, localPoint)
  })

  it('should return correct hit test point', () => {
    const quad = new Quad(25, 10)
    expect(quad.hitTest(new Point(15, 5))).to.be.ok
    expect(quad.hitTest(new Point(0, 0))).to.be.ok
    expect(quad.hitTest(new Point(24.99, 0))).to.be.ok
    expect(quad.hitTest(new Point(24.99, 9.99))).to.be.ok
    expect(quad.hitTest(new Point(0, 9.99))).to.be.ok
    expect(quad.hitTest(new Point(-1, -1))).to.not.be.ok
    expect(quad.hitTest(new Point(25.01, 10.01))).to.not.be.ok

    quad.visible = false
    expect(quad.hitTest(new Point(15, 5))).to.not.be.ok

    quad.visible = true
    quad.touchable = false
    expect(quad.hitTest(new Point(10, 5))).to.not.be.ok

    quad.visible = false
    quad.touchable = false
    expect(quad.hitTest(new Point(10, 5))).to.not.be.ok
  })

  it('should rotate correctly', () => {
    const quad = new Quad(100, 100)
    quad.rotation = deg2rad(400)
    expect(quad.rotation).to.be.closeTo(deg2rad(40), E)
    quad.rotation = deg2rad(220)
    expect(quad.rotation).to.be.closeTo(deg2rad(-140), E)
    quad.rotation = deg2rad(180)
    expect(quad.rotation).to.be.closeTo(deg2rad(180), E)
    quad.rotation = deg2rad(-90)
    expect(quad.rotation).to.be.closeTo(deg2rad(-90), E)
    quad.rotation = deg2rad(-179)
    expect(quad.rotation).to.be.closeTo(deg2rad(-179), E)
    quad.rotation = deg2rad(-180)
    expect(quad.rotation).to.be.closeTo(deg2rad(-180), E)
    quad.rotation = deg2rad(-181)
    expect(quad.rotation).to.be.closeTo(deg2rad(179), E)
    quad.rotation = deg2rad(-300)
    expect(quad.rotation).to.be.closeTo(deg2rad(60), E)
    quad.rotation = deg2rad(-370)
    expect(quad.rotation).to.be.closeTo(deg2rad(-10), E)
  })

  it('should have correct pivot point', () => {
    const width = 100.0
    const height = 150.0

    // a quad with a pivot point should behave exactly as a quad without
    // pivot point inside a sprite

    const sprite = new Sprite()
    const innerQuad = new Quad(width, height)
    sprite.addChild(innerQuad)
    const quad = new Quad(width, height)
    Helpers.compareRectangles(sprite.bounds, quad.bounds)

    innerQuad.x = -50
    quad.pivotX = 50
    innerQuad.y = -20
    quad.pivotY = 20
    Helpers.compareRectangles(sprite.bounds, quad.bounds)

    sprite.rotation = quad.rotation = deg2rad(45)
    Helpers.compareRectangles(sprite.bounds, quad.bounds)

    sprite.scaleX = quad.scaleX = 1.5
    sprite.scaleY = quad.scaleY = 0.6
    Helpers.compareRectangles(sprite.bounds, quad.bounds)

    sprite.x = quad.x = 5
    sprite.y = quad.y = 20
    Helpers.compareRectangles(sprite.bounds, quad.bounds)
  })

  it('should have correct pivot point with skew', () => {
    const width = 200
    const height = 100
    const skewX = 0.2
    const skewY = 0.35
    const scaleY = 0.5
    const rotation = 0.5

    // create a scaled, rotated and skewed object from a sprite and a quad

    const quad = new Quad(width, height)
    quad.x = width / -2
    quad.y = height / -2

    const sprite = new Sprite()
    sprite.x = width / 2
    sprite.y = height / 2
    sprite.skewX = skewX
    sprite.skewY = skewY
    sprite.rotation = rotation
    sprite.scaleY = scaleY
    sprite.addChild(quad)

    // do the same without a sprite, but with a pivoted quad

    const pQuad = new Quad(width, height)
    pQuad.x = width / 2
    pQuad.y = height / 2
    pQuad.pivotX = width / 2
    pQuad.pivotY = height / 2
    pQuad.skewX = skewX
    pQuad.skewY = skewY
    pQuad.scaleY = scaleY
    pQuad.rotation = rotation

    // the bounds have to be the same

    Helpers.compareRectangles(sprite.bounds, pQuad.bounds, 1.0)
  })

  it('should have correct pivot align', () => {
    const sprite = new Sprite()
    const quad = new Quad(100, 50)
    quad.x = 200
    quad.y = -100
    sprite.addChild(quad)

    sprite.alignPivot()
    expect(sprite.pivotX).to.be.closeTo(250, E)
    expect(sprite.pivotY).to.be.closeTo(-75, E)

    sprite.alignPivot(Align.LEFT, Align.TOP)
    expect(sprite.pivotX).to.be.closeTo(200, E)
    expect(sprite.pivotY).to.be.closeTo(-100, E)

    sprite.alignPivot(Align.RIGHT, Align.BOTTOM)
    expect(sprite.pivotX).to.be.closeTo(300, E)
    expect(sprite.pivotY).to.be.closeTo(-50, E)

    sprite.alignPivot(Align.LEFT, Align.BOTTOM)
    expect(sprite.pivotX).to.be.closeTo(200, E)
    expect(sprite.pivotY).to.be.closeTo(-50, E)
  })

  it('should have correct name', () => {
    const sprite = new Sprite()
    expect(sprite.name).to.not.be.ok

    sprite.name = 'haya'
    expect(sprite.name).to.equal('haya')
  })

  it('should scale uniformly', () => {
    const sprite = new Sprite()
    expect(sprite.scale).to.be.closeTo(1.0, E)

    sprite.scaleY = 0.5
    expect(sprite.scale).to.be.closeTo(1.0, E)

    sprite.scaleX = 0.25
    expect(sprite.scale).to.be.closeTo(0.25, E)

    sprite.scale = 0.75
    expect(sprite.scaleX).to.be.closeTo(0.75, E)
    expect(sprite.scaleY).to.be.closeTo(0.75, E)
  })

  it('should set correct width after setting negative one', () => {
    const quad = new Quad(100, 100)

    quad.width = -10
    quad.height = -10

    expect(quad.scaleX).to.be.closeTo(-0.1, E)
    expect(quad.scaleY).to.be.closeTo(-0.1, E)

    quad.width = 100
    quad.height = 100

    expect(quad.scaleX).to.be.closeTo(1.0, E)
    expect(quad.scaleY).to.be.closeTo(1.0, E)
  })

  it('should allow setting size to NaN and back to number', () => {
    const quad = new Quad(100, 200)

    quad.width = NaN
    quad.height = NaN

    expect(isNaN(quad.width)).to.be.true
    expect(isNaN(quad.height)).to.be.true

    quad.width = 100
    quad.height = 200

    expect(quad.width).to.be.closeTo(100, E)
    expect(quad.height).to.be.closeTo(200, E)
  })

  it('should allow setting size to a very small value and back to bigger one', () => {
    const sprite = new Sprite()
    const quad = new Quad(100, 100)
    sprite.addChild(quad)
    sprite.x = sprite.y = 480

    sprite.width = 2.842170943040401e-14
    sprite.width = 100

    sprite.height = 2.842170943040401e-14
    sprite.height = 100

    expect(sprite.width).to.be.closeTo(100, E)
    expect(sprite.height).to.be.closeTo(100, E)
  })
})
