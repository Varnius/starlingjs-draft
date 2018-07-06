import Event from '../events/event'
import SystemUtil from '../utils/system-util'

export default class EventDispatcher {
  _eventListeners
  static _bubbleChains = []

  /** Registers an event listener at a certain object. */
  addEventListener(type, listener) {
    if (type === undefined)
      console.warn(
        'Event type of "undefined" is invalid. Did you forget to import Starling Event class?'
      )
    if (!this._eventListeners) this._eventListeners = {}

    const listeners = this._eventListeners[type]

    if (!listeners) {
      this._eventListeners[type] = [listener]
    } else if (listeners.indexOf(listener) === -1) {
      // check for duplicates
      listeners[listeners.length] = listener // avoid 'push'
    }
  }

  /** Removes an event listener from the object. */
  removeEventListener(type, listener) {
    if (this._eventListeners) {
      const listeners = this._eventListeners[type]
      const numListeners = listeners ? listeners.length : 0

      if (numListeners > 0) {
        // we must not modify the original vector, but work on a copy.
        // (see comment in 'invokeEvent')

        const index = listeners.indexOf(listener)

        if (index !== -1) {
          const restListeners = listeners.slice(0, index)

          for (let i = index + 1; i < numListeners; ++i)
            restListeners[i - 1] = listeners[i]

          this._eventListeners[type] = restListeners
        }
      }
    }
  }

  /** Removes all event listeners with a certain type, or all of them if type is null.
   *  Be careful when removing all event listeners: you never know who else was listening. */
  removeEventListeners(type = null) {
    if (type && this._eventListeners) delete this._eventListeners[type]
    else this._eventListeners = null
  }

  /** Dispatches an event to all objects that have registered listeners for its type.
   *  If an event with enabled 'bubble' property is dispatched to a display object, it will
   *  travel up along the line of parents, until it either hits the root object or someone
   *  stops its propagation manually. */
  dispatchEvent(event) {
    const bubbles = event.bubbles

    if (
      !bubbles &&
      (!this._eventListeners || !(event.type in this._eventListeners))
    )
      return // no need to do anything

    // we save the current target and restore it later;
    // this allows users to re-dispatch events without creating a clone.

    const previousTarget = event.target
    event.setTarget(this)

    if (bubbles && SystemUtil.isBaseClass(this.constructor, 'DisplayObject')) {
      this.bubbleEvent(event)
    } else {
      this.invokeEvent(event)
    }

    if (previousTarget) event.setTarget(previousTarget)
  }

  /** @private
   *  Invokes an event on the current object. This method does not do any bubbling, nor
   *  does it back-up and restore the previous target on the event. The 'dispatchEvent'
   *  method uses this method internally. */
  invokeEvent(event) {
    const listeners = this._eventListeners
      ? this._eventListeners[event.type]
      : null
    const numListeners = !listeners ? 0 : listeners.length

    if (numListeners) {
      event.setCurrentTarget(this)

      // we can enumerate directly over the vector, because:
      // when somebody modifies the list while we're looping, "addEventListener" is not
      // problematic, and "removeEventListener" will create a new Vector, anyway.

      for (let i = 0; i < numListeners; ++i) {
        const listener = listeners[i]
        const numArgs = listener.length

        if (numArgs === 0) listener()
        else if (numArgs === 1) listener(event)
        else listener(event, event.data)

        if (event.stopsImmediatePropagation) return true
      }

      return event.stopsPropagation
    }

    return false
  }

  /** @private */
  bubbleEvent(event) {
    // we determine the bubble chain before starting to invoke the listeners.
    // that way, changes done by the listeners won't affect the bubble chain.

    let chain
    let element = this
    let length = 1

    if (EventDispatcher._bubbleChains.length > 0) {
      chain = EventDispatcher._bubbleChains.pop()
      chain[0] = element
    } else {
      chain = [element]
    }

    element = element.parent
    while (element) {
      chain[length++] = element
      element = element.parent
    }

    for (let i = 0; i < length; ++i) {
      const stopPropagation = chain[i].invokeEvent(event)
      if (stopPropagation) break
    }

    chain.length = 0
    EventDispatcher._bubbleChains[EventDispatcher._bubbleChains.length] = chain // avoid 'push'
  }

  /** Dispatches an event with the given parameters to all objects that have registered
   *  listeners for the given type. The method uses an internal pool of event objects to
   *  avoid allocations. */
  dispatchEventWith(type, bubbles = false, data = null) {
    if (bubbles || this.hasEventListener(type)) {
      const event = Event.fromPool(type, bubbles, data)
      this.dispatchEvent(event)
      Event.toPool(event)
    }
  }

  /** If called with one argument, figures out if there are any listeners registered for
   *  the given event type. If called with two arguments, also determines if a specific
   *  listener is registered. */
  hasEventListener(type, listener = null) {
    const listeners = this._eventListeners ? this._eventListeners[type] : null
    if (!listeners) return false
    if (listener) return listeners.indexOf(listener) !== -1
    return listeners.length !== 0
  }
}
