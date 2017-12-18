import { RGBA, LINEAR_MIPMAP_LINEAR, LINEAR } from 'gl-constants';

import Starling from '../core/starling';
import SubTexture from '../textures/subtexture';
import ConcreteTexture from '../textures/concrete-texture';
import Rectangle from '../math/rectangle';

/** Creates a texture with a certain size and color.
 *
 *  @param width   in points; number of pixels depends on scale parameter
 *  @param height  in points; number of pixels depends on scale parameter
 *  @param color   the RGB color the texture will be filled up
 *  @param alpha   the alpha value that will be used for every pixel
 *  @param scale   if you omit this parameter, 'Starling.contentScaleFactor' will be used.
 *  @param format  the context3D texture format to use. Pass one of the packed or
 *                 compressed formats to save memory.
 */
export function createTextureFromColor({ width, height, color = 0xffffff, alpha = 1.0, scale = -1, format = RGBA })
{
    const texture = createEmptyTexture({ width, height, premultipliedAlpha: true, scale, format });
    texture.root.clear(color, alpha);
    texture.root.onRestore = function ()
    {
        texture.root.clear(color, alpha);
    };

    return texture;
}

/** Creates an empty texture of a certain size.
 *  Beware that the texture can only be used after you either upload some color data
 *  ("texture.root.upload...") or clear the texture ("texture.root.clear()").
 *
 *  @param width   in points; number of pixels depends on scale parameter
 *  @param height  in points; number of pixels depends on scale parameter
 *  @param premultipliedAlpha  the PMA format you will use the texture with. If you will
 *                 use the texture for bitmap data, use "true"; for ATF data, use "false".
 *  @param scale   if you omit this parameter, 'Starling.contentScaleFactor' will be used.
 *  @param format  the context3D texture format to use. Pass one of the packed or
 *                 compressed formats to save memory (at the price of reduced image quality).
 */
export function createEmptyTexture(params)
{
    return createWithData({ ...params, data: null });
}

export function createTextureFromData(params)
{
    return createWithData({ ...params });
}

const createWithData = ({
    data,
    width = 1,
    height = 1,
    premultipliedAlpha = true,
    generateMipMaps = false,
    scale = -1,
    format = RGBA,
    }) =>
{
    if (scale <= 0) scale = Starling.contentScaleFactor;

    const gl = Starling.context;

    if (!gl) throw new Error('[ContextError] Missing context');

    const origWidth = width * scale;
    const origHeight = height * scale;

    const actualWidth = Math.ceil(origWidth - 0.000000001); // avoid floating point errors
    const actualHeight = Math.ceil(origHeight - 0.000000001);

    const nativeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, nativeTexture);

    const border = 0;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, border, format, gl.UNSIGNED_BYTE, data);

    // todo: parameterize this?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, LINEAR);

    if (generateMipMaps)
    {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    const concreteTexture = new ConcreteTexture(nativeTexture, format, actualWidth, actualHeight, premultipliedAlpha, scale);
    concreteTexture.onRestore = concreteTexture.clear; //todo: check if this works

    if (actualWidth - origWidth < 0.001 && actualHeight - origHeight < 0.001)
        return concreteTexture;
    else
        return new SubTexture(concreteTexture, new Rectangle(0, 0, width, height), true);
};

/** Creates a texture from a <code>TextureBase</code> object.
 *
 *  @param base     a Stage3D texture object created through the current context.
 *  @param width    the width of the texture in pixels (not points!).
 *  @param height   the height of the texture in pixels (not points!).
 *  @param options  specifies options about the texture settings, e.g. the scale factor.
 *                  If left empty, the default options will be used. Note that not all
 *                  options are supported by all texture types.
 */
