import EventDispatcher from '../events/event-dispatcher';

/** A DelayedCall allows you to execute a method after a certain time has passed. Since it
 *  implements the IAnimatable interface, it can be added to a juggler. In most cases, you
 *  do not have to use this class directly; the juggler class contains a method to delay
 *  calls directly.
 *
 *  <p>DelayedCall dispatches an Event of type 'Event.REMOVE_FROM_JUGGLER' when it is finished,
 *  so that the juggler automatically removes it when its no longer needed.</p>
 *
 *  @see Juggler
 */
export default class DelayedCall extends EventDispatcher {
    _currentTime;
    _totalTime;
    _callback;
    _args;
    _repeatCount;

    /** Creates a delayed call. */
    constructor(callback, delay, args = null) {
        super();
        this.reset(callback, delay, args);
    }

    /** Resets the delayed call to its default values, which is useful for pooling. */
    reset(callback, delay, args = null) {
        this._currentTime = 0;
        this._totalTime = Math.max(delay, 0.0001);
        this._callback = callback;
        this._args = args;
        this._repeatCount = 1;

        return this;
    }

    /** @inheritDoc */
    advanceTime(time) {
        const { _totalTime, _callback, _args } = this;
        const previousTime = this._currentTime;
        this._currentTime += time;

        if (this._currentTime > _totalTime)
            this._currentTime = _totalTime;

        if (previousTime < _totalTime && this._currentTime >= _totalTime) {
            if (this._repeatCount === 0 || this._repeatCount > 1) {
                _callback(..._args);

                if (this._repeatCount > 0) this._repeatCount -= 1;
                this._currentTime = 0;
                this.advanceTime((previousTime + time) - _totalTime);
            } else {
                // save call & args: they might be changed through an event listener
                const call = _callback;
                const args = _args;

                // in the callback, people might want to call "reset" and re-add it to the
                // juggler; so this event has to be dispatched *before* executing 'call'.
                this.dispatchEventWith(Event.REMOVE_FROM_JUGGLER);
                call(...args);
            }
        }
    }

    /** Advances the delayed call so that it is executed right away. If 'repeatCount' is
     * anything else than '1', this method will complete only the current iteration. */
    complete() {
        const restTime = this._totalTime - this._currentTime;
        if (restTime > 0) this.advanceTime(restTime);
    }

    /** Indicates if enough time has passed, and the call has already been executed. */
    get isComplete() {
        return this._repeatCount === 1 && this._currentTime >= this._totalTime;
    }

    /** The time for which calls will be delayed (in seconds). */
    get totalTime() {
        return this._totalTime;
    }

    /** The time that has already passed (in seconds). */
    get currentTime() {
        return this._currentTime;
    }

    /** The number of times the call will be repeated.
     *  Set to '0' to repeat indefinitely. @default 1 */
    get repeatCount() {
        return this._repeatCount;
    }

    set repeatCount(value) {
        this._repeatCount = value;
    }

    /** The callback that will be executed when the time is up. */
    get callback() {
        return this._callback;
    }

    /** The arguments that the callback will be executed with.
     *  Beware: not a copy, but the actual object! */
    get arguments() {
        return this._args;
    }

    // delayed call pooling

    static sPool = []

    /** @private */
    static fromPool(call, delay, args = null) {
        if (DelayedCall.sPool.length) return DelayedCall.sPool.pop().reset(call, delay, args);
        else return new DelayedCall(call, delay, args);
    }

    /** @private */
    static toPool(delayedCall) {
        // reset any object-references, to make sure we don't prevent any garbage collection
        delayedCall._callback = null;
        delayedCall._args = null;
        delayedCall.removeEventListeners();
        DelayedCall.sPool.push(delayedCall);
    }
}
