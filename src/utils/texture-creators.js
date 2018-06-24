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
export const createTextureFromColor = ({ width, height, color = 0xffffff, alpha = 1.0, scale = -1, format = RGBA }) => {
    const texture = createEmptyTexture({ width, height, premultipliedAlpha: true, scale, format });
    texture.root.clear(color, alpha);
    texture.root.onRestore = function () {
        texture.root.clear(color, alpha);
    };

    return texture;
};

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
export const createEmptyTexture = params => createWithData({ ...params, data: null });

export const createTextureFromData = params => createWithData({ ...params });

const createWithData = ({
    data,
    width = 1,
    height = 1,
    premultipliedAlpha = true,
    generateMipMaps = false,
    scale = -1,
    format = RGBA,
    minFilter = LINEAR_MIPMAP_LINEAR,
    magFilter = LINEAR,
    }) => {
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

    if (generateMipMaps) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    const concreteTexture = new ConcreteTexture(nativeTexture, format, actualWidth, actualHeight, premultipliedAlpha, scale);
    concreteTexture.onRestore = concreteTexture.clear; //todo: check if this works

    if (actualWidth - origWidth < 0.001 && actualHeight - origHeight < 0.001)
        return concreteTexture;
    else
        return new SubTexture(concreteTexture, new Rectangle(0, 0, width, height), true);
};

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
export const createSubtexture = ({ texture, region, frame, rotated, scaleModifier = 1.0 }) =>
    new SubTexture(texture, region, false, frame, rotated, scaleModifier);
