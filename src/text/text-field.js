import Event from '../events/event';
import Matrix from '../math/matrix';
import Rectangle from '../math/rectangle';
import MeshBatch from '../display/mesh-batch';
import Starling from '../core/starling';
import RectangleUtil from '../utils/rectangle-util';
import DisplayObjectContainer from '../display/display-object-container';
import Quad from '../display/quad';
import Sprite from '../display/sprite';
import SystemUtil from '../utils/system-util';
import TextFieldAutoSize from './text-field-auto-size';
import TextOptions from './text-options';
import TrueTypeCompositor from './truetype-compositor';
import BitmapFont from './bitmap-font';
import TextFormat from './text-format';

/** A TextField displays text, using either standard true type fonts, custom bitmap fonts,
 *  or a custom text representation.
 *
 *  <p>Access the <code>format</code> property to modify the appearance of the text, like the
 *  font name and size, a color, the horizontal and vertical alignment, etc. The border property
 *  is useful during development, because it lets you see the bounds of the TextField.</p>
 *
 *  <p>There are several types of fonts that can be displayed:</p>
 *
 *  <ul>
 *    <li>Standard TrueType fonts. This renders the text just like a conventional Flash
 *        TextField. It is recommended to embed the font, since you cannot be sure which fonts
 *        are available on the client system, and since this enhances rendering quality.
 *        Simply pass the font name to the corresponding property.</li>
 *    <li>Bitmap fonts. If you need speed or fancy font effects, use a bitmap font instead.
 *        That is a font that has its glyphs rendered to a texture atlas. To use it, first
 *        register the font with the method <code>registerBitmapFont</code>, and then pass
 *        the font name to the corresponding property of the text field.</li>
 *    <li>Custom text compositors. Any class implementing the <code>ITextCompositor</code>
 *        interface can be used to render text. If the two standard options are not sufficient
 *        for your needs, such a compositor might do the trick.</li>
 *  </ul>
 *
 *  <p>For bitmap fonts, we recommend one of the following tools:</p>
 *
 *  <ul>
 *    <li>Windows: <a href="http://www.angelcode.com/products/bmfont">Bitmap Font Generator</a>
 *        from Angel Code (free). Export the font data as an XML file and the texture as a png
 *        with white characters on a transparent background (32 bit).</li>
 *    <li>Mac OS: <a href="http://glyphdesigner.71squared.com">Glyph Designer</a> from
 *        71squared or <a href="http://http://www.bmglyph.com">bmGlyph</a> (both commercial).
 *        They support Starling natively.</li>
 *    <li>Cross-Platform: <a href="http://kvazars.com/littera/">Littera</a> or
 *        <a href="http://renderhjs.net/shoebox/">ShoeBox</a> are great tools, as well.
 *        Both are free to use and were built with Adobe AIR.</li>
 *  </ul>
 *
 *  <p>When using a bitmap font, the 'color' property is used to tint the font texture. This
 *  works by multiplying the RGB values of that property with those of the texture's pixel.
 *  If your font contains just a single color, export it in plain white and change the 'color'
 *  property to any value you like (it defaults to zero, which means black). If your font
 *  contains multiple colors, change the 'color' property to <code>Color.WHITE</code> to get
 *  the intended result.</p>
 *
 *  <strong>Batching of TextFields</strong>
 *
 *  <p>Normally, TextFields will require exactly one draw call. For TrueType fonts, you cannot
 *  avoid that; bitmap fonts, however, may be batched if you enable the "batchable" property.
 *  This makes sense if you have several TextFields with short texts that are rendered one
 *  after the other (e.g. subsequent children of the same sprite), or if your bitmap font
 *  texture is in your main texture atlas.</p>
 *
 *  <p>The recommendation is to activate "batchable" if it reduces your draw calls (use the
 *  StatsDisplay to check this) AND if the text fields contain no more than about 15-20
 *  characters. For longer texts, the batching would take up more CPU time than what is saved
 *  by avoiding the draw calls.</p>
 */
export default class TextField extends DisplayObjectContainer {
    // the name of the "sharedData" container with the registered compositors
    static COMPOSITOR_DATA_NAME = 'starling.display.TextField.compositors';

    _text;
    _options;
    _format;
    _textBounds;
    _hitArea;
    _compositor;
    _requiresRecomposition;
    _border;
    _meshBatch;
    _customStyle;
    _defaultStyle;
    _recomposing;

