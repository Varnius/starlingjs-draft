import DisplayObjectContainer from './display-object-container';
import ButtonState from './button-state';
import Rectangle from '../math/rectangle';
import Sprite from './sprite';
import Image from './image';
import Event from '../events/event';
import TouchPhase from '../events/touch-phase';
import TouchEvent from '../events/touch-event';
import TextField from '../text/text-field';

/** A simple button composed of an image and, optionally, text.
 *
 *  <p>You can use different textures for various states of the button. If you're providing
 *  only an up state, the button is simply scaled a little when it is touched.</p>
 *
 *  <p>In addition, you can overlay text on the button. To customize the text, you can use
 *  properties equivalent to those of the TextField class. Move the text to a certain position
 *  by updating the <code>textBounds</code> property.</p>
 *
 *  <p>To react on touches on a button, there is special <code>Event.TRIGGERED</code> event.
 *  Use this event instead of normal touch events. That way, users can cancel button
 *  activation by moving the mouse/finger away from the button before releasing.</p>
 */
export default class Button extends DisplayObjectContainer {
    static MAX_DRAG_DIST = 50;

    _upState;
    _downState;
    _overState;
    _disabledState;

    _contents;
    _body;
    _textField;
    _textBounds;
    _overlay;

    _scaleWhenDown;
    _scaleWhenOver;
    _alphaWhenDown;
    _alphaWhenDisabled;
    _useHandCursor;
    _enabled;
    _state;
    _triggerBounds;

    /** Creates a button with a set of state-textures and (optionally) some text.
     *  Any state that is left 'null' will display the up-state texture. Beware that all
     *  state textures should have the same dimensions. */
    constructor(upState, text = '', downState = null, overState = null, disabledState = null) {
        super();

        if (!upState) throw new Error('[ArgumentError] Texture "upState" cannot be null');

        this._upState = upState;
        this._downState = downState;
        this._overState = overState;
        this._disabledState = disabledState;

        this._state = ButtonState.UP;
        this._body = new Image(upState);
        this._body.pixelSnapping = true;
        this._scaleWhenDown = downState ? 1.0 : 0.9;
        this._scaleWhenOver = this._alphaWhenDown = 1.0;
        this._alphaWhenDisabled = disabledState ? 1.0 : 0.5;
        this._enabled = true;
        this._useHandCursor = true;
        this._textBounds = new Rectangle(0, 0, this._body.width, this._body.height);
        this._triggerBounds = new Rectangle();

        this._contents = new Sprite();
        this._contents.addChild(this._body);
        this.addChild(this._contents);
        this.addEventListener(TouchEvent.TOUCH, this.onTouch);

        this.touchGroup = true;
        this.text = text;
    }

    /** @inheritDoc */
    dispose() {
        // text field might be disconnected from parent, so we have to dispose it manually
        if (this._textField)
            this._textField.dispose();

        super.dispose();
    }

    /** Readjusts the dimensions of the button according to its current state texture.
     *  Call this method to synchronize button and texture size after assigning a texture
     *  with a different size. */
    readjustSize() {
        const { _body, _textBounds, _textField } = this;

        const prevWidth = _body.width;
        const prevHeight = _body.height;

        _body.readjustSize();

        const scaleX = _body.width / prevWidth;
        const scaleY = _body.height / prevHeight;

        _textBounds.x *= scaleX;
        _textBounds.y *= scaleY;
        _textBounds.width *= scaleX;
        _textBounds.height *= scaleY;

        if (_textField) this.createTextField();
    }

    createTextField() {
        const { _textBounds, _body } = this;

        if (!this._textField) {
            this._textField = new TextField(_textBounds.width, _textBounds.height);
            this._textField.pixelSnapping = _body.pixelSnapping;
            this._textField.touchable = false;
            this._textField.autoScale = true;
            this._textField.batchable = true;
        }

        this._textField.width = _textBounds.width;
        this._textField.height = _textBounds.height;
        this._textField.x = _textBounds.x;
        this._textField.y = _textBounds.y;
    }

