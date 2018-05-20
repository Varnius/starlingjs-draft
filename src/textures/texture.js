import Point from '../math/point';
import Matrix from '../math/matrix';
import Rectangle from '../math/rectangle';
import MatrixUtil from '../utils/matrix-util';
import TextureOptions from './texture-options';

/** <p>A texture stores the information that represents an image. It cannot be added to the
 *  display list directly; instead it has to be mapped onto a display object. In Starling,
 *  the most probably candidate for this job is the <code>Image</code> class.</p>
 *
 *  <strong>Creating a texture</strong>
 *
 *  <p>The <code>Texture</code> class is abstract, i.e. you cannot create instance of this
 *  class through its constructor. Instead, it offers a variety of factory methods, like
 *  <code>fromBitmapData</code> or <code>fromEmbeddedAsset</code>.</p>
 *
 *  <strong>Texture Formats</strong>
 *
 *  <p>Since textures can be created from a "BitmapData" object, Starling supports any bitmap
 *  format that is supported by Flash. And since you can render any Flash display object into
 *  a BitmapData object, you can use this to display non-Starling content in Starling - e.g.
 *  Shape objects.</p>
 *
 *  <p>Starling also supports ATF textures (Adobe Texture Format), which is a container for
 *  compressed texture formats that can be rendered very efficiently by the GPU. Refer to
 *  the Flash documentation for more information about this format.</p>
 *
 *  <p>Beginning with AIR 17, you can use Starling textures to show video content (if the
 *  current platform supports it; see "SystemUtil.supportsVideoTexture").
 *  The two factory methods "fromCamera" and "fromNetStream" allow you to make use of
 *  this feature.</p>
 *
 *  <strong>Mip Mapping</strong>
 *
 *  <p>MipMaps are scaled down versions of a texture. When an image is displayed smaller than
 *  its natural size, the GPU may display the mip maps instead of the original texture. This
 *  reduces aliasing and accelerates rendering. It does, however, also need additional memory;
 *  for that reason, mipmapping is disabled by default.</p>
 *
 *  <strong>Texture Frame</strong>
 *
 *  <p>The frame property of a texture allows you to let a texture appear inside the bounds of
 *  an image, leaving a transparent border around the texture. The frame rectangle is specified
 *  in the coordinate system of the texture (not the image):</p>
 *
 *  <listing>
 *  var frame:Rectangle = new Rectangle(-10, -10, 30, 30);
 *  var texture = Texture.fromTexture(anotherTexture, null, frame);
 *  var image:Image = new Image(texture);</listing>
 *
 *  <p>This code would create an image with a size of 30x30, with the texture placed at
 *  <code>x=10, y=10</code> within that image (assuming that 'anotherTexture' has a width and
 *  height of 10 pixels, it would appear in the middle of the image).</p>
 *
 *  <p>The texture atlas makes use of this feature, as it allows to crop transparent edges
 *  of a texture and making up for the changed size by specifying the original texture frame.
 *  Tools like <a href="http://www.texturepacker.com/">TexturePacker</a> use this to
 *  optimize the atlas.</p>
 *
 *  <strong>Texture Coordinates</strong>
 *
 *  <p>If, on the other hand, you want to show only a part of the texture in an image
 *  (i.e. to crop the the texture), you can either create a subtexture (with the method
 *  'Texture.fromTexture()' and specifying a rectangle for the region), or you can manipulate
 *  the texture coordinates of the image object. The method <code>image.setTexCoords</code>
 *  allows you to do that.</p>
 *
 *  <strong>Context Loss</strong>
 *
 *  <p>When the current rendering context is lost (which can happen on all platforms, but is
 *  especially common on Android and Windows), all texture data is destroyed. However,
 *  Starling will try to restore the textures. To do that, it will keep the bitmap
 *  and ATF data in memory - at the price of increased RAM consumption. You can optimize
 *  this behavior, though, by restoring the texture directly from its source, like in this
 *  example:</p>
 *
 *  <listing>
 *  var texture = Texture.fromBitmap(new EmbeddedBitmap());
 *  texture.root.onRestore = function()
 *  {
     *      texture.root.uploadFromBitmap(new EmbeddedBitmap());
     *  };</listing>
 *
 *  <p>The <code>onRestore</code>-method will be called when the context was lost and the
 *  texture has been recreated (but is still empty). If you use the "AssetManager" class to
 *  manage your textures, this will be done automatically.</p>
 *
 *  @see starling.display.Image
 *  @see starling.utils.AssetManager
 *  @see starling.utils.SystemUtil
 *  @see TextureAtlas
 */