    // helper objects
    static sMatrix = new Matrix();
    static sDefaultCompositor = new TrueTypeCompositor();

    /** Create a new text field with the given properties. */
    constructor(width, height, text = '', format = null, options = null) {

        super();
        this._text = text || '';
        this._hitArea = new Rectangle(0, 0, width, height);
        this._requiresRecomposition = true;
        this._compositor = TextField.sDefaultCompositor;

        this._format = format ? format.clone() : new TextFormat();
        this._format.addEventListener(Event.CHANGE, this.setRequiresRecomposition);

        this._options = options ? options.clone() : new TextOptions();
        this._options.addEventListener(Event.CHANGE, this.setRequiresRecomposition);

        this._meshBatch = new MeshBatch();
        this._meshBatch.touchable = false;
        this._meshBatch.pixelSnapping = true;
        this.addChild(this._meshBatch);
    }

    /** Disposes the underlying texture data. */
    dispose() {
        this._format.removeEventListener(Event.CHANGE, this.setRequiresRecomposition);
        this._options.removeEventListener(Event.CHANGE, this.setRequiresRecomposition);
        this._compositor.clearMeshBatch(this._meshBatch);

        super.dispose();
    }

    /** @inheritDoc */
    render(painter) {
        if (this._requiresRecomposition) this.recompose();
        super.render(painter);
    }

    /** Forces the text contents to be composed right away.
     *  Normally, it will only do so lazily, i.e. before being rendered. */
    recompose() {
        if (this._requiresRecomposition) {
            this._recomposing = true;
            this._compositor.clearMeshBatch(this._meshBatch);

            const fontName = this._format.font;
            let compositor = TextField.getCompositor(fontName);

            if (!compositor && fontName === BitmapFont.MINI) {
                compositor = new BitmapFont();
                this.registerCompositor(compositor, fontName);
            }

            this._compositor = compositor || TextField.sDefaultCompositor;

            this.updateText();
            this.updateBorder();

            this._requiresRecomposition = false;
            this._recomposing = false;
        }
    }

    // font and border rendering

    updateText() {
        let width = this._hitArea.width;
        let height = this._hitArea.height;

        // Horizontal autoSize does not work for HTML text, since it supports custom alignment.
        // What should we do if one line is aligned to the left, another to the right?

        if (this.isHorizontalAutoSize && !this._options.isHtmlText) width = 100000;
        if (this.isVerticalAutoSize) height = 100000;

        this._meshBatch.x = this._meshBatch.y = 0;
        this._options.textureScale = Starling.contentScaleFactor;
        this._compositor.fillMeshBatch(this._meshBatch, width, height, this._text, this._format, this._options);

        if (this._customStyle) this._meshBatch.style = this._customStyle;
        else {
            this._defaultStyle = this._compositor.getDefaultMeshStyle(this._defaultStyle, this._format, this._options);
            if (this._defaultStyle) this._meshBatch.style = this._defaultStyle;
        }

        if (this._options.autoSize !== TextFieldAutoSize.NONE) {
            this._textBounds = this._meshBatch.getBounds(this._meshBatch, this._textBounds);

            if (this.isHorizontalAutoSize) {
                this._meshBatch.x = this._textBounds.x = -this._textBounds.x;
                this._hitArea.width = this._textBounds.width;
                this._textBounds.x = 0;
            }

            if (this.isVerticalAutoSize) {
                this._meshBatch.y = this._textBounds.y = -this._textBounds.y;
                this._hitArea.height = this._textBounds.height;
                this._textBounds.y = 0;
            }
        } else {
            // hit area doesn't change, and text bounds can be created on demand
            this._textBounds = null;
        }
    }

    updateBorder() {
        if (!this._border) return;

        const width = this._hitArea.width;
        const height = this._hitArea.height;

        const topLine = this._border.getChildAt(0);
        const rightLine = this._border.getChildAt(1);
        const bottomLine = this._border.getChildAt(2);
        const leftLine = this._border.getChildAt(3);

        topLine.width = width;
        topLine.height = 1;
        bottomLine.width = width;
        bottomLine.height = 1;
        leftLine.width = 1;
        leftLine.height = height;
        rightLine.width = 1;
        rightLine.height = height;
        rightLine.x = width - 1;
        bottomLine.y = height - 1;
        topLine.color = rightLine.color = bottomLine.color = leftLine.color = this._format.color;
    }

