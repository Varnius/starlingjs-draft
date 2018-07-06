import Sprite from '../../src/display/sprite'
import Stage from '../../src/display/stage'
import Quad from '../../src/display/quad'
import Event from '../../src/events/event'

import Rectangle from '../../src/math/rectangle'

import Helpers from '../helpers'

describe('DisplayObjectContainer', () => {
  const E = 0.0001
  let added, addedToStage, addedChild, removed, removedFromStage, removedChild

  beforeEach(() => {
    added = addedToStage = addedChild = removed = removedFromStage = removedChild = 0
  })

  it('should handle parent-child relations', () => {
    const parent = new Sprite()
    const child1 = new Sprite()
    const child2 = new Sprite()
    let returnValue

    expect(parent.numChildren).to.equal(0)
    expect(child1.parent).to.not.be.ok

    returnValue = parent.addChild(child1)
    expect(returnValue).to.equal(child1)
    expect(parent.numChildren).to.equal(1)
    expect(child1.parent).to.equal(parent)

    returnValue = parent.addChild(child2)
    expect(returnValue).to.equal(child2)
    expect(parent.numChildren).to.equal(2)
    expect(child2.parent).to.equal(parent)
    expect(parent.getChildAt(0)).to.equal(child1)
    expect(parent.getChildAt(1)).to.equal(child2)

    returnValue = parent.removeChild(child1)
    expect(returnValue).to.equal(child1)
    expect(child1.parent).to.be.null
    expect(parent.getChildAt(0)).to.equal(child2)
    returnValue = parent.removeChild(child1)
    expect(returnValue).to.be.null
    child1.removeFromParent() // should *not* throw an exception

    returnValue = child2.addChild(child1)
    expect(returnValue).to.equal(child1)
    expect(parent.contains(child1)).to.be.true
    expect(parent.contains(child2)).to.be.true
    expect(child1.parent).to.equal(child2)

    returnValue = parent.addChildAt(child1, 0)
    expect(returnValue).to.equal(child1)
    expect(child1.parent).to.equal(parent)
    expect(child2.contains(child1)).to.be.false
    expect(parent.getChildAt(0)).to.equal(child1)
    expect(parent.getChildAt(1)).to.equal(child2)

    returnValue = parent.removeChildAt(0)
    expect(returnValue).to.equal(child1)
    expect(parent.getChildAt(0)).to.equal(child2)
    expect(parent.numChildren).to.equal(1)
  })

  function createSprite(numChildren) {
    const sprite = new Sprite()
    for (let i = 0; i < numChildren; ++i) {
      const child = new Sprite()
      child.name = i.toString()
      sprite.addChild(child)
    }
    return sprite
  }

  it('should allow to remove children', () => {
    let parent
    const numChildren = 10

    // removing all children

    parent = createSprite(numChildren)
    expect(parent.numChildren).to.equal(10)

    parent.removeChildren()
    expect(parent.numChildren).to.equal(0)

    // removing a subset

    parent = createSprite(numChildren)
    parent.removeChildren(3, 5)
    expect(parent.numChildren).to.equal(7)
    expect(parent.getChildAt(2).name).to.equal('2')
    expect(parent.getChildAt(3).name).to.equal('6')

    // remove beginning from an id

    parent = createSprite(numChildren)
    parent.removeChildren(5)
    expect(parent.numChildren).to.equal(5)
    expect(parent.getChildAt(4).name).to.equal('4')
  })

  it('should get child by name', () => {
    const parent = new Sprite()
    const child1 = new Sprite()
    const child2 = new Sprite()
    const child3 = new Sprite()

    parent.addChild(child1)
    parent.addChild(child2)
    parent.addChild(child3)

    child1.name = 'child1'
    child2.name = 'child2'
    child3.name = 'child3'

    expect(parent.getChildByName('child1')).to.equal(child1)
    expect(parent.getChildByName('child2')).to.equal(child2)
    expect(parent.getChildByName('child3')).to.equal(child3)
    expect(parent.getChildByName('non-existing')).to.be.null

    child2.name = 'child3'
    expect(parent.getChildByName('child3')).to.equal(child2)
  })

  it('should allow to set child index', () => {
    const parent = new Sprite()
    const childA = new Sprite()
    const childB = new Sprite()
    const childC = new Sprite()

    parent.addChild(childA)
    parent.addChild(childB)
    parent.addChild(childC)

    parent.setChildIndex(childB, 0)
    expect(childB).to.equal(parent.getChildAt(0))
    expect(childA).to.equal(parent.getChildAt(1))
    expect(childC).to.equal(parent.getChildAt(2))

    parent.setChildIndex(childB, 1)
    expect(childA).to.equal(parent.getChildAt(0))
    expect(childB).to.equal(parent.getChildAt(1))
    expect(childC).to.equal(parent.getChildAt(2))

    parent.setChildIndex(childB, 2)
    expect(childA).to.equal(parent.getChildAt(0))
    expect(childC).to.equal(parent.getChildAt(1))
    expect(childB).to.equal(parent.getChildAt(2))

    expect(parent.numChildren).to.equal(3)
  })

  it('should allow get child by negative index', () => {
    const parent = new Sprite()
    const childA = new Sprite()
    const childB = new Sprite()
    const childC = new Sprite()

    parent.addChild(childA)
    parent.addChild(childB)
    parent.addChild(childC)

    expect(childA).to.equal(parent.getChildAt(-3))
    expect(childB).to.equal(parent.getChildAt(-2))
    expect(childC).to.equal(parent.getChildAt(-1))
  })

  it('should allow to swap children', () => {
    const parent = new Sprite()
    const childA = new Sprite()
    const childB = new Sprite()
    const childC = new Sprite()

    parent.addChild(childA)
    parent.addChild(childB)
    parent.addChild(childC)

    parent.swapChildren(childA, childC)
    expect(childC).to.equal(parent.getChildAt(0))
    expect(childB).to.equal(parent.getChildAt(1))
    expect(childA).to.equal(parent.getChildAt(2))

    parent.swapChildren(childB, childB) // should change nothing
    expect(childC).to.equal(parent.getChildAt(0))
    expect(childB).to.equal(parent.getChildAt(1))
    expect(childA).to.equal(parent.getChildAt(2))

    expect(parent.numChildren).to.equal(3)
  })

  it('should have correct size', () => {
    const sprite = new Sprite()

    const quad1 = new Quad(10, 20)
    quad1.x = -10
    quad1.y = -15

    const quad2 = new Quad(15, 25)
    quad2.x = 30
    quad2.y = 25

    sprite.addChild(quad1)
    sprite.addChild(quad2)

    expect(sprite.width).to.be.closeTo(55, E)
    expect(sprite.height).to.be.closeTo(65, E)

    quad1.rotation = Math.PI / 2
    expect(sprite.width).to.be.closeTo(75, E)
    expect(sprite.height).to.be.closeTo(65, E)

    quad1.rotation = Math.PI
    expect(sprite.width).to.be.closeTo(65, E)
    expect(sprite.height).to.be.closeTo(85, E)
  })

  it('should return correct bounds', () => {
    const quad = new Quad(10, 20)
    quad.x = -10
    quad.y = 10
    quad.rotation = Math.PI / 2

    const sprite = new Sprite()
    sprite.addChild(quad)

    let bounds = sprite.bounds
    expect(bounds.x).to.be.closeTo(-30, E)
    expect(bounds.y).to.be.closeTo(10, E)
    expect(bounds.width).to.be.closeTo(20, E)
    expect(bounds.height).to.be.closeTo(10, E)

    bounds = sprite.getBounds(sprite)
    expect(bounds.x).to.be.closeTo(-30, E)
    expect(bounds.y).to.be.closeTo(10, E)
    expect(bounds.width).to.be.closeTo(20, E)
    expect(bounds.height).to.be.closeTo(10, E)
  })

  function addQuadToSprite(sprite) {
    sprite.addChild(new Quad(100, 100))
  }

  it('should return correct bounds in space', () => {
    const root = new Sprite()

    const spriteA = new Sprite()
    spriteA.x = 50
    spriteA.y = 50
    addQuadToSprite(spriteA)
    root.addChild(spriteA)

    const spriteA1 = new Sprite()
    spriteA1.x = 150
    spriteA1.y = 50
    spriteA1.scaleX = spriteA1.scaleY = 0.5
    addQuadToSprite(spriteA1)
    spriteA.addChild(spriteA1)

    const spriteA11 = new Sprite()
    spriteA11.x = 25
    spriteA11.y = 50
    spriteA11.scaleX = spriteA11.scaleY = 0.5
    addQuadToSprite(spriteA11)
    spriteA1.addChild(spriteA11)

    const spriteA2 = new Sprite()
    spriteA2.x = 50
    spriteA2.y = 150
    spriteA2.scaleX = spriteA2.scaleY = 0.5
    addQuadToSprite(spriteA2)
    spriteA.addChild(spriteA2)

    const spriteA21 = new Sprite()
    spriteA21.x = 50
    spriteA21.y = 25
    spriteA21.scaleX = spriteA21.scaleY = 0.5
    addQuadToSprite(spriteA21)
    spriteA2.addChild(spriteA21)

    // ---

    let bounds = spriteA21.getBounds(spriteA11)
    let expectedBounds = new Rectangle(-350, 350, 100, 100)
    Helpers.compareRectangles(bounds, expectedBounds)

    // now rotate as well

    spriteA11.rotation = Math.PI / 4.0
    spriteA21.rotation = Math.PI / -4.0

    bounds = spriteA21.getBounds(spriteA11)
    expectedBounds = new Rectangle(0, 394.974762, 100, 100)
    Helpers.compareRectangles(bounds, expectedBounds)
  })

  it('should return correct bounds when empty', () => {
    const sprite = new Sprite()
    sprite.x = 100
    sprite.y = 200

    const bounds = sprite.bounds
    expect(bounds.x).to.be.closeTo(100, E)
    expect(bounds.y).to.be.closeTo(200, E)
    expect(bounds.width).to.be.closeTo(0, E)
    expect(bounds.height).to.be.closeTo(0, E)
  })

  it('should return correct size', () => {
    const quad1 = new Quad(100, 100)
    const quad2 = new Quad(100, 100)
    quad2.x = quad2.y = 100

    const sprite = new Sprite()
    const childSprite = new Sprite()

    sprite.addChild(childSprite)
    childSprite.addChild(quad1)
    childSprite.addChild(quad2)

    expect(sprite.width).to.be.closeTo(200, E)
    expect(sprite.height).to.be.closeTo(200, E)

    sprite.scaleX = 2.0
    sprite.scaleY = 2.0

    expect(sprite.width).to.be.closeTo(400, E)
    expect(sprite.height).to.be.closeTo(400, E)
  })

  it('should sort children', () => {
    const s1 = new Sprite()
    s1.y = 8
    const s2 = new Sprite()
    s2.y = 3
    const s3 = new Sprite()
    s3.y = 6
    const s4 = new Sprite()
    s4.y = 1

    const parent = new Sprite()
    parent.addChild(s1)
    parent.addChild(s2)
    parent.addChild(s3)
    parent.addChild(s4)

    expect(parent.getChildAt(0)).to.equal(s1)
    expect(parent.getChildAt(1)).to.equal(s2)
    expect(parent.getChildAt(2)).to.equal(s3)
    expect(parent.getChildAt(3)).to.equal(s4)

    parent.sortChildren((child1, child2) => {
      if (child1.y < child2.y) return -1
      else if (child1.y > child2.y) return 1
      else return 0
    })

    expect(parent.getChildAt(0)).to.equal(s4)
    expect(parent.getChildAt(1)).to.equal(s2)
    expect(parent.getChildAt(2)).to.equal(s3)
    expect(parent.getChildAt(3)).to.equal(s1)
  })

  it('should handle adding existing child', () => {
    const stage = new Stage(400, 300)
    const sprite = new Sprite()
    const quad = new Quad(100, 100)
    quad.addEventListener(Event.ADDED, onAdded)
    quad.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage)
    quad.addEventListener(Event.REMOVED, onRemoved)
    quad.addEventListener(Event.REMOVED_FROM_STAGE, onRemovedFromStage)

    stage.addChild(sprite)
    sprite.addChild(quad)
    expect(added).to.equal(1)
    expect(addedToStage).to.equal(1)

    // add same child again
    sprite.addChild(quad)

    // nothing should change, actually.
    expect(sprite.numChildren).to.equal(1)
    expect(sprite.getChildIndex(quad)).to.equal(0)

    // since the parent does not change, no events should be dispatched
    expect(added).to.equal(1)
    expect(addedToStage).to.equal(1)
    expect(removed).to.equal(0)
    expect(removedFromStage).to.equal(0)
  })

  it('should handle REMOVED event', () => {
    const parent = new Sprite()
    const child0 = new Sprite()
    const child1 = new Sprite()
    const child2 = new Sprite()

    parent.addChild(child0)
    parent.addChild(child1)
    parent.addChild(child2)

    // Remove last child, and in its event listener remove first child.
    // That must work, even though the child changes its index in the event handler.

    child2.addEventListener(Event.REMOVED, () => child0.removeFromParent())

    parent.removeChildAt(2)

    expect(child2.parent).to.be.null
    expect(child0.parent).to.be.null
    expect(parent.getChildAt(0)).to.equal(child1)
    expect(parent.numChildren).to.equal(1)
  })

  it('should throw on illegal recursion', () => {
    const sprite1 = new Sprite()
    const sprite2 = new Sprite()
    const sprite3 = new Sprite()

    sprite1.addChild(sprite2)
    sprite2.addChild(sprite3)

    // this should throw an error
    expect(() => sprite3.addChild(sprite1)).to.throw()
  })

  it('should throw when adding child to itself', () => {
    const sprite = new Sprite()
    expect(() => sprite.addChild(sprite)).to.throw()
  })

  it('should fire display list events', () => {
    const stage = new Stage(100, 100)
    const sprite = new Sprite()
    const quad = new Quad(20, 20)

    quad.addEventListener(Event.ADDED, onAdded)
    quad.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage)
    quad.addEventListener(Event.REMOVED, onRemoved)
    quad.addEventListener(Event.REMOVED_FROM_STAGE, onRemovedFromStage)

    stage.addEventListener(Event.ADDED, onAddedChild)
    stage.addEventListener(Event.REMOVED, onRemovedChild)

    sprite.addChild(quad)
    expect(added).to.equal(1)
    expect(removed).to.equal(0)
    expect(addedToStage).to.equal(0)
    expect(removedFromStage).to.equal(0)
    expect(addedChild).to.equal(0)
    expect(removedChild).to.equal(0)

    stage.addChild(sprite)
    expect(added).to.equal(1)
    expect(removed).to.equal(0)
    expect(addedToStage).to.equal(1)
    expect(removedFromStage).to.equal(0)
    expect(addedChild).to.equal(1)
    expect(removedChild).to.equal(0)

    stage.removeChild(sprite)
    expect(added).to.equal(1)
    expect(removed).to.equal(0)
    expect(addedToStage).to.equal(1)
    expect(removedFromStage).to.equal(1)
    expect(addedChild).to.equal(1)
    expect(removedChild).to.equal(1)

    sprite.removeChild(quad)
    expect(added).to.equal(1)
    expect(removed).to.equal(1)
    expect(addedToStage).to.equal(1)
    expect(removedFromStage).to.equal(1)
    expect(addedChild).to.equal(1)
    expect(removedChild).to.equal(1)
  })

  it('should handle removing from stage', () => {
    const stage = new Stage(100, 100)
    const sprite = new Sprite()
    stage.addChild(sprite)
    sprite.addEventListener(Event.REMOVED_FROM_STAGE, onSpriteRemovedFromStage)
    sprite.removeFromParent()
    expect(removedFromStage).to.equal(1)

    function onSpriteRemovedFromStage() {
      // stage should still be accessible in event listener
      expect(sprite.stage).to.not.be.null
      removedFromStage++
    }
  })

  it('should handle repeated removal from stage', () => {
    const stage = new Stage(100, 100)
    const grandParent = new Sprite()
    const parent = new Sprite()
    const child = new Sprite()

    stage.addChild(grandParent)
    grandParent.addChild(parent)
    parent.addChild(child)

    grandParent.addEventListener(
      Event.REMOVED_FROM_STAGE,
      onGrandParentRemovedFromStage
    )
    child.addEventListener(Event.REMOVED_FROM_STAGE, onChildRemovedFromStage)

    // in this set-up, the child could receive the REMOVED_FROM_STAGE event more than
    // once -- which must be avoided. Furthermore, "stage" must always be accessible
    // in such an event handler.

    let childRemovedCount = 0
    grandParent.removeFromParent()

    function onGrandParentRemovedFromStage() {
      parent.removeFromParent()
    }

    function onChildRemovedFromStage() {
      expect(child.stage).to.not.be.null
      expect(childRemovedCount).to.equal(0)

      childRemovedCount++
    }
  })

  const onAdded = () => {
    added++
  }
  const onAddedToStage = () => {
    addedToStage++
  }
  const onAddedChild = () => {
    addedChild++
  }
  const onRemoved = () => {
    removed++
  }
  const onRemovedFromStage = () => {
    removedFromStage++
  }
  const onRemovedChild = () => {
    removedChild++
  }
})