//static fromTextureBase(base, width, height, optionsOptions = null)
//{
//        if (options == null) options = sDefaultOptions;
//
//        if (base is flash.display3D.textures.Texture)
//        {
//            return new ConcretePotTexture(base as flash.display3D.textures.Texture,
//                options.format, width, height, options.mipMapping,
//                options.premultipliedAlpha, options.optimizeForRenderToTexture,
//                options.scale);
//        }
//    else if (base is RectangleTexture)
//        {
//            return new ConcreteRectangleTexture(base as RectangleTexture,
//                options.format, width, height, options.premultipliedAlpha,
//                options.optimizeForRenderToTexture, options.scale);
//        }
//    else if (base is VideoTexture)
//        {
//            return new ConcreteVideoTexture(base as VideoTexture, options.scale);
//        }
//    else
//    throw new ArgumentError("Unsupported 'base' type: " + getQualifiedClassName(base));
//}

/** Creates a texture object from a bitmap.
 *  Beware: you must not dispose the bitmap's data if Starling should handle a lost device
 *  context (except if you handle restoration yourself via "texture.root.onRestore").
 *
 *  @param bitmap   the texture will be created with the bitmap data of this object.
 *  @param generateMipMaps  indicates if mipMaps will be created.
 *  @param optimizeForRenderToTexture  indicates if this texture will be used as
 *                  render target
 *  @param scale    the scale factor of the created texture. This affects the reported
 *                  width and height of the texture object.
 *  @param format   the context3D texture format to use. Pass one of the packed or
 *                  compressed formats to save memory (at the price of reduced image
 *                  quality).
 *  @param forcePotTexture  indicates if the underlying Stage3D texture should be created
 *                  as the power-of-two based "Texture" class instead of the more memory
 *                  efficient "RectangleTexture".
 *  @param async    If you pass a callback function, the texture will be uploaded
 *                  asynchronously, which allows smooth rendering even during the
 *                  loading process. However, don't use the texture before the callback
 *                  has been executed. This is the expected function definition:
 *                  <code>function(texture, error:ErrorEvent);</code>
 *                  The second parameter is optional and typically <code>null</code>.
 */
//static fromBitmap(bitmap:Bitmap, generateMipMaps = false,
//                                  optimizeForRenderToTexture = false,
//                                  scale = 1, format = "bgra",
//                                  forcePotTexture = false,
//                                  async = null)
//{
//    return Texture.fromBitmapData(bitmap.bitmapData, generateMipMaps, optimizeForRenderToTexture,
//        scale, format, forcePotTexture, async);
//}

/** Creates a texture object from bitmap data.
 *  Beware: you must not dispose 'data' if Starling should handle a lost device context
 *  (except if you handle restoration yourself via "texture.root.onRestore").
 *
 *  @param data     the bitmap data to upload to the texture.
 *  @param generateMipMaps  indicates if mipMaps will be created.
 *  @param optimizeForRenderToTexture  indicates if this texture will be used as
 *                  render target
 *  @param scale    the scale factor of the created texture. This affects the reported
 *                  width and height of the texture object.
 *  @param format   the context3D texture format to use. Pass one of the packed or
 *                  compressed formats to save memory (at the price of reduced image
 *                  quality).
 *  @param forcePotTexture  indicates if the underlying Stage3D texture should be created
 *                  as the power-of-two based "Texture" class instead of the more memory
 *                  efficient "RectangleTexture".
 *  @param async    If you pass a callback function, the texture will be uploaded
 *                  asynchronously, which allows smooth rendering even during the
 *                  loading process. However, don't use the texture before the callback
 *                  has been executed. This is the expected function definition:
 *                  <code>function(texture, error:ErrorEvent);</code>
 *                  The second parameter is optional and typically <code>null</code>.
 */
//static fromBitmapData(data:BitmapData, generateMipMaps=false,
//                                      optimizeForRenderToTexture=false,
//                                      scale=1, format="bgra",
//                                      forcePotTexture=false,
//                                      async=null)
//{
//    var texture = Texture.empty(data.width / scale, data.height / scale, true,
//        generateMipMaps, optimizeForRenderToTexture, scale,
//        format, forcePotTexture);
//    texture.root.uploadBitmapData(data,
//        async != null ? function() { execute(async, texture); } : null);
//    texture.root.onRestore = function() { texture.root.uploadBitmapData(data); };
//    return texture;
//}