    /** Forces the text to be recomposed before rendering it in the upcoming frame. Any changes
     *  of the TextField itself will automatically trigger recomposition; changes in its
     *  parents or the viewport, however, need to be processed manually. For example, you
     *  might want to force recomposition to fix blurring caused by a scale factor change.
     */
    setRequiresRecomposition = () => {
        if (!this._recomposing) {
            this._requiresRecomposition = true;
            this.setRequiresRedraw();
        }
    }

    // properties

    get isHorizontalAutoSize() {
        return this._options.autoSize === TextFieldAutoSize.HORIZONTAL ||
            this._options.autoSize === TextFieldAutoSize.BOTH_DIRECTIONS;
    }

    get isVerticalAutoSize() {
        return this._options.autoSize === TextFieldAutoSize.VERTICAL ||
            this._options.autoSize === TextFieldAutoSize.BOTH_DIRECTIONS;
    }

    /** Returns the bounds of the text within the text field. */
    get textBounds() {
        if (this._requiresRecomposition) this.recompose();
        if (!this._textBounds) this._textBounds = this._meshBatch.getBounds(this);
        return this._textBounds.clone();
    }

    /** @inheritDoc */
    getBounds(targetSpace, out = null) {
        if (this._requiresRecomposition) this.recompose();
        this.getTransformationMatrix(targetSpace, TextField.sMatrix);
        return RectangleUtil.getBounds(this._hitArea, TextField.sMatrix, out);
    }

    /** @inheritDoc */
    hitTest(localPoint) {
        if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;
        else if (this._hitArea.containsPoint(localPoint)) return this;
        else return null;
    }

    get width() {
        return super.width;
    }

    /** @inheritDoc */
    set width(value) {
        // different to ordinary display objects, changing the size of the text field should 
        // not change the scaling, but make the texture bigger/smaller, while the size 
        // of the text/font stays the same (this applies to the height, as well).

        this._hitArea.width = value / (this.scaleX || 1.0);
        this.setRequiresRecomposition();
    }

    get height() {
        return super.height;
    }

    /** @inheritDoc */
    set height(value) {
        this._hitArea.height = value / (this.scaleY || 1.0);
        this.setRequiresRecomposition();
    }

    /** The displayed text. */
    get text() {
        return this._text;
    }

    set text(value) {
        if (!value) value = '';
        if (this._text !== value) {
            this._text = value;
            this.setRequiresRecomposition();
        }
    }

    /** The format describes how the text will be rendered, describing the font name and size,
     *  color, alignment, etc.
     *
     *  <p>Note that you can edit the font properties directly; there's no need to reassign
     *  the format for the changes to show up.</p>
     *
     *  <listing>
     *  var textField:TextField = new TextField(100, 30, "Hello Starling");
     *  textField.format.font = "Arial";
     *  textField.format.color = Color.RED;</listing>
     *
     *  @default Verdana, 12 pt, black, centered
     */
    get format() {
        return this._format;
    }

    set format(value) {
        if (!value) throw new Error('[ArgumentError]format cannot be null');
        this._format.copyFrom(value);
    }

    /** The options that describe how the letters of a text should be assembled.
     *  This class basically collects all the TextField's properties that are needed
     *  during text composition. Since an instance of 'TextOptions' is passed to the
     *  constructor, you can pass custom options to the compositor. */
    get options() {
        return this._options;
    }

    /** Draws a border around the edges of the text field. Useful for visual debugging.
     *  @default false */
    get border() {
        return !!this._border;
    }

    set border(value) {
        if (value && !this._border) {
            this._border = new Sprite();
            this.addChild(this._border);

            for (let i = 0; i < 4; ++i)
                this._border.addChild(new Quad(1.0, 1.0));

            this.updateBorder();
        } else if (!value && !!this._border) {
            this._border.removeFromParent(true);
            this._border = null;
        }
    }

    /** Indicates whether the font size is automatically reduced if the complete text does
     *  not fit into the TextField. @default false */
    get autoScale() {
        return this._options.autoScale;
    }

    set autoScale(value) {
        this._options.autoScale = value;
    }

    /** Specifies the type of auto-sizing the TextField will do.
     *  Note that any auto-sizing will implicitly deactivate all auto-scaling.
     *  @default none */
    get autoSize() {
        return this._options.autoSize;
    }

    set autoSize(value) {
        this._options.autoSize = value;
    }

    /** Indicates if the text should be wrapped at word boundaries if it does not fit into
     *  the TextField otherwise. @default true */
    get wordWrap() {
        return this._options.wordWrap;
    }

