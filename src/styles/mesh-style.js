import EventDispatcher from '../events/event-dispatcher'
import Point from '../math/point'
import Event from '../events/event'

import MeshEffect from '../rendering/mesh-effect'

import TextureSmoothing from '../textures/texture-smoothing'

/** MeshStyles provide a means to completely modify the way a mesh is rendered.
 *  The base class provides Starling's standard mesh rendering functionality: colored and
 *  (optionally) textured meshes. Subclasses may add support for additional features like
 *  color transformations, normal mapping, etc.
 *
 *  <p><strong>Using styles</strong></p>
 *
 *  <p>First, create an instance of the desired style. Configure the style by updating its
 *  properties, then assign it to the mesh. Here is an example that uses a fictitious
 *  <code>ColorStyle</code>:</p>
 *
 *  <listing>
 *  var image:Image = new Image(heroTexture);
 *  var colorStyle:ColorStyle = new ColorStyle();
 *  colorStyle.redOffset = 0.5;
 *  colorStyle.redMultiplier = 2.0;
 *  image.style = colorStyle;</listing>
 *
 *  <p>Beware:</p>
 *
 *  <ul>
 *    <li>A style instance may only be used on one object at a time.</li>
 *    <li>A style might require the use of a specific vertex format;
 *        when the style is assigned, the mesh is converted to that format.</li>
 *  </ul>
 *
 *  <p><strong>Creating your own styles</strong></p>
 *
 *  <p>To create custom rendering code in Starling, you need to extend two classes:
 *  <code>MeshStyle</code> and <code>MeshEffect</code>. While the effect class contains
 *  the actual AGAL rendering code, the style provides the API that other developers will
 *  interact with.</p>
 *
 *  <p>Subclasses of <code>MeshStyle</code> will add specific properties that configure the
 *  style's outcome, like the <code>redOffset</code> and <code>redMultiplier</code> properties
 *  in the sample above. Here's how to properly create such a class:</p>
 *
 *  <ul>
 *    <li>Always provide a constructor that can be called without any arguments.</li>
 *    <li>Override <code>copyFrom</code> — that's necessary for batching.</li>
 *    <li>Override <code>createEffect</code> — this method must return the
 *        <code>MeshEffect</code> that will do the actual Stage3D rendering.</li>
 *    <li>Override <code>updateEffect</code> — this configures the effect created above
 *        right before rendering.</li>
 *    <li>Override <code>canBatchWith</code> if necessary — this method figures out if one
 *        instance of the style can be batched with another. If they all can, you can leave
 *        this out.</li>
 *  </ul>
 *
 *  <p>If the style requires a custom vertex format, you must also:</p>
 *
 *  <ul>
 *    <li>add a static constant called <code>VERTEX_FORMAT</code> to the class and</li>
 *    <li>override <code>get vertexFormat</code> and let it return exactly that format.</li>
 *  </ul>
 *
 *  <p>When that's done, you can turn to the implementation of your <code>MeshEffect</code>;
 *  the <code>createEffect</code>-override will return an instance of this class.
 *  Directly before rendering begins, Starling will then call <code>updateEffect</code>
 *  to set it up.</p>
 *
 *  @see starling.rendering.MeshEffect
 *  @see starling.rendering.VertexDataFormat
 *  @see starling.display.Mesh
 */
export default class MeshStyle extends EventDispatcher {
  /** The vertex format expected by this style (the same as found in the MeshEffect-class). */
  static VERTEX_FORMAT = MeshEffect.VERTEX_FORMAT

  _type
  _target
  _texture
  _textureBase
  _textureSmoothing
  _textureRepeat
  _vertexData // just a reference to the target's vertex data
  _indexData // just a reference to the target's index data

  // helper objects
  static sPoint = new Point()

  /** Creates a new MeshStyle instance.
   *  Subclasses must provide a constructor that can be called without any arguments. */
  constructor() {
    super()
    this._textureSmoothing = TextureSmoothing.BILINEAR
    this._type = Object(this).constructor
  }

  /** Copies all properties of the given style to the current instance (or a subset, if the
   *  classes don't match). Must be overridden by all subclasses!
   */
  copyFrom(meshStyle) {
    this._texture = meshStyle._texture
    this._textureBase = meshStyle._textureBase
    this._textureRepeat = meshStyle._textureRepeat
    this._textureSmoothing = meshStyle._textureSmoothing
  }

  /** Creates a clone of this instance. The method will work for subclasses automatically,
   *  no need to override it. */
  clone() {
    const clone = new this._type()
    clone.copyFrom(this)
    return clone
  }

  /** Creates the effect that does the actual, low-level rendering.
   *  To be overridden by subclasses!
   */
    createEffect() { // eslint-disable-line
    return new MeshEffect()
  }

