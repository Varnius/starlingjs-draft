import DisplayObjectContainer from './display-object-container'
import Rectangle from '../math/rectangle'
import Matrix from '../math/matrix'
import Matrix3D from '../math/matrix3d'
import Point from '../math/point'
import Vector3D from '../math/vector3d'
import MatrixUtil from '../utils/matrix-util'
import Event from '../events/event'

import RectangleUtil from '../utils/rectangle-util'

import EnterFrameEvent from '../events/enter-frame-event'

/** A Stage represents the root of the display tree.
 *  Only objects that are direct or indirect children of the stage will be rendered.
 *
 *  <p>This class represents the Starling version of the stage. Don't confuse it with its
 *  Flash equivalent: while the latter contains objects of the type
 *  <code>flash.display.DisplayObject</code>, the Starling stage contains only objects of the
 *  type <code>starling.display.DisplayObject</code>. Those classes are not compatible, and
 *  you cannot exchange one type with the other.</p>
 *
 *  <p>A stage object is created automatically by the <code>Starling</code> class. Don't
 *  create a Stage instance manually.</p>
 *
 *  <strong>Keyboard Events</strong>
 *
 *  <p>In Starling, keyboard events are only dispatched at the stage. Add an event listener
 *  directly to the stage to be notified of keyboard events.</p>
 *
 *  <strong>Resize Events</strong>
 *
 *  <p>When the Flash player is resized, the stage dispatches a <code>ResizeEvent</code>. The
 *  event contains properties containing the updated width and height of the Flash player.</p>
 *
 *  @see starling.events.KeyboardEvent
 *  @see starling.events.ResizeEvent
 *
 */
export default class Stage extends DisplayObjectContainer {
  _width
  _height
  _color
  _fieldOfView
  _projectionOffset
  _cameraPosition
  _enterFrameEvent
  _enterFrameListeners

  // helper objects
  static sMatrix = new Matrix()
  static sMatrix3D = new Matrix3D()

  /** @private */
  constructor(width, height, color = 0) {
    super()

    this._width = width
    this._height = height
    this._color = color
    this._fieldOfView = 1.0
    this._projectionOffset = new Point()
    this._cameraPosition = new Vector3D()
    this._enterFrameEvent = new EnterFrameEvent(Event.ENTER_FRAME, 0.0)
    this._enterFrameListeners = []
  }

  /** @inheritDoc */
  advanceTime(passedTime) {
    this._enterFrameEvent.reset(Event.ENTER_FRAME, false, passedTime)
    this.broadcastEvent(this._enterFrameEvent)
  }

  /** Returns the object that is found topmost beneath a point in stage coordinates, or
   *  the stage itself if nothing else is found. */
  hitTest(localPoint) {
    if (!this.visible || !this.touchable) return null

    // locations outside of the stage area shouldn't be accepted
    if (
      localPoint.x < 0 ||
      localPoint.x > this._width ||
      localPoint.y < 0 ||
      localPoint.y > this._height
    )
      return null

    // if nothing else is hit, the stage returns itself as target
    const target = super.hitTest(localPoint)
        return target ? target : this; // eslint-disable-line
  }

  /** Draws the complete stage into a BitmapData object.
   *
   *  <p>If you encounter problems with transparency, start Starling in BASELINE profile
   *  (or higher). BASELINE_CONSTRAINED might not support transparency on all platforms.
   *  </p>
   *
   *  @param destination  If you pass null, the object will be created for you.
   *                      If you pass a BitmapData object, it should have the size of the
   *                      back buffer (which is accessible via the respective properties
   *                      on the Starling instance).
   *  @param transparent  If enabled, empty areas will appear transparent; otherwise, they
   *                      will be filled with the stage color.
   */
  //drawToBitmapData(destination = null, transparent = true)
  //{
  //    var painter = Starling.painter;
  //    var state = painter.state;
  //    var context = painter.context;
  //
  //    if (destination === null)
  //    {
  //        var width  = context.backBufferWidth;
  //        var height = context.backBufferHeight;
  //        destination = new BitmapData(width, height, transparent);
  //    }
  //
  //    painter.pushState();
  //    state.renderTarget = null;
  //    state.setProjectionMatrix(0, 0, this._width, this._height, this._width, this._height, this.cameraPosition);
  //
  //    if (transparent) painter.clear();
  //    else             painter.clear(_color, 1);
  //
  //    render(painter);
  //    painter.finishMeshBatch();
  //
  //    context.drawToBitmapData(destination);
  //    context.present(); // required on some platforms to avoid flickering
  //
  //    painter.popState();
  //    return destination;
  //}

  /** Returns the stage bounds (i.e. not the bounds of its contents, but the rectangle
   *  spawned up by 'stageWidth' and 'stageHeight') in another coordinate system. */
  getStageBounds(targetSpace, out = null) {
    if (!out) out = new Rectangle()

    out.setTo(0, 0, this._width, this._height)
    this.getTransformationMatrix(targetSpace, Stage.sMatrix)

    return RectangleUtil.getBounds(out, Stage.sMatrix, out)
  }