export default class Texture {
    // helper objects
    static sDefaultOptions = new TextureOptions();
    static sRectangle = new Rectangle();
    static sMatrix = new Matrix();
    static sPoint = new Point();

    /** @private */
    constructor() {
        //if (Capabilities.isDebugger &&
        //    getQualifiedClassName(this) == "starling.textures:")
        //{
        //    throw new AbstractClassError();
        //}
    }

    /** Disposes the underlying texture data. Note that not all textures need to be disposed:
     *  SubTextures (created with 'Texture.fromTexture') just reference other textures and
     *  and do not take up resources themselves; this is also true for textures from an
     *  atlas. */
    dispose() {
        // override in subclasses
    }

    /** Sets up a VertexData instance with the correct positions for 4 vertices so that
     *  the texture can be mapped onto it unscaled. If the texture has a <code>frame</code>,
     *  the vertices will be offset accordingly.
     *
     *  @param vertexData  the VertexData instance to which the positions will be written.
     *  @param vertexID    the start position within the VertexData instance.
     *  @param attrName    the attribute name referencing the vertex positions.
     *  @param bounds      useful only for textures with a frame. This will position the
     *                     vertices at the correct position within the given bounds,
     *                     distorted appropriately.
     */
    setupVertexPositions(vertexData, vertexID = 0, attrName = 'position', bounds = null) {
        const { sRectangle, sMatrix } = Texture;
        const frame = this.frame;
        const width = this.width;
        const height = this.height;

        if (frame)
            sRectangle.setTo(-frame.x, -frame.y, width, height);
        else
            sRectangle.setTo(0, 0, width, height);

        vertexData.setPoint(vertexID, attrName, sRectangle.left, sRectangle.top);
        vertexData.setPoint(vertexID + 1, attrName, sRectangle.right, sRectangle.top);
        vertexData.setPoint(vertexID + 2, attrName, sRectangle.left, sRectangle.bottom);
        vertexData.setPoint(vertexID + 3, attrName, sRectangle.right, sRectangle.bottom);

        if (bounds) {
            const scaleX = bounds.width / this.frameWidth;
            const scaleY = bounds.height / this.frameHeight;

            if (scaleX !== 1.0 || scaleY !== 1.0 || bounds.x !== 0 || bounds.y !== 0) {
                sMatrix.identity();
                sMatrix.scale(scaleX, scaleY);
                sMatrix.translate(bounds.x, bounds.y);
                vertexData.transformPoints(attrName, sMatrix, vertexID, 4);
            }
        }
    }

    /** Sets up a VertexData instance with the correct texture coordinates for
     *  4 vertices so that the texture is mapped to the complete quad.
     *
     *  @param vertexData  the vertex data to which the texture coordinates will be written.
     *  @param vertexID    the start position within the VertexData instance.
     *  @param attrName    the attribute name referencing the vertex positions.
     */
    setupTextureCoordinates(vertexData, vertexID = 0, attrName = 'texCoords', fbo = false) {
        this.setTexCoords(vertexData, vertexID, attrName, 0.0, 0.0, fbo);
        this.setTexCoords(vertexData, vertexID + 1, attrName, 1.0, 0.0, fbo);
        this.setTexCoords(vertexData, vertexID + 2, attrName, 0.0, 1.0, fbo);
        this.setTexCoords(vertexData, vertexID + 3, attrName, 1.0, 1.0, fbo);
    }

    /** Transforms the given texture coordinates from the local coordinate system
     *  into the root texture's coordinate system. */
    localToGlobal(u, v, out = null) {
        if (!out) out = new Point();
        if (this === this.root) out.setTo(u, v);
        else MatrixUtil.transformCoords(this.transformationMatrixToRoot, u, v, out);
        return out;
    }

    /** Transforms the given texture coordinates from the root texture's coordinate system
     *  to the local coordinate system. */
    globalToLocal(u, v, out = null) {
        if (!out) out = new Point();
        if (this === this.root) out.setTo(u, v);
        else {
            Texture.sMatrix.identity();
            Texture.sMatrix.copyFrom(this.transformationMatrixToRoot);
            Texture.sMatrix.invert();
            MatrixUtil.transformCoords(Texture.sMatrix, u, v, out);
        }
        return out;
    }