  /** Updates the settings of the given effect to match the current style.
   *  The given <code>effect</code> will always match the class returned by
   *  <code>createEffect</code>.
   *
   *  <p>To be overridden by subclasses!</p>
   */
  updateEffect(effect, state) {
    const { _texture, _textureRepeat, _textureSmoothing, _vertexData } = this

    effect.texture = _texture
    effect.textureRepeat = _textureRepeat
    effect.textureSmoothing = _textureSmoothing
    effect.mvpMatrix3D = state.mvpMatrix3D
    effect.alpha = state.alpha
    effect.tinted = _vertexData.tinted
  }

  /** Indicates if the current instance can be batched with the given style.
   *  To be overridden by subclasses if default behavior is not sufficient.
   *  The base implementation just checks if the styles are of the same type
   *  and if the textures are compatible.
   */
  canBatchWith(meshStyle) {
    const {
      _texture,
      _textureRepeat,
      _textureSmoothing,
      _textureBase,
      _type
    } = this

    if (_type === meshStyle._type) {
      const newTexture = meshStyle._texture

      if (!_texture && !newTexture) return true
      else if (_texture && newTexture)
        return (
          _textureBase === meshStyle._textureBase &&
          _textureSmoothing === meshStyle._textureSmoothing &&
          _textureRepeat === meshStyle._textureRepeat
        )
      else return false
    } else return false
  }

  /** Copies the vertex data of the style's current target to the target of another style.
   *  If you pass a matrix, all vertices will be transformed during the process.
   *
   *  <p>This method is used when batching meshes together for rendering. The parameter
   *  <code>targetStyle</code> will point to the style of a <code>MeshBatch</code> (a
   *  subclass of <code>Mesh</code>). Subclasses may override this method if they need
   *  to modify the vertex data in that process.</p>
   */
  batchVertexData(
    targetStyle,
    targetVertexID = 0,
    matrix = null,
    vertexID = 0,
    numVertices = -1
  ) {
    this._vertexData.copyTo(
      targetStyle._vertexData,
      targetVertexID,
      matrix,
      vertexID,
      numVertices
    )
  }

  /** Copies the index data of the style's current target to the target of another style.
   *  The given offset value will be added to all indices during the process.
   *
   *  <p>This method is used when batching meshes together for rendering. The parameter
   *  <code>targetStyle</code> will point to the style of a <code>MeshBatch</code> (a
   *  subclass of <code>Mesh</code>). Subclasses may override this method if they need
   *  to modify the index data in that process.</p>
   */
  batchIndexData(
    targetStyle,
    targetIndexID = 0,
    offset = 0,
    indexID = 0,
    numIndices = -1
  ) {
    this._indexData.copyTo(
      targetStyle._indexData,
      targetIndexID,
      offset,
      indexID,
      numIndices
    )
  }

  /** Call this method if the target needs to be redrawn.
   *  The call is simply forwarded to the target mesh. */
  setRequiresRedraw() {
    if (this._target) this._target.setRequiresRedraw()
  }

  /** Call this method when the vertex data changed.
   *  The call is simply forwarded to the target mesh. */
  setVertexDataChanged() {
    if (this._target) this._target.setVertexDataChanged()
  }

  /** Call this method when the index data changed.
   *  The call is simply forwarded to the target mesh. */
  setIndexDataChanged() {
    if (this._target) this._target.setIndexDataChanged()
  }

  /** Called when assigning a target mesh. Override to plug in class-specific logic. */
    onTargetAssigned(target) { // eslint-disable-line
  }

  // enter frame event

  addEventListener(type, listener) {
    if (type === Event.ENTER_FRAME && this._target)
      this._target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame)