    onTouch = event => {
        // todo: make it work
        //Mouse.cursor = (_useHandCursor && _enabled && event.interactsWith(this)) ?
        //    MouseCursor.BUTTON : MouseCursor.AUTO;

        const { _state, stage, _triggerBounds, _enabled } = this;
        const touch = event.getTouch(this);
        let isWithinBounds;

        if (!_enabled) {
            return;
        } else if (!touch) {
            this.state = ButtonState.UP;
        } else if (touch.phase === TouchPhase.HOVER) {
            this.state = ButtonState.OVER;
        } else if (touch.phase === TouchPhase.BEGAN && _state !== ButtonState.DOWN) {
            this._triggerBounds = this.getBounds(stage, _triggerBounds);
            this._triggerBounds.inflate(Button.MAX_DRAG_DIST, Button.MAX_DRAG_DIST);

            this.state = ButtonState.DOWN;
        } else if (touch.phase === TouchPhase.MOVED) {
            isWithinBounds = _triggerBounds.contains(touch.globalX, touch.globalY);

            if (_state === ButtonState.DOWN && !isWithinBounds) {
                // reset button when finger is moved too far away ...
                this.state = ButtonState.UP;
            } else if (_state === ButtonState.UP && isWithinBounds) {
                // ... and reactivate when the finger moves back into the bounds.
                this.state = ButtonState.DOWN;
            }
        } else if (touch.phase === TouchPhase.ENDED && _state === ButtonState.DOWN) {
            this.state = ButtonState.UP;
            if (!touch.cancelled) {
                this.dispatchEventWith(Event.TRIGGERED, true);
            }
        }
    };

    /** The current state of the button. The corresponding strings are found
     *  in the ButtonState class. */
    get state() {
        return this._state;
    }

    set state(value) {
        const { _contents, _upState, _overState, _downState, _disabledState, _scaleWhenOver, _body,
            _scaleWhenDown, _alphaWhenDown, _alphaWhenDisabled } = this;

        this._state = value;
        _contents.x = _contents.y = 0;
        _contents.scaleX = _contents.scaleY = _contents.alpha = 1.0;

        switch (this._state) {
            case ButtonState.DOWN:
                this.setStateTexture(_downState);
                _contents.alpha = _alphaWhenDown;
                _contents.scaleX = _contents.scaleY = _scaleWhenDown;
                _contents.x = (1.0 - _scaleWhenDown) / 2.0 * _body.width;
                _contents.y = (1.0 - _scaleWhenDown) / 2.0 * _body.height;
                break;
            case ButtonState.UP:
                this.setStateTexture(_upState);
                break;
            case ButtonState.OVER:
                this.setStateTexture(_overState);
                _contents.scaleX = _contents.scaleY = _scaleWhenOver;
                _contents.x = (1.0 - _scaleWhenOver) / 2.0 * _body.width;
                _contents.y = (1.0 - _scaleWhenOver) / 2.0 * _body.height;
                break;
            case ButtonState.DISABLED:
                this.setStateTexture(_disabledState);
                _contents.alpha = _alphaWhenDisabled;
                break;
            default:
                throw new Error('[ArgumentError] Invalid button state: ' + this._state);
        }
    }

    setStateTexture(texture) {
        this._body.texture = texture || this._upState;
    }

    /** The scale factor of the button on touch. Per default, a button without a down state
     *  texture will be made slightly smaller, while a button with a down state texture
     *  remains unscaled. */
    get scaleWhenDown() {
        return this._scaleWhenDown;
    }

    set scaleWhenDown(value) {
        this._scaleWhenDown = value;
    }

    /** The scale factor of the button while the mouse cursor hovers over it. @default 1.0 */
    get scaleWhenOver() {
        return this._scaleWhenOver;
    }

    set scaleWhenOver(value) {
        this._scaleWhenOver = value;
    }

    /** The alpha value of the button on touch. @default 1.0 */
    get alphaWhenDown() {
        return this._alphaWhenDown;
    }

    set alphaWhenDown(value) {
        this._alphaWhenDown = value;
    }

    /** The alpha value of the button when it is disabled. @default 0.5 */
    get alphaWhenDisabled() {
        return this._alphaWhenDisabled;
    }

    set alphaWhenDisabled(value) {
        this._alphaWhenDisabled = value;
    }

    /** Indicates if the button can be triggered. */
    get enabled() {
        return this._enabled;
    }

    set enabled(value) {
        if (this._enabled !== value) {
            this._enabled = value;
            this.state = value ? ButtonState.UP : ButtonState.DISABLED;
        }
    }

    /** The text that is displayed on the button. */
    get text() {
        return this._textField ? this._textField.text : '';
    }

    set text(value) {
        if (value.length === 0) {
            if (this._textField) {
                this._textField.text = value;
                this._textField.removeFromParent();
            }
        }
        else {
            this.createTextField();
            this._textField.text = value;

            if (!this._textField.parent)
                this._contents.addChild(this._textField);
        }
    }

    /** The format of the button's TextField. */
    get textFormat() {
        if (!this._textField) this.createTextField();
        return this._textField.format;
    }

    set textFormat(value) {
        if (!this._textField) this.createTextField();
        this._textField.format = value;
    }

    /** The style that is used to render the button's TextField. */
    get textStyle() {
        if (!this._textField) this.createTextField();
        return this._textField.style;
    }

