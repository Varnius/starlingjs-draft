import Color from '../utils/color'
import Texture from './texture'

/** A ConcreteTexture wraps a Stage3D texture object, storing the properties of the texture
 *  and providing utility methods for data upload, etc.
 *
 *  <p>This class cannot be instantiated directly; create instances using
 *  <code>Texture.fromTextureBase</code> instead. However, that's only necessary when
 *  you need to wrap a <code>TextureBase</code> object in a Starling texture;
 *  the preferred way of creating textures is to use one of the other
 *  <code>Texture.from...</code> factory methods in the <code>Texture</code> class.</p>
 *
 *  @see Texture
 */
export default class ConcreteTexture extends Texture {
  _base
  _format
  _width
  _height
  _mipMapping
  _premultipliedAlpha
  _scale
  _onRestore
  _dataUploaded
  _textureReadyCallback

  static sAsyncUploadEnabled = false

  /** @private
   *
   *  Creates a ConcreteTexture object from a TextureBase, storing information about size,
   *  mip-mapping, and if the channels contain premultiplied alpha values. May only be
   *  called from subclasses.
   *
   *  <p>Note that <code>width</code> and <code>height</code> are expected in pixels,
   *  i.e. they do not take the scale factor into account.</p>
   */
  constructor(
    base,
    format,
    width,
    height,
    mipMapping,
    premultipliedAlpha,
    scale = 1
  ) {
    //if (Capabilities.isDebugger &&
    //    getQualifiedClassName(this) == "starling.textures::ConcreteTexture")
    //{
    //    throw new AbstractClassError();
    //}

    super()

    this._scale = scale <= 0 ? 1.0 : scale
    this._base = base
    this._format = format
    this._width = width
    this._height = height
    this._mipMapping = mipMapping
    this._premultipliedAlpha = premultipliedAlpha
    this._onRestore = null
    this._dataUploaded = false
  }

  /** Disposes the TextureBase object. */
  dispose() {
    const gl = window.StarlingContextManager.current.context
    if (this._base) gl.deleteTexture(this._base)

    this.onRestore = null // removes event listener
    super.dispose()
  }

  // texture data upload

  /** Uploads bitmap data to the texture. The existing contents will be replaced.
   *  If the size of the bitmap does not match the size of the texture, the bitmap will be
   *  cropped or filled up with transparent pixels.
   *
   *  <p>Pass a callback function or <code>true</code> to attempt asynchronous texture upload.
   *  If the current platform or runtime version does not support asynchronous texture loading,
   *  the callback will still be executed.</p>
   *
   *  <p>This is the expected function definition:
   *  <code>function(texture, error:ErrorEvent);</code>
   *  The second parameter is optional and typically <code>null</code>.</p>
   */
  uploadBitmapData(data) {
    this.upload(data)
    this.setDataUploaded()
  }

  /** Specifies a video stream to be rendered within the texture. */
  //attachNetStream(netStream, onComplete = null)
  //{
  //    this.attachVideo("NetStream", netStream, onComplete);
  //}

  /** Specifies a video stream from a camera to be rendered within the texture. */
  //attachCamera(camera:Camera, onComplete = null)
  //{
  //    this.attachVideo("Camera", camera, onComplete);
  //}

  /** @private */
  //attachVideo(type, attachment, onComplete = null)
  //{
  //    throw new NotSupportedError();
  //}

  // texture backup (context loss)

  //onContextCreated()
  //{
  //    this._dataUploaded = false;
  //    this._base = this.createBase();      // recreate the underlying texture
  //    execute(_onRestore, this); // restore contents
  //
  //    // if no texture has been uploaded above, we init the texture with transparent pixels.
  //    if (!_dataUploaded) clear();
  //}

  /** Recreates the underlying Stage3D texture object with the same dimensions and attributes
   *  as the one that was passed to the constructor. You have to upload new data before the
   *  texture becomes usable again. Beware: this method does <strong>not</strong> dispose
   *  the current base. */
  createBase() {
    //return Starling.context.createRectangleTexture(
    //    nativeWidth, nativeHeight, format, optimizedForRenderTexture);
  }

  upload(source) {
    this.base.uploadFromBitmapData(source)
  }

  /** Recreates the underlying Stage3D texture. May be used to manually restore a texture.
   *  Beware that new data needs to be uploaded to the texture before it can be used. */
  recreateBase() {
    this._base = this.createBase()
  }

  /** Clears the texture with a certain color and alpha value. The previous contents of the
   *  texture is wiped out. */
  clear(color = 0x0, alpha = 0.0) {
    if (this._premultipliedAlpha && alpha < 1.0)
      color = Color.rgb(
        Color.getRed(color) * alpha,
        Color.getGreen(color) * alpha,
        Color.getBlue(color) * alpha
      )

    const painter = window.StarlingContextManager.current.painter

    painter.pushState()
    painter.state.renderTarget = this
    painter.clear(color, alpha)
    painter.popState()

    this.setDataUploaded()
  }

  /** Notifies the instance that the base texture may now be used for rendering. */
  setDataUploaded() {
    this._dataUploaded = true
  }

  // properties

  /** @inheritDoc */
  get base() {
    return this._base
  }

  /** @inheritDoc */
  get root() {
    return this
  }

  /** @inheritDoc */
  get format() {
    return this._format
  }

  /** @inheritDoc */
  get width() {
    return this._width / this._scale
  }

  /** @inheritDoc */
  get height() {
    return this._height / this._scale
  }

  /** @inheritDoc */
  get nativeWidth() {
    return this._width
  }

  /** @inheritDoc */
  get nativeHeight() {
    return this._height
  }

  /** @inheritDoc */
  get scale() {
    return this._scale
  }

  /** @inheritDoc */
  get mipMapping() {
    return this._mipMapping
  }

  /** @inheritDoc */
  get premultipliedAlpha() {
    return this._premultipliedAlpha
  }
}
