import Event from './event';
import TouchPhase from './touch-phase';

/** A TouchEvent is triggered either by touch or mouse input.
 *
 *  <p>In Starling, both touch events and mouse events are handled through the same class:
 *  TouchEvent. To process user input from a touch screen or the mouse, you have to register
 *  an event listener for events of the type <code>TouchEvent.TOUCH</code>. This is the only
 *  event type you need to handle; the long list of mouse event types as they are used in
 *  conventional Flash are mapped to so-called 'TouchPhases' instead.</p>
 *
 *  <p>The difference between mouse input and touch input is that</p>
 *
 *  <ul>
 *    <li>only one mouse cursor can be present at a given moment and</li>
 *    <li>only the mouse can 'hover' over an object without a pressed button.</li>
 *  </ul>
 *
 *  <strong>Which objects receive touch events?</strong>
 *
 *  <p>In Starling, any display object receives touch events, as long as the
 *  <code>touchable</code> property of the object and its parents is enabled. There
 *  is no 'InteractiveObject' class in Starling.</p>
 *
 *  <strong>How to work with individual touches</strong>
 *
 *  <p>The event contains a list of all touches that are currently present. Each individual
 *  touch is stored in an object of type 'Touch'. Since you are normally only interested in
 *  the touches that occurred on top of certain objects, you can query the event for touches
 *  with a specific target:</p>
 *
 *  <code>var touches:Vector.&lt;Touch&gt; = touchEvent.getTouches(this);</code>
 *
 *  <p>This will return all touches of 'this' or one of its children. When you are not using
 *  multitouch, you can also access the touch object directly, like this:</p>
 *
 *  <code>var touch = touchEvent.getTouch(this);</code>
 *
 *  @see Touch
 *  @see TouchPhase
 */
export default class TouchEvent extends Event {
    /** Event type for touch or mouse input. */
    static TOUCH = 'touch';

    _shiftKey;
    _ctrlKey;
    _timestamp;
    _visitedObjects;

    /** Helper object. */
    static sTouches = [];

    /** Creates a new TouchEvent instance. */
    constructor(type, touches = null, shiftKey = false, ctrlKey = false, bubbles = true)
    {
        super(type, bubbles, touches);

        this._shiftKey = shiftKey;
        this._ctrlKey = ctrlKey;
        this._visitedObjects = [];

        this.updateTimestamp(touches);
    }

    resetTo(type, touches = null, shiftKey = false, ctrlKey = false, bubbles = true)
    {
        super.reset(type, bubbles, touches);

        this._shiftKey = shiftKey;
        this._ctrlKey = ctrlKey;
        this._visitedObjects.length = 0;
        this.updateTimestamp(touches);

        return this;
    }

    updateTimestamp(touches)
    {
        this._timestamp = -1.0;
        const numTouches = touches ? touches.length : 0;

        for (let i = 0; i < numTouches; ++i)
            if (touches[i].timestamp > this._timestamp)
                this._timestamp = touches[i].timestamp;
    }

    /** Returns a list of touches that originated over a certain target. If you pass an
     *  <code>out</code>-vector, the touches will be added to this vector instead of creating
     *  a new object. */
    getTouches(target, phase = null, out = null)
    {
        if (!out) out = [];
        const allTouches = this.data;
        const numTouches = allTouches.length;

        for (let i = 0; i < numTouches; ++i)
        {
            const touch = allTouches[i];
            const correctTarget = touch.isTouching(target);
            const correctPhase = (!phase || phase === touch.phase);

            if (correctTarget && correctPhase)
                out[out.length] = touch; // avoiding 'push'
        }
        return out;
    }

    /** Returns a touch that originated over a certain target.
     *
     *  @param target   The object that was touched; may also be a parent of the actual
     *                  touch-target.
     *  @param phase    The phase the touch must be in, or null if you don't care.
     *  @param id       The ID of the requested touch, or -1 if you don't care.
     */
    getTouch(target, phase = null, id = -1)
    {
        this.getTouches(target, phase, TouchEvent.sTouches);

        const { sTouches } = TouchEvent;
        const numTouches = sTouches.length;

        if (numTouches > 0)
        {
            let touch = null;

            if (id < 0) touch = sTouches[0];
            else
            {
                for (let i = 0; i < numTouches; ++i)
                    if (sTouches[i].id === id)
                    {
                        touch = sTouches[i];
                        break;
                    }
            }

            sTouches.length = 0;
            return touch;
        }
        else return null;
    }

    /** Indicates if a target is currently being touched or hovered over. */
    interactsWith(target)
    {
        let result = false;
        const { sTouches } = TouchEvent;
        this.getTouches(target, null, sTouches);

        for (let i = sTouches.length - 1; i >= 0; --i)
        {
            if (TouchEvent.sTouches[i].phase !== TouchPhase.ENDED)
            {
                result = true;
                break;
            }
        }

        sTouches.length = 0;
        return result;
    }

    // custom dispatching

    /** Dispatches the event along a custom bubble chain. During the lifetime of the event,
     *  each object is visited only once. */
    dispatch(chain)
    {
        if (chain && chain.length)
        {
            const chainLength = this.bubbles ? chain.length : 1;
            const previousTarget = this.target;
            this.setTarget(chain[0]);

            for (let i = 0; i < chainLength; ++i)
            {
                const chainElement = chain[i];
                if (this._visitedObjects.indexOf(chainElement) === -1)
                {
                    const stopPropagation = chainElement.invokeEvent(this);
                    this._visitedObjects[this._visitedObjects.length] = chainElement;
                    if (stopPropagation) break;
                }
            }

            this.setTarget(previousTarget);
        }
    }

    // properties

    /** The time the event occurred (in seconds since application launch). */
    get timestamp()
    {
        return this._timestamp;
    }

    /** All touches that are currently available. */
    get touches()
    {
        return this.data.concat();
    }

    /** Indicates if the shift key was pressed when the event occurred. */
    get shiftKey()
    {
        return this._shiftKey;
    }

    /** Indicates if the ctrl key was pressed when the event occurred. (Mac OS: Cmd or Ctrl) */
    get ctrlKey()
    {
        return this._ctrlKey;
    }
}
