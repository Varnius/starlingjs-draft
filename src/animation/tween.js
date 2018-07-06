import SystemUtil from '../utils/system-util'
import EventDispatcher from '../events/event-dispatcher'
import Event from '../events/event'
import Color from '../utils/color'
import Transitions from './transitions'

/** A Tween animates numeric properties of objects. It uses different transition functions
 *  to give the animations various styles.
 *
 *  <p>The primary use of this class is to do standard animations like movement, fading,
 *  rotation, etc. But there are no limits on what to animate; as long as the property you want
 *  to animate is numeric (<code>int, uint, Number</code>), the tween can handle it. For a list
 *  of available Transition types, look at the "Transitions" class.</p>
 *
 *  <p>Here is an example of a tween that moves an object to the right, rotates it, and
 *  fades it out:</p>
 *
 *  <listing>
 *  var tween = new Tween(object, 2.0, Transitions.EASE_IN_OUT);
 *  tween.animate('x', object.x + 50);
 *  tween.animate('rotation', deg2rad(45));
 *  tween.fadeTo(0);    // equivalent to 'animate('alpha', 0)'
 *  Starling.juggler.add(tween);</listing>
 *
 *  <p>Note that the object is added to a juggler at the end of this sample. That's because a
 *  tween will only be executed if its 'advanceTime' method is executed regularly - the
 *  juggler will do that for you, and will remove the tween when it is finished.</p>
 *
 *  @see Juggler
 *  @see Transitions
 */
export default class Tween extends EventDispatcher {
  static HINT_MARKER = '#'

  _target
  _transitionFunc
  _transitionName

  _properties
  _startValues
  _endValues
  _updateFuncs

  _onStart
  _onUpdate
  _onRepeat
  _onComplete

  _onStartArgs
  _onUpdateArgs
  _onRepeatArgs
  _onCompleteArgs

  _totalTime
  _currentTime
  _progress
  _delay
  _roundToInt
  _nextTween
  _repeatCount
  _repeatDelay
  _reverse
  _currentCycle

  /** Creates a tween with a target, duration (in seconds) and a transition function.
   *  @param target the object that you want to animate
   *  @param time the duration of the Tween (in seconds)
   *  @param transition can be either a String (e.g. one of the constants defined in the
   *         Transitions class) or a function. Look up the 'Transitions' class for a
   *         documentation about the required function signature. */
  constructor(target, time, transition = 'linear') {
    super()
    this.reset(target, time, transition)
  }

  /** Resets the tween to its default values. Useful for pooling tweens. */
  reset(target, time, transition = 'linear') {
    this._target = target
    this._currentTime = 0.0
    this._totalTime = Math.max(0.0001, time)
    this._progress = 0.0
    this._delay = this._repeatDelay = 0.0
    this._onStart = this._onUpdate = this._onRepeat = this._onComplete = null
    this._onStartArgs = this._onUpdateArgs = this._onRepeatArgs = this._onCompleteArgs = null
    this._roundToInt = this._reverse = false
    this._repeatCount = 1
    this._currentCycle = -1
    this._nextTween = null

    if (SystemUtil.isString(transition)) this.transition = transition
    else if (transition instanceof Function) this.transitionFunc = transition
    else
      throw new Error(
        '[ArgumentError] Transition must be either a string or a function'
      )

    if (this._properties) this._properties.length = 0
    else this._properties = []
    if (this._startValues) this._startValues.length = 0
    else this._startValues = []
    if (this._endValues) this._endValues.length = 0
    else this._endValues = []
    if (this._updateFuncs) this._updateFuncs.length = 0
    else this._updateFuncs = []

    return this
  }

