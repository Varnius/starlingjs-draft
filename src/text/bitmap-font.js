import TextOptions from './text-options';
import BitmapCharLocation from './bitmap-char-location';
import BitmapChar from './bitmap-char';
import BitmapFontType from './bitmap-font-type';
import { getMiniBitmapFont } from './mini-bitmap-font';
import Sprite from '../display/sprite';
import Image from '../display/image';
import Align from '../utils/align';
import DistanceFieldStyle from '../styles/distance-field-style';
import TextureSmoothing from '../textures/texture-smoothing';
import Rectangle from '../math/rectangle';
import { createSubtexture } from '../utils/texture-creators';

/** The BitmapFont class parses bitmap font files and arranges the glyphs
 *  in the form of a text.
 *
 *  The class parses the XML format as it is used in the
 *  <a href="http://www.angelcode.com/products/bmfont/">AngelCode Bitmap Font Generator</a> or
 *  the <a href="http://glyphdesigner.71squared.com/">Glyph Designer</a>.
 *  This is what the file format looks like:
 *
 *  <pre>
 *  &lt;font&gt;
 *    &lt;info face="BranchingMouse" size="40" /&gt;
 *    &lt;common lineHeight="40" /&gt;
 *    &lt;pages&gt;  &lt;!-- currently, only one page is supported --&gt;
 *      &lt;page id="0" file="texture.png" /&gt;
 *    &lt;/pages&gt;
 *    &lt;chars&gt;
 *      &lt;char id="32" x="60" y="29" width="1" height="1" xoffset="0" yoffset="27" xadvance="8" /&gt;
 *      &lt;char id="33" x="155" y="144" width="9" height="21" xoffset="0" yoffset="6" xadvance="9" /&gt;
 *    &lt;/chars&gt;
 *    &lt;kernings&gt; &lt;!-- Kerning is optional --&gt;
 *      &lt;kerning first="83" second="83" amount="-4"/&gt;
 *    &lt;/kernings&gt;
 *  &lt;/font&gt;
 *  </pre>
 *
 *  Pass an instance of this class to the method <code>registerBitmapFont</code> of the
 *  TextField class. Then, set the <code>fontName</code> property of the text field to the
 *  <code>name</code> value of the bitmap font. This will make the text field use the bitmap
 *  font.
 */
export default class BitmapFont {
    /** Use this constant for the <code>fontSize</code> property of the TextField class to
     *  render the bitmap font in exactly the size it was created. */
    static NATIVE_SIZE = -1;

    /** The font name of the embedded minimal bitmap font. Use this e.g. for debug output. */
    static MINI = 'mini';

    static CHAR_MISSING = 0;
    static CHAR_TAB = 9;
    static CHAR_NEWLINE = 10;
    static CHAR_CARRIAGE_RETURN = 13;
    static CHAR_SPACE = 32;

    _texture;
    _chars;
    _name;
    _size;
    _lineHeight;
    _baseline;
    _offsetX;
    _offsetY;
    _padding;
    _helperImage;
    _type;
    _distanceFieldSpread;

    // helper objects
    static sLines = [];
    static sDefaultOptions;

    /** Creates a bitmap font from the given texture and font data.
     *  If you don't pass any data, the "mini" font will be created.
     *
     * @param texture  The texture containing all the glyphs.
     * @param fontData Typically an XML file in the standard AngelCode format. Override the
     *                 the 'parseFontData' method to add support for additional formats.
     */
    constructor(texture = null, fontData = null) {
        if (!BitmapFont.sDefaultOptions) BitmapFont.sDefaultOptions = new TextOptions();
        // if no texture is passed in, we create the minimal, embedded font
        if (!texture && !fontData) {
            const miniBitmapFont = getMiniBitmapFont();
            texture = miniBitmapFont.texture;
            fontData = miniBitmapFont.fontData;
        } else if (!texture || !fontData) {
            throw new Error(
                `[ArgumentError] Set both of the 'texture' and 'fontData' arguments
                 to valid objects or leave both of them null.`);
        }

        const { CHAR_MISSING } = BitmapFont;

        this._name = 'unknown';
        this._lineHeight = this._size = this._baseline = 14;
        this._offsetX = this._offsetY = this._padding = 0.0;
        this._texture = texture;
        this._chars = new Map();
        this._helperImage = new Image(texture);
        this._type = BitmapFontType.STANDARD;
        this._distanceFieldSpread = 0.0;

        this.addChar(CHAR_MISSING, new BitmapChar(CHAR_MISSING, null, 0, 0, 0));

        this.parseFontData(fontData);
    }

    /** Disposes the texture of the bitmap font. */
    dispose() {
        if (this._texture)
            this._texture.dispose();
    }

