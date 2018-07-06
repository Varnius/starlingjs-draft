import Tween from './tween'
import DelayedCall from './delayed-call'
import Event from '../events/event'

/** The Juggler takes objects that implement IAnimatable (like Tweens) and executes them.
 *
 *  <p>A juggler is a simple object. It does no more than saving a list of objects implementing
 *  'IAnimatable' and advancing their time if it is told to do so (by calling its own
 *  'advanceTime'-method). When an animation is completed, it throws it away.</p>
 *
 *  <p>There is a default juggler available at the Starling class:</p>
 *
 *  <pre>
 *  var juggler:Juggler = Starling.juggler;
 *  </pre>
 *
 *  <p>You can create juggler objects yourself, just as well. That way, you can group
 *  your game into logical components that handle their animations independently. All you have
 *  to do is call the 'advanceTime' method on your custom juggler once per frame.</p>
 *
 *  <p>Another handy feature of the juggler is the 'delayCall'-method. Use it to
 *  execute a function at a later time. Different to conventional approaches, the method
 *  will only be called when the juggler is advanced, giving you perfect control over the
 *  call.</p>
 *
 *  <pre>
 *  juggler.delayCall(object.removeFromParent, 1.0);
 *  juggler.delayCall(object.addChild, 2.0, theChild);
 *  juggler.delayCall(function() { rotation += 0.1; }, 3.0);
 *  </pre>
 *
 *  @see Tween
 *  @see DelayedCall
 */
export default class Juggler {
  _objects
  _objectIDs
  _elapsedTime
  _timeScale

  sCurrentObjectID

  /** Create an empty juggler. */
  constructor() {
    this._elapsedTime = 0
    this._timeScale = 1.0
    this._objects = []
    this._objectIDs = new WeakMap()
  }

  /** Adds an object to the juggler.
   *
   *  @return Unique numeric identifier for the animation. This identifier may be used
   *          to remove the object via <code>removeByID()</code>.
   */
  add(object) {
    return this.addWithID(object, Juggler.getNextID())
  }

