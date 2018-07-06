import Tween from '../../src/animation/tween'
import Transitions from '../../src/animation/transitions'
import Juggler from '../../src/animation/juggler'
import Quad from '../../src/display/quad'
import deg2rad from '../../src/utils/deg2rad'

describe('Tween', () => {
  const E = 0.0001

  it('should allow basic tweens', () => {
    const startX = 10.0
    const startY = 20.0
    const endX = 100.0
    const endY = 200.0
    const startAlpha = 1.0
    const endAlpha = 0.0
    const totalTime = 2.0

    let startCount = 0
    let updateCount = 0
    let completeCount = 0

    const quad = new Quad(100, 100)
    quad.x = startX
    quad.y = startY
    quad.alpha = startAlpha

    const tween = new Tween(quad, totalTime, Transitions.LINEAR)
    tween.moveTo(endX, endY)
    tween.animate('alpha', endAlpha)
    tween.onStart = function() {
      startCount++
    }
    tween.onUpdate = function() {
      updateCount++
    }
    tween.onComplete = function() {
      completeCount++
    }

    tween.advanceTime(totalTime / 3.0)
    expect(quad.x).to.be.closeTo(startX + (endX - startX) / 3.0, E)
    expect(quad.y).to.be.closeTo(startY + (endY - startY) / 3.0, E)
    expect(quad.alpha).to.be.closeTo(
      startAlpha + (endAlpha - startAlpha) / 3.0,
      E
    )
    expect(startCount).to.equal(1)
    expect(updateCount).to.equal(1)
    expect(completeCount).to.equal(0)
    expect(tween.isComplete).to.be.false

    tween.advanceTime(totalTime / 3.0)
    expect(quad.x).to.be.closeTo(startX + (2 * (endX - startX)) / 3.0, E)
    expect(quad.y).to.be.closeTo(startY + (2 * (endY - startY)) / 3.0, E)
    expect(quad.alpha).to.be.closeTo(
      startAlpha + (2 * (endAlpha - startAlpha)) / 3.0,
      E
    )
    expect(startCount).to.equal(1)
    expect(updateCount).to.equal(2)
    expect(completeCount).to.equal(0)
    expect(tween.isComplete).to.be.false

    tween.advanceTime(totalTime / 3.0)
    expect(quad.x).to.be.closeTo(endX, E)
    expect(quad.y).to.be.closeTo(endY, E)
    expect(quad.alpha).to.be.closeTo(endAlpha, E)
    expect(startCount).to.equal(1)
    expect(updateCount).to.equal(3)
    expect(completeCount).to.equal(1)
    expect(tween.isComplete).to.be.true
  })

  it('should allow sequential tweens', () => {
    const startPos = 0.0
    const targetPos = 50.0
    const quad = new Quad(100, 100)

    // 2 tweens should move object up, then down
    const tween1 = new Tween(quad, 1.0)
    tween1.animate('y', targetPos)

    const tween2 = new Tween(quad, 1.0)
    tween2.animate('y', startPos)
    tween2.delay = tween1.totalTime

    tween1.advanceTime(1.0)
    expect(quad.y).to.be.closeTo(targetPos, E)

    tween2.advanceTime(1.0)
    expect(quad.y).to.be.closeTo(targetPos, E)

    tween2.advanceTime(0.5)
    expect(quad.y).to.be.closeTo((targetPos - startPos) / 2.0, E)

    tween2.advanceTime(0.5)
    expect(quad.y).to.be.closeTo(startPos, E)
  })

  it('should allow tweens from zero', () => {
    const quad = new Quad(100, 100)
    quad.scaleX = 0.0

    const tween = new Tween(quad, 1.0)
    tween.animate('scaleX', 1.0)

    tween.advanceTime(0.0)
    expect(quad.width).to.be.closeTo(0.0, E)

    tween.advanceTime(0.5)
    expect(quad.width).to.be.closeTo(50.0, E)

    tween.advanceTime(0.5)
    expect(quad.width).to.be.closeTo(100.0, E)
  })

  it('should allow to reset tween', () => {
    const quad = new Quad(100, 100)

    const tween = new Tween(quad, 1.0)
    tween.animate('x', 100)

    tween.advanceTime(0.5)
    expect(quad.x).to.be.closeTo(50, E)

    tween.reset(this, 1.0)
    tween.advanceTime(0.5)

    // tween should no longer change quad.x
    expect(quad.x).to.be.closeTo(50, E)
  })

  it('should allow to reset tween in onComplete', () => {
    const quad = new Quad(100, 100)
    const juggler = new Juggler()

    const tween = new Tween(quad, 1.0)
    tween.animate('x', 100)
    tween.onComplete = function() {
      tween.reset(quad, 1.0)
      tween.animate('x', 0)
      juggler.add(tween)
    }

    juggler.add(tween)

    juggler.advanceTime(1.1)
    expect(quad.x).to.be.closeTo(100, E)
    expect(tween.currentTime).to.be.closeTo(0, E)

    juggler.advanceTime(1.0)
    expect(quad.x).to.be.closeTo(0, E)
    expect(tween.isComplete).to.be.true
  })

  it('should allow short tweens', () => {
    executeTween(0.1, 0.1)
  })

  it('should allow zero tweens', () => {
    executeTween(0.0, 0.1)
  })

  it('should allow custom', () => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0, transition)
    tween.animate('x', 100)

    tween.advanceTime(0.1)
    expect(quad.x).to.be.closeTo(10, E)

    tween.advanceTime(0.5)
    expect(quad.x).to.be.closeTo(60, E)

    tween.advanceTime(0.4)
    expect(quad.x).to.be.closeTo(100, E)

    expect(tween.transition).to.equal('custom')

    function transition(ratio) {
      return ratio
    }
  })

  it('should allow repeated', () => {
    let startCount = 0
    let repeatCount = 0
    let completeCount = 0

    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0)
    tween.repeatCount = 3
    tween.onStart = onStart
    tween.onRepeat = onRepeat
    tween.onComplete = onComplete
    tween.animate('x', 100)

    tween.advanceTime(1.5)
    expect(quad.x).to.be.closeTo(50, E)
    expect(2).to.equal(tween.repeatCount)
    expect(1).to.equal(startCount)
    expect(1).to.equal(repeatCount)
    expect(0).to.equal(completeCount)

    tween.advanceTime(0.75)
    expect(quad.x).to.be.closeTo(25, E)
    expect(1).to.equal(tween.repeatCount)
    expect(1).to.equal(startCount)
    expect(2).to.equal(repeatCount)
    expect(0).to.equal(completeCount)
    expect(tween.isComplete).to.be.false

    tween.advanceTime(1.0)
    expect(quad.x).to.be.closeTo(100, E)
    expect(1).to.equal(tween.repeatCount)
    expect(1).to.equal(startCount)
    expect(2).to.equal(repeatCount)
    expect(1).to.equal(completeCount)
    expect(tween.isComplete).to.be.true

    function onStart() {
      startCount++
    }

    function onRepeat() {
      repeatCount++
    }

    function onComplete() {
      completeCount++
    }
  })

  it('should allow reverse tweens', () => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0)
    tween.repeatCount = 4
    tween.reverse = true
    tween.animate('x', 100)

    tween.advanceTime(0.75)
    expect(quad.x).to.be.closeTo(75, E)

    tween.advanceTime(0.5)
    expect(quad.x).to.be.closeTo(75, E)

    tween.advanceTime(0.5)
    expect(quad.x).to.be.closeTo(25, E)
    expect(tween.isComplete).to.be.false

    tween.advanceTime(1.25)
    expect(quad.x).to.be.closeTo(100, E)
    expect(tween.isComplete).to.be.false

    tween.advanceTime(10)
    expect(quad.x).to.be.closeTo(0, E)
    expect(tween.isComplete).to.be.true
  })

  it('should allow infinite tweens', () => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0)
    tween.animate('x', 100)
    tween.repeatCount = 0

    tween.advanceTime(30.5)
    expect(quad.x).to.be.closeTo(50, E)

    tween.advanceTime(100.5)
    expect(quad.x).to.be.closeTo(100, E)
    expect(tween.isComplete).to.be.false
  })

  it('should allow to get end value', () => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0)
    tween.animate('x', 100)
    tween.fadeTo(0)
    tween.scaleTo(1.5)

    expect(tween.getEndValue('x')).to.equal(100)
    expect(tween.getEndValue('alpha')).to.equal(0)
    expect(tween.getEndValue('scaleX')).to.equal(1.5)
    expect(tween.getEndValue('scaleY')).to.equal(1.5)
  })

  it('should report progress', () => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, 1.0, easeIn)
    expect(tween.progress).to.equal(0.0)

    tween.advanceTime(0.5)
    expect(tween.progress).to.be.closeTo(easeIn(0.5), E)

    tween.advanceTime(0.25)
    expect(tween.progress).to.be.closeTo(easeIn(0.75), E)

    tween.advanceTime(1.0)
    expect(tween.progress).to.be.closeTo(easeIn(1.0), E)

    function easeIn(ratio) {
      return ratio * ratio * ratio
    }
  })

  it('should allow to tween color', () => {
    const quad = new Quad(100, 100, 0xff00ff)
    const tween = new Tween(quad, 1.0)
    tween.animate('color', 0x00ff00)
    tween.advanceTime(0.5)
    expect(0x7f7f7f).to.equal(quad.color)
  })

  it('should allow to tween rotation', () => {
    const quad = new Quad(100, 100)
    quad.rotation = deg2rad(-170)

    const tween = new Tween(quad, 1.0)
    tween.rotateTo(deg2rad(170))
    tween.advanceTime(0.5)

    expect(quad.rotation).to.be.closeTo(-Math.PI, E)

    tween.advanceTime(0.5)
    expect(quad.rotation).to.be.closeTo(deg2rad(170), E)
  })

  it('should report animated properties', () => {
    const quad = new Quad()
    const tween = new Tween(quad, 1.0)
    tween.animate('x', 5.0)
    tween.animate('rotation', 0.5)

    expect(tween.animatesProperty('x')).to.be.true
    expect(tween.animatesProperty('rotation')).to.be.true
    expect(tween.animatesProperty('y')).to.be.false
    expect(tween.animatesProperty('alpha')).to.be.false
  })

  const executeTween = (time, advanceTime) => {
    const quad = new Quad(100, 100)
    const tween = new Tween(quad, time)
    tween.animate('x', 100)

    let startCount = 0
    let updateCount = 0
    let completeCount = 0

    tween.onStart = function() {
      startCount++
    }
    tween.onUpdate = function() {
      updateCount++
    }
    tween.onComplete = function() {
      completeCount++
    }

    tween.advanceTime(advanceTime)

    expect(updateCount).to.equal(1)
    expect(startCount).to.equal(1)
    expect(completeCount).to.equal(advanceTime >= time ? 1 : 0)
  }
})