    /** Parses the data that's passed as second argument to the constructor.
     *  Override this method to support different file formats. */
    parseFontData(data) {
        if (data) this.parseFontXml(data);
        else throw new Error('[ArgumentError] BitmapFont only supports XML data');
    }

    parseFontXml(fontXml) {
        const scale = this._texture.scale;
        const frame = this._texture.frame;
        const frameX = frame ? frame.x : 0;
        const frameY = frame ? frame.y : 0;

        this._name = fontXml.font.info._attributes.face;
        this._size = parseFloat(fontXml.font.info._attributes.size) / scale;
        this._lineHeight = parseFloat(fontXml.font.common._attributes.lineHeight) / scale;
        this._baseline = parseFloat(fontXml.font.common._attributes.base) / scale;

        if (fontXml.font.info._attributes.smooth === '0')
            this.smoothing = TextureSmoothing.NONE;

        if (this._size <= 0) {
            console.log(`[Starling] Warning: invalid font size in '${this._name}' font.`);
            this._size = (this._size === 0.0 ? 16.0 : this._size * -1.0);
        }

        if (fontXml.font.distanceField) { // todo: test df fonts
            this._distanceFieldSpread = parseFloat(fontXml.font.distanceField._attributes.distanceRange);
            this._type = fontXml.distanceField._attributes.fieldType === 'msdf' ?
                BitmapFontType.MULTI_CHANNEL_DISTANCE_FIELD : BitmapFontType.DISTANCE_FIELD;
        } else {
            this._distanceFieldSpread = 0.0;
            this._type = BitmapFontType.STANDARD;
        }

        for (const charElement of fontXml.font.chars.char) {
            const id = parseInt(charElement._attributes.id, 10);
            const xOffset = parseFloat(charElement._attributes.xoffset) / scale;
            const yOffset = parseFloat(charElement._attributes.yoffset) / scale;
            const xAdvance = parseFloat(charElement._attributes.xadvance) / scale;

            const region = new Rectangle();
            region.x = parseFloat(charElement._attributes.x) / scale + frameX;
            region.y = parseFloat(charElement._attributes.y) / scale + frameY;
            region.width = parseFloat(charElement._attributes.width) / scale;
            region.height = parseFloat(charElement._attributes.height) / scale;

            const texture = createSubtexture({ texture: this._texture, region });
            const bitmapChar = new BitmapChar(id, texture, xOffset, yOffset, xAdvance);
            this.addChar(id, bitmapChar);
        }

        if (fontXml.font.kernings) {
            for (const kerningElement of fontXml.font.kernings.kerning) {
                const first = parseInt(kerningElement._attributes.first, 10);
                const second = parseInt(kerningElement._attributes.second, 10);
                const amount = parseFloat(kerningElement._attributes.amount, 10) / scale;
                if (this._chars.has(second)) this.getChar(second).addKerning(first, amount);
            }
        }
    }

    /** Returns a single bitmap char with a certain character ID. */
    getChar(charID) {
        return this._chars.get(charID);
    }

    /** Adds a bitmap char with a certain character ID. */
    addChar(charID, bitmapChar) {
        this._chars.set(charID, bitmapChar);
    }

    /** Returns a vector containing all the character IDs that are contained in this font. */
    getCharIDs(out = null) {
        if (!out) out = [];
        this._chars.forEach((value, key) => out[out.length] = parseInt(key, 10)); // todo: ok?
        return out;
    }

    /** Checks whether a provided string can be displayed with the font. */
    hasChars(text) {
        if (!text) return true;

        const { CHAR_CARRIAGE_RETURN, CHAR_TAB, CHAR_NEWLINE, CHAR_SPACE } = BitmapFont;
        let charID;
        const numChars = text.length;

        for (let i = 0; i < numChars; ++i) {
            charID = text.charCodeAt(i);

            if (charID !== CHAR_SPACE && charID !== CHAR_TAB && charID !== CHAR_NEWLINE &&
                charID !== CHAR_CARRIAGE_RETURN && !this.getChar(charID)) {
                return false;
            }
        }

        return true;
    }

    /** Creates a sprite that contains a certain text, made up by one image per char. */
    createSprite(width, height, text, format, options = null) {
        const charLocations = this.arrangeChars(width, height, text, format, options);
        const numChars = charLocations.length;
        const smoothing = this.smoothing;
        const sprite = new Sprite();

        for (let i = 0; i < numChars; ++i) {
            const charLocation = charLocations[i];
            const char = charLocation.char.createImage();
            char.x = charLocation.x;
            char.y = charLocation.y;
            char.scale = charLocation.scale;
            char.color = format.color;
            char.textureSmoothing = smoothing;
            sprite.addChild(char);
        }

        BitmapCharLocation.rechargePool();
        return sprite;
    }

