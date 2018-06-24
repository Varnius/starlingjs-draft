import EventDispatcher from '../events/event-dispatcher';
import Align from '../utils/align';

/** The TextFormat class represents character formatting information. It is used by the
 *  TextField and BitmapFont classes to characterize the way the glyphs will be rendered.
 *
 *  <p>Note that not all properties are used by all font renderers: bitmap fonts ignore
 *  the "bold", "italic", and "underline" values.</p>
 */
export default class TextFormat extends EventDispatcher {
    _font;
    _size;
    _color;
    _bold;
    _italic;
    _underline;
    _horizontalAlign;
    _verticalAlign;
    _kerning;
    _leading;
    _letterSpacing;

    /** Creates a new TextFormat instance with the given properties. */
    constructor(font = 'Verdana', size = 12, color = 0x0, horizontalAlign = 'center', verticalAlign = 'center') {
        super();
        this._font = font;
        this._size = size;
        this._color = color;
        this._horizontalAlign = horizontalAlign;
        this._verticalAlign = verticalAlign;
        this._kerning = true;
        this._letterSpacing = this._leading = 0.0;
    }

    /** Copies all properties from another TextFormat instance. */
    copyFrom(format) {
        this._font = format._font;
        this._size = format._size;
        this._color = format._color;
        this._bold = format._bold;
        this._italic = format._italic;
        this._underline = format._underline;
        this._horizontalAlign = format._horizontalAlign;
        this._verticalAlign = format._verticalAlign;
        this._kerning = format._kerning;
        this._leading = format._leading;
        this._letterSpacing = format._letterSpacing;

        this.dispatchEventWith(Event.CHANGE);
    }

    /** Creates a clone of this instance. */
    clone() {
        const clone = new this.constructor();
        clone.copyFrom(this);
        return clone;
    }

    /** Sets the most common properties at once. */
    setTo(font = 'Verdana', size = 12, color = 0x0,
          horizontalAlign = 'center', verticalAlign = 'center') {
        this._font = font;
        this._size = size;
        this._color = color;
        this._horizontalAlign = horizontalAlign;
        this._verticalAlign = verticalAlign;

        this.dispatchEventWith(Event.CHANGE);
    }

    /** Converts the Starling TextFormat instance to a Flash TextFormat. */
    //toNativeFormat(out = null) {
    //    if (out === null) out = new TextFormat(); // todo: native
    //
    //    out.font = this._font;
    //    out.size = this._size;
    //    out.color = this._color;
    //    out.bold = this._bold;
    //    out.italic = this._italic;
    //    out.underline = this._underline;
    //    out.align = this._horizontalAlign;
    //    out.kerning = this._kerning;
    //    out.leading = this._leading;
    //    out.letterSpacing = this._letterSpacing;
    //
    //    return out;
    //}

    /** The name of the font. TrueType fonts will be looked up from embedded fonts and
     *  system fonts; bitmap fonts must be registered at the TextField class first.
     *  Beware: If you loaded an embedded font at runtime, you must call
     *  <code>TextField.updateEmbeddedFonts()</code> for Starling to recognize it.
     */
    get font() {
        return this._font;
    }

    set font(value) {
        if (value !== this._font) {
            this._font = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The size of the font. For bitmap fonts, use <code>BitmapFont.NATIVEthis._SIZE</code> for
     *  the original size. */
    get size() {
        return this._size;
    }

    set size(value) {
        if (value !== this._size) {
            this._size = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The color of the text. Note that bitmap fonts should be exported in plain white so
     *  that tinting works correctly. If your bitmap font contains colors, set this property
     *  to <code>Color.WHITE</code> to get the desired result. @default black */
    get color() {
        return this._color;
    }

    set color(value) {
        if (value !== this._color) {
            this._color = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates whether the text is bold. @default false */
    get bold() {
        return this._bold;
    }

    set bold(value) {
        if (value !== this._bold) {
            this._bold = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates whether the text is italicized. @default false */
    get italic() {
        return this._italic;
    }

    set italic(value) {
        if (value !== this._italic) {
            this._italic = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates whether the text is underlined. @default false */
    get underline() {
        return this._underline;
    }

    set underline(value) {
        if (value !== this._underline) {
            this._underline = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The horizontal alignment of the text. @default center
     *  @see starling.utils.Align */
    get horizontalAlign() {
        return this._horizontalAlign;
    }

    set horizontalAlign(value) {
        if (!Align.isValidHorizontal(value))
            throw new Error('[ArgumentError] Invalid horizontal alignment');

        if (value !== this._horizontalAlign) {
            this._horizontalAlign = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The vertical alignment of the text. @default center
     *  @see starling.utils.Align */
    get verticalAlign() {
        return this._verticalAlign;
    }

    set verticalAlign(value) {
        if (!Align.isValidVertical(value))
            throw new Error('[ArgumentError] Invalid vertical alignment');

        if (value !== this._verticalAlign) {
            this._verticalAlign = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** Indicates whether kerning is enabled. Kerning adjusts the pixels between certain
     *  character pairs to improve readability. @default true */
    get kerning() {
        return this._kerning;
    }

    set kerning(value) {
        if (value !== this._kerning) {
            this._kerning = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** The amount of vertical space (called 'leading') between lines. @default 0 */
    get leading() {
        return this._leading;
    }

    set leading(value) {
        if (value !== this._leading) {
            this._leading = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }

    /** A number representing the amount of space that is uniformly distributed between all characters. @default 0 */
    get letterSpacing() {
        return this._letterSpacing;
    }

    set letterSpacing(value) {
        if (value !== this._letterSpacing) {
            this._letterSpacing = value;
            this.dispatchEventWith(Event.CHANGE);
        }
    }
}
