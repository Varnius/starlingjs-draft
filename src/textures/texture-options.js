import Starling from '../core/starling';

/** The TextureOptions class specifies options for loading textures with the
 *  <code>Texture.fromData</code> and <code>Texture.fromTextureBase</code> methods. */
export default class TextureOptions {
    _scale;
    _format;
    _mipMapping;
    _optimizeForRenderToTexture = false;
    _premultipliedAlpha;
    _forcePotTexture;
    _onReady = null;

    /** Creates a new instance with the given options. */
    constructor(scale = 1.0, mipMapping = false, format = 'bgra', premultipliedAlpha = true, forcePotTexture = false)
    {
        this._scale = scale;
        this._format = format;
        this._mipMapping = mipMapping;
        this._forcePotTexture = forcePotTexture;
        this._premultipliedAlpha = premultipliedAlpha;
    }

    /** Creates a clone of the TextureOptions object with the exact same properties. */
    clone()
    {
        const clone = new TextureOptions(this._scale, this._mipMapping, this._format);
        clone._optimizeForRenderToTexture = this._optimizeForRenderToTexture;
        clone._premultipliedAlpha = this._premultipliedAlpha;
        clone._forcePotTexture = this._forcePotTexture;
        clone._onReady = this._onReady;
        return clone;
    }

    /** The scale factor, which influences width and height properties. If you pass '-1',
     *  the current global content scale factor will be used. @default 1.0 */
    get scale()
    {
        return this._scale;
    }

    set scale(value)
    {
        this._scale = value > 0 ? value : Starling.contentScaleFactor;
    }

    /** The <code>Context3DTextureFormat</code> of the underlying texture data. Only used
     *  for textures that are created from Bitmaps; the format of ATF files is set when they
     *  are created. @default BGRA */
    get format()
    {
        return this._format;
    }

    set format(value)
    {
        this._format = value;
    }

    /** Indicates if the texture contains mip maps. @default false */
    get mipMapping()
    {
        return this._mipMapping;
    }

    set mipMapping(value)
    {
        this._mipMapping = value;
    }

    /** Indicates if the texture will be used as render target. */
    get optimizeForRenderToTexture()
    {
        return this._optimizeForRenderToTexture;
    }

    set optimizeForRenderToTexture(value)
    {
        this._optimizeForRenderToTexture = value;
    }

    /** Indicates if the underlying Stage3D texture should be created as the power-of-two based
     *  <code>Texture</code> class instead of the more memory efficient <code>RectangleTexture</code>.
     *  That might be useful when you need to render the texture with wrap mode <code>repeat</code>.
     *  @default false */
    get forcePotTexture()
    {
        return this._forcePotTexture;
    }

    set forcePotTexture(value)
    {
        this._forcePotTexture = value;
    }

    /** If this value is set, the texture will be loaded asynchronously (if possible).
     *  The texture can only be used when the callback has been executed.
     *
     *  <p>This is the expected function definition:
     *  <code>function(texture:Texture);</code></p>
     *
     *  @default null
     */
    get onReady()
    {
        return this._onReady;
    }

    set onReady(value)
    {
        this._onReady = value;
    }

    /** Indicates if the alpha values are premultiplied into the RGB values. This is typically
     *  true for textures created from BitmapData and false for textures created from ATF data.
     *  This property will only be read by the <code>Texture.fromTextureBase</code> factory
     *  method. @default true */
    get premultipliedAlpha()
    {
        return this._premultipliedAlpha;
    }

    set premultipliedAlpha(value)
    {
        this._premultipliedAlpha = value;
    }
}