    /** Writes the given texture coordinates to a VertexData instance after transforming
     *  them into the root texture's coordinate system. That way, the texture coordinates
     *  can be used directly to sample the texture in the fragment shader. */
    setTexCoords(vertexData, vertexID, attrName, u, v, fbo = false) {
        const { sPoint } = Texture;
        this.localToGlobal(u, v, sPoint);
        vertexData.setPoint(vertexID, attrName, sPoint.x, fbo ? 1 - sPoint.y : sPoint.y);
    }

    /** Reads a pair of texture coordinates from the given VertexData instance and transforms
     *  them into the current texture's coordinate system. (Remember, the VertexData instance
     *  will always contain the coordinates in the root texture's coordinate system!) */
    getTexCoords(vertexData, vertexID, attrName = 'texCoords', out = null) {
        if (!out) out = new Point();
        vertexData.getPoint(vertexID, attrName, out);
        return this.globalToLocal(out.x, out.y, out);
    }

    // properties

    /** The texture frame if it has one (see class description), otherwise <code>null</code>.
     *  <p>CAUTION: not a copy, but the actual object! Do not modify!</p> */
    get frame() {
        return null;
    }

    /** The height of the texture in points, taking into account the frame rectangle
     *  (if there is one). */
    get frameWidth() {
        return this.frame ? this.frame.width : this.width;
    }

    /** The width of the texture in points, taking into account the frame rectangle
     *  (if there is one). */
    get frameHeight() {
        return this.frame ? this.frame.height : this.height;
    }

    /** The width of the texture in points. */
    get width() {
        return 0;
    }

    /** The height of the texture in points. */
    get height() {
        return 0;
    }

    /** The width of the texture in pixels (without scale adjustment). */
    get nativeWidth() {
        return 0;
    }

    /** The height of the texture in pixels (without scale adjustment). */
    get nativeHeight() {
        return 0;
    }

    /** The scale factor, which influences width and height properties. */
    get scale() {
        return 1.0;
    }

    /** The Stage3D texture object the texture is based on. */
    get base() {
        return null;
    }

    /** The concrete texture the texture is based on. */
    get root() {
        return null;
    }

    /** The <code>Context3DTextureFormat</code> of the underlying texture data. */
    //get format() { return Context3DTextureFormat.BGRA; }

    /** Indicates if the texture contains mip maps. */
    get mipMapping() {
        return false;
    }

    /** Indicates if the alpha values are premultiplied into the RGB values. */
    get premultipliedAlpha() {
        return false;
    }

    /** The matrix that is used to transform the texture coordinates into the coordinate
     *  space of the parent texture, if there is one. @default null
     *
     *  <p>CAUTION: not a copy, but the actual object! Never modify this matrix!</p> */
    get transformationMatrix() {
        return null;
    }

    /** The matrix that is used to transform the texture coordinates into the coordinate
     *  space of the root texture, if this instance is not the root. @default null
     *
     *  <p>CAUTION: not a copy, but the actual object! Never modify this matrix!</p> */
    get transformationMatrixToRoot() {
        return null;
    }

    /** Returns the maximum size constraint (for both width and height) for textures in the
     *  current Context3D profile. */
    //static get maxSize()
    //{
    //    var target:Starling = Starling.current;
    //    var profile = target ? target.profile : "baseline";
    //
    //    if (profile == "baseline" || profile == "baselineConstrained")
    //        return 2048;
    //    else
    //        return 4096;
    //}

    /** Indicates if it should be attempted to upload bitmaps asynchronously when the <code>async</code> parameter
     *  is supplied to supported methods. Since this feature is still not 100% reliable in AIR 26 (especially on
     *  Android), it defaults to 'false' for now.
     *
     *  <p>If the feature is disabled or not available in the current AIR/Flash runtime, the async callback will
     *  still be executed; however, the upload itself will be made synchronously.</p>
     */
    //static get asyncBitmapUploadEnabled()
    //{
    //    return ConcreteRectangleTexture.asyncUploadEnabled;
    //}
    //
    //static set asyncBitmapUploadEnabled(value)
    //{
    //    ConcreteRectangleTexture.asyncUploadEnabled = value;
    //    ConcretePotTexture.asyncUploadEnabled = value;
    //}
}
