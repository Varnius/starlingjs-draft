import MeshStyle from '../../src/styles/mesh-style'
import Quad from '../../src/display/quad'
import Mesh from '../../src/display/mesh'
import Event from '../../src/events/event'
import EnterFrameEvent from '../../src/events/enter-frame-event'

describe('MeshStyle', () => {
  class MockStyle extends MeshStyle {}

  it('should be assignable', () => {
    const quad0 = new Quad(100, 100)
    const quad1 = new Quad(100, 100)
    const style = new MeshStyle()
    const meshStyleType = new MeshStyle().type

    quad0.style = style
    expect(quad0.style).to.equal(style)
    expect(quad0).to.equal(style.target)

    quad1.style = style
    expect(quad1.style).to.equal(style)
    expect(quad1).to.equal(style.target)
    expect(quad0.style).to.not.equal(style)
    expect(meshStyleType).to.equal(quad0.style.type)

    quad1.style = null
    expect(meshStyleType).to.equal(quad1.style.type)
    expect(style.target).to.be.null
  })

  it('should ENTER_FRAME', () => {
    let eventCount = 0
    const event = new EnterFrameEvent(Event.ENTER_FRAME, 0.1)
    const style = new MeshStyle()
    const quad0 = new Quad(100, 100)
    const quad1 = new Quad(100, 100)

    style.addEventListener(Event.ENTER_FRAME, onEvent)
    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(0)

    quad0.style = style
    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(1)

    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(2)

    quad1.style = style
    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(2)

    quad0.style = style
    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(3)

    style.removeEventListener(Event.ENTER_FRAME, onEvent)
    quad0.dispatchEvent(event)
    expect(eventCount).to.equal(3)

    function onEvent() {
      ++eventCount
    }
  })

  it('should have default style', () => {
    const origStyle = Mesh.defaultStyle
    let quad = new Quad(100, 100)
    expect(quad.style).to.be.instanceOf(origStyle)

    Mesh.defaultStyle = MockStyle

    quad = new Quad(100, 100)
    expect(quad.style).to.be.instanceOf(MockStyle)

    Mesh.defaultStyle = origStyle
  })

  it('should have default style factory', () => {
    let quad
    const origStyle = Mesh.defaultStyle
    const origStyleFactory = Mesh.defaultStyleFactory

    Mesh.defaultStyleFactory = () => new MockStyle()
    quad = new Quad(100, 100)
    expect(quad.style).to.be.instanceOf(MockStyle)

    Mesh.defaultStyleFactory = () => null
    quad = new Quad(100, 100)
    expect(quad.style).to.be.instanceOf(origStyle)

    Mesh.defaultStyleFactory = null
    quad = new Quad(100, 100)
    expect(quad.style).to.be.instanceOf(origStyle)

    Mesh.defaultStyle = origStyle
    Mesh.defaultStyleFactory = origStyleFactory
  })
})
