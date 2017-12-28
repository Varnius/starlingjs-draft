import Event from './event';

/** A KeyboardEvent is dispatched in response to user input through a keyboard.
 *
 *  <p>This is Starling's version of the Flash KeyboardEvent class. It contains the same
 *  properties as the Flash equivalent.</p>
 *
 *  <p>To be notified of keyboard events, add an event listener to any display object that
 *  is part of your display tree. Starling has no concept of a "Focus" like native Flash.</p>
 *
 *  @see starling.display.Stage
 */
export default class KeyboardEvent extends Event {
    /** Event type for a key that was released. */
    static KEY_UP = 'keyup';

    /** Event type for a key that was pressed. */
    static KEY_DOWN = 'keydown';

    _charCode;
    _key;
    _keyLocation;
    _altKey;
    _ctrlKey;
    _shiftKey;
    _isDefaultPrevented;

    /** Creates a new KeyboardEvent. */
    constructor(type, charCode = 0, key = '',
                keyLocation = 0, ctrlKey = false,
                altKey = false, shiftKey = false) {
        super(type, false, key);
        this._charCode = charCode;
        this._key = key;
        this._keyLocation = keyLocation;
        this._ctrlKey = ctrlKey;
        this._altKey = altKey;
        this._shiftKey = shiftKey;
    }

    // prevent default

    /** Cancels the keyboard event's default behavior. This will be forwarded to the native
     *  flash KeyboardEvent. */
    preventDefault() {
        this._isDefaultPrevented = true;
    }

    /** Checks whether the preventDefault() method has been called on the event. */
    isDefaultPrevented() {
        return this._isDefaultPrevented;
    }

    // properties

    /** Contains the character code of the key. */
    get charCode() {
        return this._charCode;
    }

    /** The key code of the key. */
    get key() {
        return this._key;
    }

    /** Indicates the location of the key on the keyboard. This is useful for differentiating
     *  keys that appear more than once on a keyboard. @see Keylocation */
    get keyLocation() {
        return this._keyLocation;
    }

    /** Indicates whether the Alt key is active on Windows or Linux;
     *  indicates whether the Option key is active on Mac OS. */
    get altKey() {
        return this._altKey;
    }

    /** Indicates whether the Ctrl key is active on Windows or Linux;
     *  indicates whether either the Ctrl or the Command key is active on Mac OS. */
    get ctrlKey() {
        return this._ctrlKey;
    }

    /** Indicates whether the Shift key modifier is active (true) or inactive (false). */
    get shiftKey() {
        return this._shiftKey;
    }
}