/** Creates a video texture from a NetStream.
 *
 *  <p>Below, you'll find  a minimal sample showing how to stream a video from a file.
 *  Note that <code>ns.play()</code> is called only after creating the texture, and
 *  outside the <code>onComplete</code>-callback. It's recommended to always make the
 *  calls in this order; otherwise, playback won't start on some platforms.</p>
 *
 *  <listing>
 *  var nc:NetConnection = new NetConnection();
 *  nc.connect(null);
 *
 *  var ns:NetStream = new NetStream(nc);
 *  var texture = Texture.fromNetStream(ns, 1, function()
 *  {
         *      addChild(new Image(texture));
         *  });
 *
 *  var file:File = File.applicationDirectory.resolvePath("bugs-bunny.m4v");
 *  ns.play(file.url);</listing>
 *
 *  @param stream  the NetStream from which the video data is streamed. Beware that 'play'
 *                 should be called only after the method returns, and outside the
 *                 <code>onComplete</code> callback.
 *  @param scale   the scale factor of the created texture. This affects the reported
 *                 width and height of the texture object.
 *  @param onComplete will be executed when the texture is ready. Contains a parameter
 *                 of type 'Texture'.
 */
//static fromNetStream(stream:NetStream, scale=1,
//                                     onComplete=null)
//{
//    // workaround for bug in NetStream class:
//    if (stream.client == stream && !("onMetaData" in stream))
//        stream.client = { onMetaData: function(md) {} };
//
//    return fromVideoAttachment("NetStream", stream, scale, onComplete);
//}

/** Creates a video texture from a camera. Beware that the texture must not be used
 *  before the 'onComplete' callback has been executed; until then, it will have a size
 *  of zero pixels.
 *
 *  <p>Here is a minimal sample showing how to display a camera video:</p>
 *
 *  <listing>
 *  var camera:Camera = Camera.getCamera();
 *  var texture = Texture.fromCamera(camera, 1, function()
 *  {
         *      addChild(new Image(texture));
         *  });</listing>
 *
 *  @param camera  the camera from which the video data is streamed.
 *  @param scale   the scale factor of the created texture. This affects the reported
 *                 width and height of the texture object.
 *  @param onComplete will be executed when the texture is ready. May contain a parameter
 *                 of type 'Texture'.
 */
//static fromCamera(camera, scale = 1, onComplete = null)
//{
//    return fromVideoAttachment("Camera", camera, scale, onComplete);
//}

//static fromVideoAttachment(type, attachment,
//                                            scale, onComplete)
//{
//    if (!SystemUtil.supportsVideoTexture)
//        throw new NotSupportedError("Video Textures are not supported on this platform");
//
//    var context:Context3D = Starling.context;
//    if (context == null) throw new MissingContextError();
//
//    var base:VideoTexture = context.createVideoTexture();
//    var texture = new ConcreteVideoTexture(base, scale);
//    texture.attachVideo(type, attachment, onComplete);
//    texture.onRestore = function()
//    {
//        texture.root.attachVideo(type, attachment);
//    };
//
//    return texture;
//}

/** Creates a texture that contains a region (in pixels) of another texture. The new
 *  texture will reference the base texture; no data is duplicated.
 *
 *  @param texture  The texture you want to create a SubTexture from.
 *  @param region   The region of the parent texture that the SubTexture will show
 *                  (in points).
 *  @param frame    If the texture was trimmed, the frame rectangle can be used to restore
 *                  the trimmed area.
 *  @param rotated  If true, the SubTexture will show the parent region rotated by
 *                  90 degrees (CCW).
 *  @param scaleModifier  The scale factor of the new texture will be calculated by
 *                  multiplying the parent texture's scale factor with this value.
 */
//static fromTexture(texture, region = null, frame = null, rotated = false, scaleModifier = 1.0)
//{
//    return new SubTexture(texture, region, false, frame, rotated, scaleModifier);
//}