  /** Animates the property of the target to a certain value. You can call this method
   *  multiple times on one tween.
   *
   *  <p>Some property types are handled in a special way:</p>
   *  <ul>
   *    <li>If the property contains the string <code>color</code> or <code>Color</code>,
   *        it will be treated as an unsigned integer with a color value
   *        (e.g. <code>0xff0000</code> for red). Each color channel will be animated
   *        individually.</li>
   *    <li>The same happens if you append the string <code>#rgb</code> to the name.</li>
   *    <li>If you append <code>#rad</code>, the property is treated as an angle in radians,
   *        making sure it always uses the shortest possible arc for the rotation.</li>
   *    <li>The string <code>#deg</code> does the same for angles in degrees.</li>
   *  </ul>
   */
  animate(property, endValue) {
    if (!this._target) return // tweening null just does nothing.

    const { _properties, _startValues, _endValues, _updateFuncs } = this

    const pos = _properties.length
    const updateFunc = this.getUpdateFuncFromProperty(property)

    _properties[pos] = Tween.getPropertyName(property)
    _startValues[pos] = Number.NaN
    _endValues[pos] = endValue
    _updateFuncs[pos] = updateFunc
  }

  /** Animates the 'scaleX' and 'scaleY' properties of an object simultaneously. */
  scaleTo(factor) {
    this.animate('scaleX', factor)
    this.animate('scaleY', factor)
  }

  /** Animates the 'x' and 'y' properties of an object simultaneously. */
  moveTo(x, y) {
    this.animate('x', x)
    this.animate('y', y)
  }

  /** Animates the 'alpha' property of an object to a certain target value. */
  fadeTo(alpha) {
    this.animate('alpha', alpha)
  }

  /** Animates the 'rotation' property of an object to a certain target value, using the
   *  smallest possible arc. 'type' may be either 'rad' or 'deg', depending on the unit of
   *  measurement. */
  rotateTo(angle, type = 'rad') {
    this.animate('rotation#' + type, angle)
  }

  /** @inheritDoc */
  advanceTime(time) {
    const {
      _reverse,
      _totalTime,
      _properties,
      _startValues,
      _endValues,
      _onRepeat,
      _onRepeatArgs,
      _onComplete,
      _onCompleteArgs,
      _onUpdateArgs,
      _repeatDelay,
      _updateFuncs,
      _onStart,
      _transitionFunc,
      _onUpdate,
      _target
    } = this

    if (
      time === 0 ||
      (this._repeatCount === 1 && this._currentTime === _totalTime)
    )
      return

    let i
    const previousTime = this._currentTime
    const restTime = _totalTime - this._currentTime
    let carryOverTime = time > restTime ? time - restTime : 0.0

    this._currentTime += time

    if (this._currentTime <= 0) return
    // the delay is not over yet
    else if (this._currentTime > _totalTime) this._currentTime = _totalTime

    if (this._currentCycle < 0 && previousTime <= 0 && this._currentTime > 0) {
      this._currentCycle++
      if (_onStart != null) _onStart.apply(this, this._onStartArgs)
    }

    const ratio = this._currentTime / _totalTime
    const reversed = _reverse && this._currentCycle % 2 === 1
    const numProperties = _startValues.length
    this._progress = reversed
      ? _transitionFunc(1.0 - ratio)
      : _transitionFunc(ratio)

    for (i = 0; i < numProperties; ++i) {
      if (this._startValues[i] !== this._startValues[i])
        // isNaN check - 'isNaN' causes allocation!
        this._startValues[i] = _target[_properties[i]]

      const updateFunc = _updateFuncs[i]
      updateFunc(_properties[i], _startValues[i], _endValues[i])
    }

    if (_onUpdate) _onUpdate.apply(this, _onUpdateArgs)

    if (previousTime < _totalTime && this._currentTime >= _totalTime) {
      if (this._repeatCount === 0 || this._repeatCount > 1) {
        this._currentTime = -_repeatDelay
        this._currentCycle++
        if (this._repeatCount > 1) this._repeatCount--
        if (_onRepeat !== null) _onRepeat.apply(this, _onRepeatArgs)
      } else {
        // save callback & args: they might be changed through an event listener
        const onComplete = _onComplete
        const onCompleteArgs = _onCompleteArgs

        // in the 'onComplete' callback, people might want to call 'tween.reset' and
        // add it to another juggler; so this event has to be dispatched *before*
        // executing 'onComplete'.
        this.dispatchEventWith(Event.REMOVE_FROM_JUGGLER)
        if (onComplete) onComplete.apply(this, onCompleteArgs)
        if (this._currentTime === 0) carryOverTime = 0 // tween was reset
      }
    }

    if (carryOverTime) this.advanceTime(carryOverTime)
  }

