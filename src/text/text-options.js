import { RGBA } from 'gl-constants';

import Starling from '../core/starling';
import Event from '../events/event';
import TextFieldAutoSize from './text-field-auto-size';
import EventDispatcher from '../events/event-dispatcher';

/** The TextOptions class contains data that describes how the letters of a text should
 *  be assembled on text composition.
 *
 *  <p>Note that not all properties are supported by all text compositors.</p>
 */
export default class TextOptions extends EventDispatcher {
    _wordWrap;
    _autoScale;
    _autoSize;
    _isHtmlText;
    _textureScale;
    _textureFormat;
    _styleSheet;
    _padding;

    /** Creates a new TextOptions instance with the given properties. */
    constructor(wordWrap = true, autoScale = false) {
        super();
        this._wordWrap = wordWrap;
        this._autoScale = autoScale;
        this._autoSize = TextFieldAutoSize.NONE;
        this._textureScale = Starling.contentScaleFactor;
        this._textureFormat = RGBA;
        this._isHtmlText = false;
        this._padding = 0.0;
    }

    /** Copies all properties from another TextOptions instance. */
    copyFrom(options) {
        this._wordWrap = options._wordWrap;
        this._autoScale = options._autoScale;
        this._autoSize = options._autoSize;
        this._isHtmlText = options._isHtmlText;
        this._textureScale = options._textureScale;
        this._textureFormat = options._textureFormat;
        this._styleSheet = options._styleSheet;
        this._padding = options._padding;

        this.dispatchEventWith(Event.CHANGE);
    }

    /** Creates a clone of this instance. */
    clone() {
        const clone = new this.constructor();
        clone.copyFrom(this);
        return clone;
    }

    /** Indicates if the text should be wrapped at word boundaries if it does not fit into
     *  the TextField otherwise. @default true */
    get wordWrap() {
        return this._wordWrap;
    }

    set wordWrap(value) {
        if (this._wordWrap !== value) {
            this._wordWrap = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Specifies the type of auto-sizing set on the TextField. Custom text compositors may
     *  take this into account, though the basic implementation (done by the TextField itself)
     *  is often sufficient: it passes a very big size to the <code>fillMeshBatch</code>
     *  method and then trims the result to the actually used area. @default none */
    get autoSize() {
        return this._autoSize;
    }

    set autoSize(value) {
        if (this._autoSize !== value) {
            this._autoSize = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates whether the font size is automatically reduced if the complete text does
     *  not fit into the TextField. @default false */
    get autoScale() {
        return this._autoScale;
    }

    set autoScale(value) {
        if (this._autoScale !== value) {
            this._autoScale = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates if text should be interpreted as HTML code. For a description
     *  of the supported HTML subset, refer to the classic Flash 'TextField' documentation.
     *  Beware: Only supported for TrueType fonts. @default false */
    get isHtmlText() {
        return this._isHtmlText;
    }

    set isHtmlText(value) {
        if (this._isHtmlText !== value) {
            this._isHtmlText = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** An optional style sheet to be used for HTML text. @default null */
    get styleSheet() {
        return this._styleSheet;
    }

    set styleSheet(value) {
        this._styleSheet = value;
        this.dispatchEventWith(Event.CHANGE);
    }

    /** The scale factor of any textures that are created during text composition.
     *  The optimal value for this property is determined directly before rendering;
     *  manual changes will be ignored.
     *
     *  <p>Note that this property does NOT dispatch <code>CHANGE</code> events.</p>
     */
    get textureScale() {
        return this._textureScale;
    }

    set textureScale(value) {
        this._textureScale = value;
    }

    /** The Context3DTextureFormat of any textures that are created during text composition.
     *  @default Context3DTextureFormat.BGRAthis._PACKED */
    get textureFormat() {
        return this._textureFormat;
    }

    set textureFormat(value) {
        if (this._textureFormat !== value) {
            this._textureFormat = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The padding (in points) that's added to the sides of text that's rendered to a Bitmap.
     *  If your text is truncated on the sides (which may happen if the font returns incorrect
     *  bounds), padding can make up for that. Value must be positive. @default 0.0 */
    get padding() {
        return this._padding;
    }

    set padding(value) {
        if (value < 0) value = 0;
        if (this._padding !== value) {
            this._padding = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }
}