    /** Draws text into a QuadBatch. */
    fillMeshBatch(meshBatch, width, height, text, format, options = null) {
        const charLocations = this.arrangeChars(width, height, text, format, options);
        const numChars = charLocations.length;
        this._helperImage.color = format.color;

        for (let i = 0; i < numChars; ++i) {
            const charLocation = charLocations[i];
            this._helperImage.texture = charLocation.char.texture;
            this._helperImage.readjustSize();
            this._helperImage.x = charLocation.x;
            this._helperImage.y = charLocation.y;
            this._helperImage.scale = charLocation.scale;
            meshBatch.addMesh(this._helperImage);
        }

        BitmapCharLocation.rechargePool();
    }

    /** @inheritDoc */
    clearMeshBatch(meshBatch) {
        meshBatch.clear();
    }

    /** @inheritDoc */
    getDefaultMeshStyle(previousStyle, format) {
        if (this._type === BitmapFontType.STANDARD) return null;
        else { // -> distance field font
            const fontSize = format.size < 0 ? format.size * -this._size : format.size;
            const dfStyle = previousStyle instanceof DistanceFieldStyle ? previousStyle : new DistanceFieldStyle(); // todo: questionable
            dfStyle.multiChannel = (this._type === BitmapFontType.MULTI_CHANNEL_DISTANCE_FIELD);
            dfStyle.softness = this._size / (fontSize * this._distanceFieldSpread);
            return dfStyle;
        }
    }

    /** Arranges the characters of text inside a rectangle, adhering to the given settings.
     *  Returns a Vector of BitmapCharLocations.
     *
     *  <p>BEWARE: This method uses an object pool for the returned vector and all
     *  (returned and temporary) BitmapCharLocation instances. Do not save any references and
     *  always call <code>BitmapCharLocation.rechargePool()</code> when you are done processing.
     *  </p>
     */
    arrangeChars(width, height, text, format, options) {
        if (!text || text.length === 0) return BitmapCharLocation.vectorFromPool();
        if (!options) options = BitmapFont.sDefaultOptions;

        const { CHAR_MISSING, CHAR_SPACE, CHAR_TAB, CHAR_CARRIAGE_RETURN, CHAR_NEWLINE, sLines } = BitmapFont;
        const {
            kerning, leading, letterSpacing: spacing, horizontalAlign: hAlign,
            verticalAlign: vAlign } = format;
        const { autoScale, wordWrap } = options;
        let fontSize = format.size;
        let finished = false;
        let charLocation;
        let numChars;
        let containerWidth;
        let containerHeight;
        let scale;
        let i, j;
        let currentX = 0;
        let currentY = 0;

        if (fontSize < 0) fontSize *= -this._size;

        while (!finished) {
            sLines.length = 0;
            scale = fontSize / this._size;
            containerWidth = (width - 2 * this._padding) / scale;
            containerHeight = (height - 2 * this._padding) / scale;

            if (this._size <= containerHeight) {
                let lastWhiteSpace = -1;
                let lastCharID = -1;
                let currentLine = BitmapCharLocation.vectorFromPool();

                currentX = 0;
                currentY = 0;
                numChars = text.length;
                for (i = 0; i < numChars; ++i) {
                    let lineFull = false;
                    let charID = text.charCodeAt(i);
                    let char = this.getChar(charID);

                    if (charID === CHAR_NEWLINE || charID === CHAR_CARRIAGE_RETURN) {
                        lineFull = true;
                    } else {
                        if (!char) {
                            console.log(`[Starling] Character '${text.charAt(i)}' (id: ${charID}) not found in '${name}'`);
                            charID = CHAR_MISSING;
                            char = this.getChar(CHAR_MISSING);
                        }

                        if (charID === CHAR_SPACE || charID === CHAR_TAB)
                            lastWhiteSpace = i;

                        if (kerning)
                            currentX += char.getKerning(lastCharID);

                        charLocation = BitmapCharLocation.instanceFromPool(char);
                        charLocation.index = i;
                        charLocation.x = currentX + char.xOffset;
                        charLocation.y = currentY + char.yOffset;
                        currentLine[currentLine.length] = charLocation; // push

                        currentX += char.xAdvance + spacing;
                        lastCharID = charID;

                        if (charLocation.x + char.width > containerWidth) {
                            if (wordWrap) {
                                // when autoscaling, we must not split a word in half -> restart
                                if (autoScale && lastWhiteSpace === -1)
                                    break;

                                // remove characters and add them again to next line
                                const numCharsToRemove = lastWhiteSpace === -1 ? 1 : i - lastWhiteSpace;

                                for (j = 0; j < numCharsToRemove; ++j) // faster than 'splice'
                                    currentLine.pop();

                                if (currentLine.length === 0)
                                    break;

                                i -= numCharsToRemove;
                            } else {
                                if (autoScale) break;
                                currentLine.pop();

                                // continue with next line, if there is one
                                while (i < numChars - 1 && text.charCodeAt(i) !== CHAR_NEWLINE)
                                    ++i;
                            }

                            lineFull = true;
                        }
                    }

                    if (i === numChars - 1) {
                        sLines[sLines.length] = currentLine; // push
                        finished = true;
                    } else if (lineFull) {
                        sLines[sLines.length] = currentLine; // push

                        if (lastWhiteSpace === i)
                            currentLine.pop();

                        if (currentY + this._lineHeight + leading + this._size <= containerHeight) {
                            currentLine = BitmapCharLocation.vectorFromPool();
                            currentX = 0;
                            currentY += this._lineHeight + leading;
                            lastWhiteSpace = -1;
                            lastCharID = -1;
                        } else {
                            break;
                        }
                    }
                } // for each char
            } // if (this._lineHeight <= containerHeight)

            if (autoScale && !finished && fontSize > 3)
                fontSize -= 1;
            else
                finished = true;
        } // while (!finished)

        const finalLocations = BitmapCharLocation.vectorFromPool();
        const numLines = sLines.length;
        const bottom = currentY + this._lineHeight;
        let yOffset = 0;

        if (vAlign === Align.BOTTOM) yOffset = containerHeight - bottom;
        else if (vAlign === Align.CENTER) yOffset = (containerHeight - bottom) / 2;

        for (let lineID = 0; lineID < numLines; ++lineID) {
            const line = sLines[lineID];
            numChars = line.length;

            if (numChars === 0) continue;

            let xOffset = 0;
            const lastLocation = line[line.length - 1];
            const right = lastLocation.x - lastLocation.char.xOffset + lastLocation.char.xAdvance;

            if (hAlign === Align.RIGHT) xOffset = containerWidth - right;
            else if (hAlign === Align.CENTER) xOffset = (containerWidth - right) / 2;

            for (let c = 0; c < numChars; ++c) {
                charLocation = line[c];
                charLocation.x = scale * (charLocation.x + xOffset + this._offsetX) + this._padding;
                charLocation.y = scale * (charLocation.y + yOffset + this._offsetY) + this._padding;
                charLocation.scale = scale;

                if (charLocation.char.width > 0 && charLocation.char.height > 0)
                    finalLocations[finalLocations.length] = charLocation;
            }
        }

        return finalLocations;
    }