  // animation hints

  getUpdateFuncFromProperty(property) {
    let updateFunc
    const hint = this.getPropertyHint(property)

    switch (hint) {
      case null:
        updateFunc = this.updateStandard
        break
      case 'rgb':
        updateFunc = this.updateRgb
        break
      case 'rad':
        updateFunc = this.updateRad
        break
      case 'deg':
        updateFunc = this.updateDeg
        break
      default:
        console.warning('[Starling] Ignoring unknown property hint:', hint)
        updateFunc = this.updateStandard
    }

    return updateFunc
  }

  /** @private */
  getPropertyHint(property) {
    // colorization is special; it does not require a hint marker, just the word 'color'.
    if (property.indexOf('color') !== -1 || property.indexOf('Color') !== -1)
      return 'rgb'

    const hintMarkerIndex = property.indexOf(Tween.HINT_MARKER)
    if (hintMarkerIndex !== -1) return property.substr(hintMarkerIndex + 1)
    else return null
  }

  /** @private */
  static getPropertyName(property) {
    const hintMarkerIndex = property.indexOf(Tween.HINT_MARKER)
    if (hintMarkerIndex !== -1) return property.substring(0, hintMarkerIndex)
    else return property
  }

  updateStandard = (property, startValue, endValue) => {
    let newValue = startValue + this._progress * (endValue - startValue)
    if (this._roundToInt) newValue = Math.round(newValue)
    this._target[property] = newValue
  }

  updateRgb = (property, startValue, endValue) => {
    this._target[property] = Color.interpolate(
      startValue,
      endValue,
      this._progress
    ) // todo: was uint
  }

  updateRad = (property, startValue, endValue) => {
    this.updateAngle(Math.PI, property, startValue, endValue)
  }

  updateDeg = (property, startValue, endValue) => {
    this.updateAngle(180, property, startValue, endValue)
  }

  updateAngle = (pi, property, startValue, endValue) => {
    while (Math.abs(endValue - startValue) > pi) {
      if (startValue < endValue) endValue -= 2.0 * pi
      else endValue += 2.0 * pi
    }

    this.updateStandard(property, startValue, endValue)
  }

  /** The end value a certain property is animated to. Throws an ArgumentError if the
   *  property is not being animated. */
  getEndValue(property) {
    const index = this._properties.indexOf(property)
    if (index === -1)
      throw new Error(
        `[ArgumentError] The property '${property}' is not animated`
      )
    else return this._endValues[index]
  }

  /** Indicates if a property with the given name is being animated by this tween. */
  animatesProperty(property) {
    return this._properties.indexOf(property) !== -1
  }

  /** Indicates if the tween is finished. */
  get isComplete() {
    return this._currentTime >= this._totalTime && this._repeatCount === 1
  }

  /** The target object that is animated. */
  get target() {
    return this._target
  }

  /** The transition method used for the animation. @see Transitions */
  get transition() {
    return this._transitionName
  }

  set transition(value) {
    this._transitionName = value
    this._transitionFunc = Transitions.getTransition(value)

    if (!this._transitionFunc)
      throw new Error(`[ArgumentError] Invalid transiton: ${value}`)
  }

  /** The actual transition function used for the animation. */
  get transitionFunc() {
    return this._transitionFunc
  }

  set transitionFunc(value) {
    this._transitionName = 'custom'
    this._transitionFunc = value
  }