    set textStyle(value) {
        if (!this._textField) this.createTextField();
        this._textField.style = value;
    }

    /** The style that is used to render the button.
     *  Note that a style instance may only be used on one mesh at a time. */
    get style() {
        return this._body.style;
    }

    set style(value) {
        this._body.style = value;
    }

    /** The texture that is displayed when the button is not being touched. */
    get upState() {
        return this._upState;
    }

    set upState(value) {
        if (!value)
            throw new Error('[ArgumentError] Texture "upState" cannot be null');

        const { _state, _downState, _disabledState, _overState } = this;

        if (this._upState !== value) {
            this._upState = value;
            if (_state === ButtonState.UP ||
                (_state === ButtonState.DISABLED && !_disabledState) ||
                (_state === ButtonState.DOWN && !_downState) ||
                (_state === ButtonState.OVER && !_overState)) {
                this.setStateTexture(value);
            }
        }
    }

    /** The texture that is displayed while the button is touched. */
    get downState() {
        return this._downState;
    }

    set downState(value) {
        if (this._downState !== value) {
            this._downState = value;
            if (this._state === ButtonState.DOWN) this.setStateTexture(value);
        }
    }

    /** The texture that is displayed while mouse hovers over the button. */
    get overState() {
        return this._overState;
    }

    set overState(value) {
        if (this._overState !== value) {
            this._overState = value;
            if (this._state === ButtonState.OVER) this.setStateTexture(value);
        }
    }

    /** The texture that is displayed when the button is disabled. */
    get disabledState() {
        return this._disabledState;
    }

    set disabledState(value) {
        if (this._disabledState !== value) {
            this._disabledState = value;
            if (this._state === ButtonState.DISABLED) this.setStateTexture(value);
        }
    }

    /** The bounds of the button's TextField. Allows moving the text to a custom position.
     *  CAUTION: not a copy, but the actual object! Text will only update on re-assignment.
     */
    get textBounds() {
        return this._textBounds;
    }

    set textBounds(value) {
        this._textBounds.copyFrom(value);
        this.createTextField();
    }

    /** The color of the button's state image. Just like every image object, each pixel's
     *  color is multiplied with this value. @default white */
    get color() {
        return this._body.color;
    }

    set color(value) {
        this._body.color = value;
    }

    /** The smoothing type used for the button's state image. */
    get textureSmoothing() {
        return this._body.textureSmoothing;
    }

    set textureSmoothing(value) {
        this._body.textureSmoothing = value;
    }

    /** The overlay sprite is displayed on top of the button contents. It scales with the
     *  button when pressed. Use it to add additional objects to the button (e.g. an icon). */
    get overlay() {
        if (!this._overlay)
            this._overlay = new Sprite();

        this._contents.addChild(this._overlay); // make sure it's always on top
        return this._overlay;
    }

    /** Indicates if the mouse cursor should transform into a hand while it's over the button.
     *  @default true */
    get useHandCursor() {
        return this._useHandCursor;
    }

    set useHandCursor(value) {
        this._useHandCursor = value;
    }

    /** Controls whether or not the instance snaps to the nearest pixel. This can prevent the
     *  object from looking blurry when it's not exactly aligned with the pixels of the screen.
     *  @default true */
    get pixelSnapping() {
        return this._body.pixelSnapping;
    }

    set pixelSnapping(value) {
        const { _textField, _body } = this;

        _body.pixelSnapping = value;
        if (_textField) _textField.pixelSnapping = value;
    }

    get width() {
        return super.width;
    }

    set width(value) {
        const { _textField, _textBounds, _body } = this;

        // The Button might use a Scale9Grid ->
        // we must update the body width/height manually for the grid to scale properly.

        const newWidth = value / (this.scaleX || 1.0);
        const scale = newWidth / (_body.width || 1.0);

        _body.width = newWidth;
        _textBounds.x *= scale;
        _textBounds.width *= scale;

        if (_textField) _textField.width = newWidth;
    }

    get height() {
        return super.height;
    }

    set height(value) {
        const { _textField, _textBounds, _body } = this;
        const newHeight = value / (this.scaleY || 1.0);
        const scale = newHeight / (_body.height || 1.0);

        _body.height = newHeight;
        _textBounds.y *= scale;
        _textBounds.height *= scale;

        if (_textField) _textField.height = newHeight;
    }

    /** The current scaling grid used for the button's state image. Use this property to create
     *  buttons that resize in a smart way, i.e. with the four corners keeping the same size
     *  and only stretching the center area.
     *
     *  @see Image#scale9Grid
     *  @default null
     */
    get scale9Grid() {
        return this._body.scale9Grid;
    }

    set scale9Grid(value) {
        this._body.scale9Grid = value;
    }
}