    super.addEventListener(type, listener)
  }

  removeEventListener(type, listener) {
    if (type === Event.ENTER_FRAME && this._target)
      this._target.removeEventListener(type, this.onEnterFrame)

    super.removeEventListener(type, listener)
  }

  onEnterFrame = event => this.dispatchEvent(event)

  // internal methods

  /** @private */
  setTarget(target = null, vertexData = null, indexData = null) {
    const { _target } = this

    if (_target !== target) {
      if (_target)
        _target.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame)
      if (vertexData) vertexData.format = this.vertexFormat

      this._target = target
      this._vertexData = vertexData
      this._indexData = indexData

      if (target) {
        if (this.hasEventListener(Event.ENTER_FRAME))
          target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame)

        this.onTargetAssigned(target)
      }
    }
  }

  // vertex manipulation

  /** The position of the vertex at the specified index, in the mesh's local coordinate
   *  system.
   *
   *  <p>Only modify the position of a vertex if you know exactly what you're doing, as
   *  some classes might not work correctly when their vertices are moved. E.g. the
   *  <code>Quad</code> class expects its vertices to spawn up a perfectly rectangular
   *  area; some of its optimized methods won't work correctly if that premise is no longer
   *  fulfilled or the original bounds change.</p>
   */
  getVertexPosition(vertexID, out = null) {
    return this._vertexData.getPoint(vertexID, 'position', out)
  }

  setVertexPosition(vertexID, x, y) {
    this._vertexData.setPoint(vertexID, 'position', x, y)
    this.setVertexDataChanged()
  }

  /** Returns the alpha value of the vertex at the specified index. */
  getVertexAlpha(vertexID) {
    return this._vertexData.getAlpha(vertexID)
  }

  /** Sets the alpha value of the vertex at the specified index to a certain value. */
  setVertexAlpha(vertexID, alpha) {
    this._vertexData.setAlpha(vertexID, 'color', alpha)
    this.setVertexDataChanged()
  }

  /** Returns the RGB color of the vertex at the specified index. */
  getVertexColor(vertexID) {
    return this._vertexData.getColor(vertexID)
  }

  /** Sets the RGB color of the vertex at the specified index to a certain value. */
  setVertexColor(vertexID, color) {
    this._vertexData.setColor(vertexID, 'color', color)
    this.setVertexDataChanged()
  }

  /** Returns the texture coordinates of the vertex at the specified index. */
  getTexCoords(vertexID, out = null) {
    if (this._texture)
      return this._texture.getTexCoords(
        this._vertexData,
        vertexID,
        'texCoords',
        out
      )
    else return this._vertexData.getPoint(vertexID, 'texCoords', out)
  }

  /** Sets the texture coordinates of the vertex at the specified index to the given values. */
  setTexCoords(vertexID, u, v) {
    if (this._texture)
      this._texture.setTexCoords(this._vertexData, vertexID, 'texCoords', u, v)
    else this._vertexData.setPoint(vertexID, 'texCoords', u, v)

    this.setVertexDataChanged()
  }

  // properties

  /** Returns a reference to the vertex data of the assigned target (or <code>null</code>
   *  if there is no target). Beware: the style itself does not own any vertices;
   *  it is limited to manipulating those of the target mesh. */
  get vertexData() {
    return this._vertexData
  }

  /** Returns a reference to the index data of the assigned target (or <code>null</code>
   *  if there is no target). Beware: the style itself does not own any indices;
   *  it is limited to manipulating those of the target mesh. */
  get indexData() {
    return this._indexData
  }

  /** The actual class of this style. */
  get type() {
    return this._type
  }

  /** Changes the color of all vertices to the same value.
   *  The getter simply returns the color of the first vertex. */
  get color() {
    if (this._vertexData.numVertices > 0) return this._vertexData.getColor(0)
    else return 0x0
  }

  set color(value) {
    let i
    const numVertices = this._vertexData.numVertices

    for (i = 0; i < numVertices; ++i)
      this._vertexData.setColor(i, 'color', value)

    if (value === 0xffffff && this._vertexData.tinted)
      this.vertexData.updateTinted()

    this.setVertexDataChanged()
  }

  /** The format used to store the vertices. */
    get vertexFormat() { // eslint-disable-line
    return MeshStyle.VERTEX_FORMAT
  }

  /** The texture that is mapped to the mesh (or <code>null</code>, if there is none). */
  get texture() {
    return this._texture
  }

  set texture(value) {
    if (value !== this._texture) {
      if (value) {
        let i
        const numVertices = this._vertexData ? this._vertexData.numVertices : 0

        for (i = 0; i < numVertices; ++i) {
          this.getTexCoords(i, MeshStyle.sPoint)
          value.setTexCoords(
            this._vertexData,
            i,
            'texCoords',
            MeshStyle.sPoint.x,
            MeshStyle.sPoint.y
          )
        }

        this.setVertexDataChanged()
      } else this.setRequiresRedraw()

      this._texture = value
      this._textureBase = value ? value.base : null
    }
  }

  /** The smoothing filter that is used for the texture. @default bilinear */
  get textureSmoothing() {
    return this._textureSmoothing
  }

  set textureSmoothing(value) {
    if (value !== this._textureSmoothing) {
      this._textureSmoothing = value
      this.setRequiresRedraw()
    }
  }

  /** Indicates if pixels at the edges will be repeated or clamped.
   *  Only works for power-of-two textures. @default false */
  get textureRepeat() {
    return this._textureRepeat
  }

  set textureRepeat(value) {
    this._textureRepeat = value
  }

  /** The target the style is currently assigned to. */
  get target() {
    return this._target
  }
}