  /** The total time the tween will take per repetition (in seconds). */
  get totalTime() {
    return this._totalTime
  }

  /** The time that has passed since the tween was created (in seconds). */
  get currentTime() {
    return this._currentTime
  }

  /** The current progress between 0 and 1, as calculated by the transition function. */
  get progress() {
    return this._progress
  }

  /** The delay before the tween is started (in seconds). @default 0 */
  get delay() {
    return this._delay
  }

  set delay(value) {
    this._currentTime = this._currentTime + this._delay - value
    this._delay = value
  }

  /** The number of times the tween will be executed.
   *  Set to '0' to tween indefinitely. @default 1 */
  get repeatCount() {
    return this._repeatCount
  }

  set repeatCount(value) {
    this._repeatCount = value
  }

  /** The amount of time to wait between repeat cycles (in seconds). @default 0 */
  get repeatDelay() {
    return this._repeatDelay
  }

  set repeatDelay(value) {
    this._repeatDelay = value
  }

  /** Indicates if the tween should be reversed when it is repeating. If enabled,
   *  every second repetition will be reversed. @default false */
  get reverse() {
    return this._reverse
  }

  set reverse(value) {
    this._reverse = value
  }

  /** Indicates if the numeric values should be cast to Integers. @default false */
  get roundToInt() {
    return this._roundToInt
  }

  set roundToInt(value) {
    this._roundToInt = value
  }

  /** A function that will be called when the tween starts (after a possible delay). */
  get onStart() {
    return this._onStart
  }

  set onStart(value) {
    this._onStart = value
  }

  /** A function that will be called each time the tween is advanced. */
  get onUpdate() {
    return this._onUpdate
  }

  set onUpdate(value) {
    this._onUpdate = value
  }

  /** A function that will be called each time the tween finishes one repetition
   *  (except the last, which will trigger 'onComplete'). */
  get onRepeat() {
    return this._onRepeat
  }

  set onRepeat(value) {
    this._onRepeat = value
  }

  /** A function that will be called when the tween is complete. */
  get onComplete() {
    return this._onComplete
  }

  set onComplete(value) {
    this._onComplete = value
  }

  /** The arguments that will be passed to the 'onStart' function. */
  get onStartArgs() {
    return this._onStartArgs
  }

  set onStartArgs(value) {
    this._onStartArgs = value
  }

  /** The arguments that will be passed to the 'onUpdate' function. */
  get onUpdateArgs() {
    return this._onUpdateArgs
  }

  set onUpdateArgs(value) {
    this._onUpdateArgs = value
  }

  /** The arguments that will be passed to the 'onRepeat' function. */
  get onRepeatArgs() {
    return this._onRepeatArgs
  }

  set onRepeatArgs(value) {
    this._onRepeatArgs = value
  }

  /** The arguments that will be passed to the 'onComplete' function. */
  get onCompleteArgs() {
    return this._onCompleteArgs
  }

  set onCompleteArgs(value) {
    this._onCompleteArgs = value
  }

  /** Another tween that will be started (i.e. added to the same juggler) as soon as
   *  this tween is completed. */
  get nextTween() {
    return this._nextTween
  }

  set nextTween(value) {
    this._nextTween = value
  }

  // tween pooling

  static sTweenPool = []

  /** @private */
  static fromPool(target, time, transition = 'linear') {
    if (Tween.sTweenPool.length)
      return Tween.sTweenPool.pop().reset(target, time, transition)
    else return new Tween(target, time, transition)
  }

  /** @private */
  static toPool(tween) {
    // reset any object-references, to make sure we don't prevent any garbage collection
    tween._onStart = tween._onUpdate = tween._onRepeat = tween._onComplete = null
    tween._onStartArgs = tween._onUpdateArgs = tween._onRepeatArgs = tween._onCompleteArgs = null
    tween._target = null
    tween._transitionFunc = null
    tween.removeEventListeners()
    Tween.sTweenPool.push(tween)
  }
}