  // camera positioning

  /** Returns the position of the camera within the local coordinate system of a certain
   *  display object. If you do not pass a space, the method returns the global position.
   *  To change the position of the camera, you can modify the properties 'fieldOfView',
   *  'focalDistance' and 'projectionOffset'.
   */
  getCameraPosition(space = null, out = null) {
    this.getTransformationMatrix3D(space, Stage.sMatrix3D)
    return MatrixUtil.transformCoords3D(
      Stage.sMatrix3D,
      this._width / 2 + this._projectionOffset.x,
      this._height / 2 + this._projectionOffset.y,
      -this.focalLength,
      out
    )
  }

  // enter frame event optimization

  /** @private */
  addEnterFrameListener(listener) {
    const index = this._enterFrameListeners.indexOf(listener)
    if (index < 0)
      this._enterFrameListeners[this._enterFrameListeners.length] = listener
  }

  /** @private */
  removeEnterFrameListener(listener) {
    const index = this._enterFrameListeners.indexOf(listener)
    if (index >= 0) this._enterFrameListeners.splice(index, 1)
  }

  /** @private */
  getChildEventListeners(object, eventType, listeners) {
    if (eventType === Event.ENTER_FRAME && object === this) {
      for (
        let i = 0, length = this._enterFrameListeners.length;
        i < length;
        ++i
      )
        listeners[listeners.length] = this._enterFrameListeners[i] // avoiding 'push'
    } else super.getChildEventListeners(object, eventType, listeners)
  }

  // properties

  ///** @private */
  //set width(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot set width of stage');
  //}
  //
  ///** @private */
  //set height(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot set height of stage');
  //}
  //
  ///** @private */
  //set x(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot set x-coordinate of stage');
  //}
  //
  ///** @private */
  //set y(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot set y-coordinate of stage');
  //}
  //
  ///** @private */
  //set scaleX(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot scale stage');
  //}
  //
  ///** @private */
  //set scaleY(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot scale stage');
  //}
  //
  ///** @private */
  //set rotation(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot rotate stage');
  //}
  //
  ///** @private */
  //set skewX(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot skew stage');
  //}
  //
  ///** @private */
  //set skewY(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot skew stage');
  //}
  //
  ///** @private */
  //set filter(value)
  //{
  //    throw new Error('[IllegalOperationError] Cannot add filter to stage. Add it to `root` instead!');
  //}

  /** The background color of the stage. */
  get color() {
    return this._color
  }

  set color(value) {
    this._color = value
  }

  /** The width of the stage coordinate system. Change it to scale its contents relative
   *  to the <code>viewPort</code> property of the Starling object. */
  get stageWidth() {
    return this._width
  }

  set stageWidth(value) {
    this._width = value
    this.setRequiresRedraw()
  }

  /** The height of the stage coordinate system. Change it to scale its contents relative
   *  to the <code>viewPort</code> property of the Starling object. */
  get stageHeight() {
    return this._height
  }

  set stageHeight(value) {
    this._height = value
    this.setRequiresRedraw()
  }

  /** The Starling instance this stage belongs to. */
  // todo: implement Starling class
  //get starling()
  //{
  //    const instances = Starling.all;
  //    const numInstances = instances.length;
  //
  //    for (let i = 0; i < numInstances; ++i)
  //        if (instances[i].stage === this) return instances[i];
  //
  //    return null;
  //}

  /** The distance between the stage and the camera. Changing this value will update the
   *  field of view accordingly. */
  get focalLength() {
    return this._width / (2 * Math.tan(this._fieldOfView / 2))
  }

  set focalLength(value) {
    this._fieldOfView = 2 * Math.atan(this.stageWidth / (2 * value))
  }

  /** Specifies an angle (radian, between zero and PI) for the field of view. This value
   *  determines how strong the perspective transformation and distortion apply to a Sprite3D
   *  object.
   *
   *  <p>A value close to zero will look similar to an orthographic projection; a value
   *  close to PI results in a fisheye lens effect. If the field of view is set to 0 or PI,
   *  nothing is seen on the screen.</p>
   *
   *  @default 1.0
   */
  get fieldOfView() {
    return this._fieldOfView
  }

  set fieldOfView(value) {
    this._fieldOfView = value
  }

  /** A vector that moves the camera away from its default position in the center of the
   *  stage. Use this property to change the center of projection, i.e. the vanishing
   *  point for 3D display objects. <p>CAUTION: not a copy, but the actual object!</p>
   */
  get projectionOffset() {
    return this._projectionOffset
  }

  set projectionOffset(value) {
    this._projectionOffset.setTo(value.x, value.y)
  }

  /** The global position of the camera. This property can only be used to find out the
   *  current position, but not to modify it. For that, use the 'projectionOffset',
   *  'fieldOfView' and 'focalLength' properties. If you need the camera position in
   *  a certain coordinate space, use 'getCameraPosition' instead.
   *
   *  <p>CAUTION: not a copy, but the actual object!</p>
   */
  get cameraPosition() {
    return this.getCameraPosition(null, this._cameraPosition)
  }
}
