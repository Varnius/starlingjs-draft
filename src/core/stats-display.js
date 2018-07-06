import Sprite from '../display/sprite'
import TextField from '../text/text-field'
import BitmapFont from '../text/bitmap-font'
import Align from '../utils/align'
import Quad from '../display/quad'
import MeshStyle from '../styles/mesh-style'
import Event from '../events/event'

/** A small, lightweight box that displays the current framerate, memory consumption and
 *  the number of draw calls per frame. The display is updated automatically once per frame. */
export default class StatsDisplay extends Sprite {
  static UPDATE_INTERVAL = 0.5
  static B_TO_MB = 1.0 / (1024 * 1024) // convert from bytes to MB

  _background
  _labels
  _values

  _frameCount = 0
  _totalTime = 0

  _fps = 0
  _memory = 0
  _drawCount = 0
  _skipCount = 0

  /** Creates a new Statistics Box. */
  constructor() {
    super()

    const fontName = BitmapFont.MINI
    const fontSize = BitmapFont.NATIVE_SIZE
    const fontColor = 0xffffff
    const width = 90
    const height = 27
    const labels = 'FPS:\nSTDMEM:\nDRW:'

    this._labels = new TextField(width, height, labels)
    this._labels.format.setTo(fontName, fontSize, fontColor, Align.LEFT)
    this._labels.batchable = true
    this._labels.x = 2

    this._values = new TextField(width - 1, height, '')
    this._values.format.setTo(fontName, fontSize, fontColor, Align.RIGHT)
    this._values.batchable = true

    this._background = new Quad(width, height, 0x0)

    // make sure that rendering takes 2 draw calls
    if (this._background.style.type !== MeshStyle)
      this._background.style = new MeshStyle()
    if (this._labels.style.type !== MeshStyle)
      this._labels.style = new MeshStyle()
    if (this._values.style.type !== MeshStyle)
      this._values.style = new MeshStyle()

    this.addChild(this._background)
    this.addChild(this._labels)
    this.addChild(this._values)

    this.addEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage)
    this.addEventListener(Event.REMOVED_FROM_STAGE, this.onRemovedFromStage)
  }

  onAddedToStage = () => {
    this.addEventListener(Event.ENTER_FRAME, this.onEnterFrame)
    this._totalTime = this._frameCount = this._skipCount = 0
    this.update()
  }

  onRemovedFromStage = () => {
    this.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame)
  }

  onEnterFrame = event => {
    this._totalTime += event.passedTime
    this._frameCount++

    if (this._totalTime > StatsDisplay.UPDATE_INTERVAL) {
      this.update()
      this._frameCount = this._skipCount = this._totalTime = 0
    }
  }

  /** Updates the displayed values. */
  update() {
    this._background.color =
      this._skipCount > this._frameCount / 2 ? 0x003f00 : 0x0
    this._fps = this._totalTime > 0 ? this._frameCount / this._totalTime : 0
    this._memory = window.performance
      ? window.performance.memory.usedJSHeapSize * StatsDisplay.B_TO_MB
      : ''

    const fpsText = this._fps.toFixed(this._fps < 100 ? 1 : 0)
    const memText = this._memory.toFixed(this._memory < 100 ? 1 : 0)
    const drwText = (this._totalTime > 0
      ? this._drawCount - 2
      : this._drawCount
    ).toString() // ignore self

    this._values.text = fpsText + '\n' + memText + '\n' + drwText
  }

  /** Call this once in every frame that can skip rendering because nothing changed. */
  markFrameAsSkipped() {
    this._skipCount += 1
  }

  render(painter) {
    // By calling 'finishQuadBatch' and 'excludeFromCache', we can make sure that the stats
    // display is always rendered with exactly two draw calls. That is taken into account
    // when showing the drawCount value (see 'ignore self' comment above)

    painter.excludeFromCache(this)
    painter.finishMeshBatch()
    super.render(painter)
  }

  /** The number of Stage3D draw calls per second. */
  get drawCount() {
    return this._drawCount
  }

  set drawCount(value) {
    this._drawCount = value
  }

  /** The current frames per second (updated twice per second). */
  get fps() {
    return this._fps
  }

  set fps(value) {
    this._fps = value
  }

  /** The currently used system memory in MB. */
  get memory() {
    return this._memory
  }

  set memory(value) {
    this._memory = value
  }
}