    set wordWrap(value) {
        this._options.wordWrap = value;
    }

    /** Indicates if TextField should be batched on rendering.
     *
     *  <p>This works only with bitmap fonts, and it makes sense only for TextFields with no
     *  more than 10-15 characters. Otherwise, the CPU costs will exceed any gains you get
     *  from avoiding the additional draw call.</p>
     *
     *  @default false
     */
    get batchable() {
        return this._meshBatch.batchable;
    }

    set batchable(value) {
        this._meshBatch.batchable = value;
    }

    /** Indicates if text should be interpreted as HTML code. For a description
     *  of the supported HTML subset, refer to the classic Flash 'TextField' documentation.
     *  Clickable hyperlinks and images are not supported. Only works for
     *  TrueType fonts! @default false */
    get isHtmlText() {
        return this._options.isHtmlText;
    }

    set isHtmlText(value) {
        this._options.isHtmlText = value;
    }

    /** An optional style sheet to be used for HTML text. For more information on style
     *  sheets, please refer to the StyleSheet class in the ActionScript 3 API reference.
     *  @default null */
    get styleSheet() {
        return this._options.styleSheet;
    }

    set styleSheet(value) {
        this._options.styleSheet = value;
    }

    /** The padding (in points) that's added to the sides of text that's rendered to a Bitmap.
     *  If your text is truncated on the sides (which may happen if the font returns incorrect
     *  bounds), padding can make up for that. Value must be positive. @default 0.0 */
    get padding() {
        return this._options.padding;
    }

    set padding(value) {
        this._options.padding = value;
    }

    /** Controls whether or not the instance snaps to the nearest pixel. This can prevent the
     *  object from looking blurry when it's not exactly aligned with the pixels of the screen.
     *  @default true */
    get pixelSnapping() {
        return this._meshBatch.pixelSnapping;
    }

    set pixelSnapping(value) {
        this._meshBatch.pixelSnapping = value;
    }

    /** The mesh style that is used to render the text.
     *  Note that a style instance may only be used on one mesh at a time. */
    get style() {
        if (this._requiresRecomposition) this.recompose(); // might change style!
        return this._meshBatch.style;
    }

    set style(value) {
        this._customStyle = value;
        this.setRequiresRecomposition();
    }

    /** The default compositor used to arrange the letters of the text.
     *  If a specific compositor was registered for a font, it takes precedence.
     *
     *  @default TrueTypeCompositor
     */
    static get defaultCompositor() {
        return TextField.sDefaultCompositor;
    }

    static set defaultCompositor(value) {
        TextField.sDefaultCompositor = value;
    }

    /** Updates the list of embedded fonts. Call this method when you loaded a TrueType font
     *  at runtime so that Starling can recognize it as such. */
    static updateEmbeddedFonts() {
        SystemUtil.updateEmbeddedFonts();
    }

    // compositor registration

    /** Makes a text compositor (like a <code>BitmapFont</code>) available to any TextField in
     *  the current stage3D context. The font is identified by its name (not case sensitive). */
    static registerCompositor(compositor, fontName) {
        if (!fontName) throw new Error('[ArgumentError] fontName must not be null');
        this.compositors[fontName.toLowerCase()] = compositor;
    }

    /** Unregisters the specified text compositor and optionally disposes it. */
    static unregisterCompositor(fontName, dispose = true) {
        fontName = fontName.toLowerCase();

        if (dispose && TextField.compositors[fontName] !== undefined)
            TextField.compositors[fontName].dispose();

        delete TextField.compositors[fontName];
    }

    /** Returns a registered text compositor (or null, if the font has not been registered).
     *  The <code>fontName</code> is not case sensitive. */
    static getCompositor(fontName) {
        return TextField.compositors[fontName.toLowerCase()];
    }

    /** Returns a registered bitmap font compositor (or null, if no compositor has been
     *  registered with that name, or if it's not a bitmap font). The name is not case
     *  sensitive. */
    static getBitmapFont(name) {
        return TextField.getCompositor(name);
    }

    /** Stores the currently available text compositors. Since compositors will only work
     *  in one Stage3D context, they are saved in Starling's 'contextData' property. */
    static get compositors() {
        let compositors = Starling.painter.sharedData[TextField.COMPOSITOR_DATA_NAME];

        if (!compositors) {
            compositors = new Map();
            Starling.painter.sharedData[TextField.COMPOSITOR_DATA_NAME] = compositors;
        }

        return compositors;
    }
}
