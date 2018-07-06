/** Event objects are passed as parameters to event listeners when an event occurs.
 *  This is Starling's version of the Flash Event class.
 *
 *  <p>EventDispatchers create instances of this class and send them to registered listeners.
 *  An event object contains information that characterizes an event, most importantly the
 *  event type and if the event bubbles. The target of an event is the object that
 *  dispatched it.</p>
 *
 *  <p>For some event types, this information is sufficient; other events may need additional
 *  information to be carried to the listener. In that case, you can subclass "Event" and add
 *  properties with all the information you require. The "EnterFrameEvent" is an example for
 *  this practice; it adds a property about the time that has passed since the last frame.</p>
 *
 *  <p>Furthermore, the event class contains methods that can stop the event from being
 *  processed by other listeners - either completely or at the next bubble stage.</p>
 *
 *  @see EventDispatcher
 */
export default class Event {
  // todo: make them const (getters only maybe?)
  /** Event type for a display object that is added to a parent. */
  static ADDED = 'added'
  /** Event type for a display object that is added to the stage */
  static ADDED_TO_STAGE = 'addedToStage'
  /** Event type for a display object that is entering a new frame. */
  static ENTER_FRAME = 'enterFrame'
  /** Event type for a display object that is removed from its parent. */
  static REMOVED = 'removed'
  /** Event type for a display object that is removed from the stage. */
  static REMOVED_FROM_STAGE = 'removedFromStage'
  /** Event type for a triggered button. */
  static TRIGGERED = 'triggered'
  /** Event type for a resized Flash Player. */
  static RESIZE = 'resize'
  /** Event type that may be used whenever something finishes. */
  static COMPLETE = 'complete'
  /** Event type for a (re)created stage3D rendering context. */
  static CONTEXT3D_CREATE = 'context3DCreate'
  /** Event type that is dispatched by the Starling instance directly before rendering. */
  static RENDER = 'render'
  /** Event type that indicates that the root DisplayObject has been created. */
  static ROOT_CREATED = 'rootCreated'
  /** Event type for an animated object that requests to be removed from the juggler. */
  static REMOVE_FROM_JUGGLER = 'removeFromJuggler'
  /** Event type that is dispatched by the AssetManager after a context loss. */
  static TEXTURES_RESTORED = 'texturesRestored'
  /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
  static IO_ERROR = 'ioError'
  /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
  static SECURITY_ERROR = 'securityError'
  /** Event type that is dispatched by the AssetManager when an xml or json file couldn't
   *  be parsed. */
  static PARSE_ERROR = 'parseError'
  /** Event type that is dispatched by the Starling instance when it encounters a problem
   *  from which it cannot recover, e.g. a lost device context. */
  static FATAL_ERROR = 'fatalError'

  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static CHANGE = 'change'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static CANCEL = 'cancel'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static SCROLL = 'scroll'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static OPEN = 'open'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static CLOSE = 'close'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static SELECT = 'select'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static READY = 'ready'
  /** An event type to be utilized in custom events. Not used by Starling right now. */
  static UPDATE = 'update'

  static sEventPool = []

  _target
  _currentTarget
  _type
  _bubbles
  _stopsPropagation
  _stopsImmediatePropagation
  _data

  /** Creates an event object that can be passed to listeners. */
  constructor(type, bubbles = false, data = null) {
    this._type = type
    this._bubbles = bubbles
    this._data = data
  }

  /** Prevents listeners at the next bubble stage from receiving the event. */
  stopPropagation() {
    this._stopsPropagation = true
  }

  /** Prevents any other listeners from receiving the event. */
  stopImmediatePropagation() {
    this._stopsPropagation = this._stopsImmediatePropagation = true
  }

  /** Returns a description of the event, containing type and bubble information. */
  toString() {
    return `${this} ${this._type} ${this._bubbles}`
    // todo: make it prettier
    //return StringUtil.format('[{0} type="{1}" bubbles={2}]',
    //    getQualifiedClassName(this).split('::').pop(), _type, _bubbles);
  }

  /** Indicates if event will bubble. */
  get bubbles() {
    return this._bubbles
  }

  /** The object that dispatched the event. */
  get target() {
    return this._target
  }

  /** The object the event is currently bubbling at. */
  get currentTarget() {
    return this._currentTarget
  }

  /** A string that identifies the event. */
  get type() {
    return this._type
  }

  /** Arbitrary data that is attached to the event. */
  get data() {
    return this._data
  }

  // properties for internal use

  /** @private */
  setTarget(value) {
    this._target = value
  }

  /** @private */
  setCurrentTarget(value) {
    this._currentTarget = value
  }

  /** @private */
  setData(value) {
    this._data = value
  }

  /** @private */
  get stopsPropagation() {
    return this._stopsPropagation
  }

  /** @private */
  get stopsImmediatePropagation() {
    return this._stopsImmediatePropagation
  }

  // event pooling

  /** @private */
  static fromPool(type, bubbles = false, data = null) {
    if (Event.sEventPool.length)
      return Event.sEventPool.pop().reset(type, bubbles, data)
    return new Event(type, bubbles, data)
  }

  /** @private */
  static toPool(event) {
    event._data = event._target = event._currentTarget = null
    Event.sEventPool[Event.sEventPool.length] = event // avoiding 'push'
  }

  /** @private */
  reset(type, bubbles = false, data = null) {
    this._type = type
    this._bubbles = bubbles
    this._data = data
    this._target = this._currentTarget = null
    this._stopsPropagation = this._stopsImmediatePropagation = false
    return this
  }
}