  addWithID(object, objectID) {
    if (object && !this._objectIDs.has(object)) {
      const dispatcher = object
      if (dispatcher)
        dispatcher.addEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove)

      this._objects[this._objects.length] = object
      this._objectIDs.set(object, objectID)

      return objectID
    } else return 0
  }

  /** Determines if an object has been added to the juggler. */
  contains(object) {
    return this._objectIDs.has(object)
  }

  /** Removes an object from the juggler.
   *
   *  @return The (now meaningless) unique numeric identifier for the animation, or zero
   *          if the object was not found.
   */
  remove = object => {
    const { _objectIDs, _objects } = this
    let objectID = 0

    if (object && _objectIDs.has(object)) {
      const dispatcher = object
      if (dispatcher)
        dispatcher.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove)

      const index = _objects.indexOf(object)
      _objects[index] = null

      objectID = _objectIDs.get(object)
      _objectIDs.delete(object)
    }

    return objectID
  }

  /** Removes an object from the juggler, identified by the unique numeric identifier you
   *  received when adding it.
   *
   *  <p>It's not uncommon that an animatable object is added to a juggler repeatedly,
   *  e.g. when using an object-pool. Thus, when using the <code>remove</code> method,
   *  you might accidentally remove an object that has changed its context. By using
   *  <code>removeByID</code> instead, you can be sure to avoid that, since the objectID
   *  will always be unique.</p>
   *
   *  @return if successful, the passed objectID; if the object was not found, zero.
   */
  removeByID(objectID) {
    const { _objects, _objectIDs } = this

    for (let i = _objects.length - 1; i >= 0; --i) {
      const object = this._objects[i]

      if (_objectIDs.get(object) === objectID) {
        this.remove(object)
        return objectID
      }
    }

    return 0
  }

  /** Removes all tweens with a certain target. */
  removeTweens(target) {
    if (!target) return

    const { _objects } = this

    for (let i = _objects.length - 1; i >= 0; --i) {
      const tween = _objects[i]
      if (tween && tween.target === target) {
        tween.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove)
        _objects[i] = null
        this._objectIDs.delete(tween)
      }
    }
  }

  /** Removes all delayed and repeated calls with a certain callback. */
  removeDelayedCalls(callback) {
    if (!callback) return

    const { _objects, _objectIDs } = this

    for (let i = _objects.length - 1; i >= 0; --i) {
      const delayedCall = _objects[i]
      if (delayedCall && delayedCall.callback === callback) {
        delayedCall.removeEventListener(
          Event.REMOVE_FROM_JUGGLER,
          this.onRemove
        )
        _objects[i] = null
        _objectIDs.delete(delayedCall)
      }
    }
  }

  /** Figures out if the juggler contains one or more tweens with a certain target. */
  containsTweens(target) {
    const { _objects } = this

    if (target) {
      for (let i = _objects.length - 1; i >= 0; --i) {
        const tween = _objects[i]
        if (tween && tween.target === target) return true
      }
    }

    return false
  }

  /** Figures out if the juggler contains one or more delayed calls with a certain callback. */
  containsDelayedCalls(callback) {
    const { _objects } = this

    if (callback) {
      for (let i = _objects.length - 1; i >= 0; --i) {
        const delayedCall = _objects[i]
        if (delayedCall && delayedCall.callback === callback) return true
      }
    }

    return false
  }

  /** Removes all objects at once. */
  purge() {
    // the object vector is not purged right away, because if this method is called
    // from an 'advanceTime' call, this would make the loop crash. Instead, the
    // vector is filled with 'null' values. They will be cleaned up on the next call
    // to 'advanceTime'.

    const { _objects, _objectIDs } = this

    for (let i = _objects.length - 1; i >= 0; --i) {
      const object = _objects[i]
      const dispatcher = object
      if (dispatcher)
        dispatcher.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove)
      _objects[i] = null
      _objectIDs.delete(object)
    }
  }

  /** Delays the execution of a function until <code>delay</code> seconds have passed.
   *  This method provides a convenient alternative for creating and adding a DelayedCall
   *  manually.
   *
   *  @return Unique numeric identifier for the delayed call. This identifier may be used
   *          to remove the object via <code>removeByID()</code>.
   */
  delayCall(call, delay, ...args) {
    if (!call) throw new Error('[ArgumentErorr] call must not be null')

    const delayedCall = DelayedCall.fromPool(call, delay, args)
    delayedCall.addEventListener(
      Event.REMOVE_FROM_JUGGLER,
      this.onPooledDelayedCallComplete
    )
    return this.add(delayedCall)
  }

  /** Runs a function at a specified interval (in seconds). A 'repeatCount' of zero
   *  means that it runs indefinitely.
   *
   *  @return Unique numeric identifier for the delayed call. This identifier may be used
   *          to remove the object via <code>removeByID()</code>.
   */
  repeatCall(call, interval, repeatCount = 0, ...args) {
    if (!call) throw new Error('[ArgumentError] call must not be null')

    const delayedCall = DelayedCall.fromPool(call, interval, args)
    delayedCall.repeatCount = repeatCount
    delayedCall.addEventListener(
      Event.REMOVE_FROM_JUGGLER,
      this.onPooledDelayedCallComplete
    )
    return this.add(delayedCall)
  }

  onPooledDelayedCallComplete = event => {
    DelayedCall.toPool(event.target)
  }

  /** Utilizes a tween to animate the target object over <code>time</code> seconds. Internally,
   *  this method uses a tween instance (taken from an object pool) that is added to the
   *  juggler right away. This method provides a convenient alternative for creating
   *  and adding a tween manually.
   *
   *  <p>Fill 'properties' with key-value pairs that describe both the
   *  tween and the animation target. Here is an example:</p>
   *
   *  <pre>
   *  juggler.tween(object, 2.0, {
   *      transition: Transitions.EASE_IN_OUT,
   *      delay: 20, // -> tween.delay = 20
   *      x: 50      // -> tween.animate('x', 50)
   *  });
   *  </pre>
   *
   *  <p>To cancel the tween, call 'Juggler.removeTweens' with the same target, or pass
   *  the returned 'IAnimatable' instance to 'Juggler.remove()'. Do not use the returned
   *  IAnimatable otherwise; it is taken from a pool and will be reused.</p>
   *
   *  <p>Note that some property types may be animated in a special way:</p>
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
  tween(target, time, properties) {
    if (!target) throw new Error('[ArgumentError] target must not be null')

    const tween = Tween.fromPool(target, time)

        for (const property in properties) { // eslint-disable-line
      const value = properties[property]

            if (tween[property] !== undefined) // eslint-disable-line
        tween[property] = value
            else if (target[Tween.getPropertyName(property)] !== undefined) // eslint-disable-line
        tween.animate(property, value)
      else throw new Error(`[ArgumentError] Invalid property: ${property}`)
    }

    tween.addEventListener(
      Event.REMOVE_FROM_JUGGLER,
      this.onPooledTweenComplete
    )
    return this.add(tween)
  }

  onPooledTweenComplete(event) {
    Tween.toPool(event.target)
  }

  /** Advances all objects by a certain time (in seconds). */
  advanceTime(time) {
    const { _objects, _timeScale } = this

    let numObjects = _objects.length
    let currentIndex = 0
    let i

    time *= _timeScale
    if (numObjects === 0 || time === 0) return
    this._elapsedTime += time

    // there is a high probability that the 'advanceTime' function modifies the list
    // of animatables. we must not process new objects right now (they will be processed
    // in the next frame), and we need to clean up any empty slots in the list.

    for (i = 0; i < numObjects; ++i) {
      const object = _objects[i]
      if (object) {
        // shift objects into empty slots along the way
        if (currentIndex !== i) {
          _objects[currentIndex] = object
          _objects[i] = null
        }

        object.advanceTime(time)
        ++currentIndex
      }
    }

    if (currentIndex !== i) {
      numObjects = _objects.length // count might have changed!

      while (i < numObjects) _objects[currentIndex++] = _objects[i++]

      _objects.length = currentIndex
    }
  }

  onRemove = event => {
    const objectID = this.remove(event.target)

    if (objectID) {
      const tween = event.target
      if (tween && tween.isComplete) this.addWithID(tween.nextTween, objectID)
    }
  }

  static getNextID() {
    return ++Juggler.sCurrentObjectID
  }

  /** The total life time of the juggler (in seconds). */
  get elapsedTime() {
    return this._elapsedTime
  }

  /** The scale at which the time is passing. This can be used for slow motion or time laps
   *  effects. Values below '1' will make all animations run slower, values above '1' faster.
   *  @default 1.0 */
  get timeScale() {
    return this._timeScale
  }

  set timeScale(value) {
    this._timeScale = value
  }

  /** The actual vector that contains all objects that are currently being animated. */
  get objects() {
    return this._objects
  }
}