    /** The name of the font as it was parsed from the font file. */
    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    /** The native size of the font. */
    get size() {
        return this._size;
    }

    set size(value) {
        this._size = value;
    }

    /** The type of the bitmap font. @see starling.text.BitmapFontType @default standard */
    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }

    /** If the font uses a distance field texture, this property returns its spread (i.e.
     *  the width of the blurred edge in points). */
    get distanceFieldSpread() {
        return this._distanceFieldSpread;
    }

    set distanceFieldSpread(value) {
        this._distanceFieldSpread = value;
    }

    /** The height of one line in points. */
    get lineHeight() {
        return this._lineHeight;
    }

    set lineHeight(value) {
        this._lineHeight = value;
    }

    /** The smoothing filter that is used for the texture. */
    get smoothing() {
        return this._helperImage.textureSmoothing;
    }

    set smoothing(value) {
        this._helperImage.textureSmoothing = value;
    }

    /** The baseline of the font. This property does not affect text rendering;
     *  it's just an information that may be useful for exact text placement. */
    get baseline() {
        return this._baseline;
    }

    set baseline(value) {
        this._baseline = value;
    }

    /** An offset that moves any generated text along the x-axis (in points).
     *  Useful to make up for incorrect font data. @default 0. */
    get offsetX() {
        return this._offsetX;
    }

    set offsetX(value) {
        this._offsetX = value;
    }

    /** An offset that moves any generated text along the y-axis (in points).
     *  Useful to make up for incorrect font data. @default 0. */
    get offsetY() {
        return this._offsetY;
    }

    set offsetY(value) {
        this._offsetY = value;
    }

    /** The width of a "gutter" around the composed text area, in points.
     *  This can be used to bring the output more in line with standard TrueType rendering:
     *  Flash always draws them with 2 pixels of padding. @default 0.0 */
    get padding() {
        return this._padding;
    }

    set padding(value) {
        this._padding = value;
    }

    /** The underlying texture that contains all the chars. */
    get texture() {
        return this._texture;
    }
}
