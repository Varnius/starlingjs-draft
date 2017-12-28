import Point from '../math/point';
import TouchPhase from './touch-phase';

/** A Touch object contains information about the presence or movement of a finger
 *  or the mouse on the screen.
 *
 *  <p>You receive objects of this type from a TouchEvent. When such an event is triggered,
 *  you can query it for all touches that are currently present on the screen. One touch
 *  object contains information about a single touch; it always transitions through a series
 *  of TouchPhases. Have a look at the TouchPhase class for more information.</p>
 *
 *  <strong>The position of a touch</strong>
 *
 *  <p>You can get the current and previous position in stage coordinates with the corresponding
 *  properties. However, you'll want to have the position in a different coordinate system
 *  most of the time. For this reason, there are methods that convert the current and previous
 *  touches into the local coordinate system of any object.</p>
 *
 *  @see TouchEvent
 *  @see TouchPhase
 */
export default class Touch {
    _id;
    _globalX;
    _globalY;
    _previousGlobalX;
    _previousGlobalY;
    _tapCount;
    _phase;
    _target;
    _timestamp;
    _pressure;
    _width;
    _height;
    _cancelled;
    _bubbleChain;

    /** Helper object. */
    static sHelperPoint = new Point();

    /** Creates a new Touch object. */
    constructor(id) {
        this._id = id;
        this._tapCount = 0;
        this._phase = TouchPhase.HOVER;
        this._pressure = this._width = this._height = 1.0;
        this._bubbleChain = [];
    }

    /** Converts the current location of a touch to the local coordinate system of a display
     *  object. If you pass an <code>out</code>-point, the result will be stored in this point
     *  instead of creating a new object.*/
    getLocation(space, out = null) {
        Touch.sHelperPoint.setTo(this._globalX, this._globalY);
        return space.globalToLocal(Touch.sHelperPoint, out);
    }

    /** Converts the previous location of a touch to the local coordinate system of a display
     *  object. If you pass an <code>out</code>-point, the result will be stored in this point
     *  instead of creating a new object.*/
    getPreviousLocation(space, out = null) {
        Touch.sHelperPoint.setTo(this._previousGlobalX, this._previousGlobalY);
        return space.globalToLocal(Touch.sHelperPoint, out);
    }

    /** Returns the movement of the touch between the current and previous location.
     *  If you pass an <code>out</code>-point, the result will be stored in this point instead
     *  of creating a new object. */
    getMovement(space, out = null) {
        if (!out) out = new Point();
        this.getLocation(space, out);
        const x = out.x;
        const y = out.y;
        this.getPreviousLocation(space, out);
        out.setTo(x - out.x, y - out.y);
        return out;
    }

    /** Indicates if the target or one of its children is touched. */
    isTouching(target) {
        return this._bubbleChain.indexOf(target) !== -1;
    }

    /** Returns a description of the object. */
    toString() {
        return `[Touch ${this._id}: globalX=${this._globalX}, globalY=${this._globalY}, phase=${this._phase}]`;
    }

    /** Creates a clone of the Touch object. */
    clone() {
        const clone = new Touch(this._id);
        const { _globalX, _globalY, _previousGlobalX, _previousGlobalY, _phase, _tapCount, _timestamp,
            _pressure, _width, _height, _cancelled, _target } = this;

        clone._globalX = _globalX;
        clone._globalY = _globalY;
        clone._previousGlobalX = _previousGlobalX;
        clone._previousGlobalY = _previousGlobalY;
        clone._phase = _phase;
        clone._tapCount = _tapCount;
        clone._timestamp = _timestamp;
        clone._pressure = _pressure;
        clone._width = _width;
        clone._height = _height;
        clone._cancelled = _cancelled;
        clone.target = _target;

        return clone;
    }

    // helper methods

    updateBubbleChain() {
        if (this._target) {
            let length = 1;
            let element = this._target;

            this._bubbleChain.length = 1;
            this._bubbleChain[0] = element;

            while (element = element.parent) {
                this._bubbleChain[length++] = element;
            }
        } else {
            this._bubbleChain.length = 0;
        }
    }

    // properties

    /** The identifier of a touch. '0' for mouse events, an increasing number for touches. */
    get id() {
        return this._id;
    }

    /** The previous x-position of the touch in stage coordinates. */
    get previousGlobalX() {
        return this._previousGlobalX;
    }

    /** The previous y-position of the touch in stage coordinates. */
    get previousGlobalY() {
        return this._previousGlobalY;
    }

    /** The x-position of the touch in stage coordinates. If you change this value,
     *  the previous one will be moved to "previousGlobalX". */
    get globalX() {
        return this._globalX;
    }

    set globalX(value) {
        this._previousGlobalX = this._globalX !== this._globalX ? value : this._globalX; // isNaN check
        this._globalX = value;
    }

    /** The y-position of the touch in stage coordinates. If you change this value,
     *  the previous one will be moved to "previousGlobalY". */
    get globalY() {
        return this._globalY;
    }

    set globalY(value) {
        this._previousGlobalY = this._globalY !== this._globalY ? value : this._globalY; // isNaN check
        this._globalY = value;
    }

    /** The number of taps the finger made in a short amount of time. Use this to detect
     *  double-taps / double-clicks, etc. */
    get tapCount() {
        return this._tapCount;
    }

    set tapCount(value) {
        this._tapCount = value;
    }

    /** The current phase the touch is in. @see TouchPhase */
    get phase() {
        return this._phase;
    }

    set phase(value) {
        this._phase = value;
    }

    /** The display object at which the touch occurred. */
    get target() {
        return this._target;
    }

    set target(value) {
        if (this._target !== value) {
            this._target = value;
            this.updateBubbleChain();
        }
    }

    /** The moment the touch occurred (in seconds since application start). */
    get timestamp() {
        return this._timestamp;
    }

    set timestamp(value) {
        this._timestamp = value;
    }

    /** A value between 0.0 and 1.0 indicating force of the contact with the device.
     *  If the device does not support detecting the pressure, the value is 1.0. */
    get pressure() {
        return this._pressure;
    }

    set pressure(value) {
        this._pressure = value;
    }

    /** Width of the contact area.
     *  If the device does not support detecting the pressure, the value is 1.0. */
    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    /** Height of the contact area.
     *  If the device does not support detecting the pressure, the value is 1.0. */
    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }

    /** Indicates if the touch has been cancelled, which may happen when the app moves into
     *  the background ('Event.DEACTIVATE'). @default false */
    get cancelled() {
        return this._cancelled;
    }

    set cancelled(value) {
        this._cancelled = value;
    }

    // internal methods

    /** @private
     *  Dispatches a touch event along the current bubble chain (which is updated each time
     *  a target is set). */
    dispatchEvent(event) {
        if (this._target) event.dispatch(this._bubbleChain);
    }

    /** @private */
    get bubbleChain() {
        return this._bubbleChain.concat();
    }
}
