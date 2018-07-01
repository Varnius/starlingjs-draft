import Rectangle from '../math/rectangle';
import BlendMode from '../display/blend-mode';
import SubTexture from './subtexture';
import TextureSmoothing from './texture-smoothing';
import { createEmptyTexture } from '../utils/texture-creators';
import Image from '../display/image';

/** A RenderTexture is a dynamic texture onto which you can draw any display object.
 *
 *  <p>After creating a render texture, just call the <code>drawObject</code> method to render
 *  an object directly onto the texture. The object will be drawn onto the texture at its current
 *  position, adhering its current rotation, scale and alpha properties.</p>
 *
 *  <p>Drawing is done very efficiently, as it is happening directly in graphics memory. After
 *  you have drawn objects onto the texture, the performance will be just like that of a normal
 *  texture — no matter how many objects you have drawn.</p>
 *
 *  <p>If you draw lots of objects at once, it is recommended to bundle the drawing calls in
 *  a block via the <code>drawBundled</code> method, like shown below. That will speed it up
 *  immensely, allowing you to draw hundreds of objects very quickly.</p>
 *
 *    <pre>
 *  renderTexture.drawBundled(function()
 *  {
     *     for (var i=0; i&lt;numDrawings; ++i)
     *     {
     *         image.rotation = (2 &#42; Math.PI / numDrawings) &#42; i;
     *         renderTexture.draw(image);
     *     }   
     *  });
 *  </pre>
 *
 *  <p>To erase parts of a render texture, you can use any display object like a "rubber" by
 *  setting its blending mode to <code>BlendMode.ERASE</code>. To wipe it completely clean,
 *  use the <code>clear</code> method.</p>
 *
 *  <strong>Persistence</strong>
 *
 *  <p>Older devices may require double buffering to support persistent render textures. Thus,
 *  you should disable the <code>persistent</code> parameter in the constructor if you only
 *  need to make one draw operation on the texture. The static <code>useDoubleBuffering</code>
 *  property allows you to customize if new textures will be created with or without double
 *  buffering.</p>
 *
 *  <strong>Context Loss</strong>
 *
 *  <p>Unfortunately, render textures are wiped clean when the render context is lost.
 *  This means that you need to manually recreate all their contents in such a case.
 *  One way to do that is by using the <code>root.onRestore</code> callback, like here:</p>
 *
 *  <listing>
 *  renderTexture.root.onRestore = function()
 *  {
     *      var quad:Quad = new Quad(100, 100, 0xff00ff);
     *      renderTexture.clear(); // required on texture restoration
     *      renderTexture.draw(quad);
     *  });</listing>
 *
 *  <p>For example, a drawing app would need to store information about all draw operations
 *  when they occur, and then recreate them inside <code>onRestore</code> on a context loss
 *  (preferably using <code>drawBundled</code> instead).</p>
 *
 *  <p>However, there is one problem: when that callback is executed, it's very likely that
 *  not all of your textures are already available, since they need to be restored, too (and
 *  that might take a while). You probably loaded your textures with the "AssetManager".
 *  In that case, you can listen to its <code>TEXTURES_RESTORED</code> event instead:</p>
 *
 *  <listing>
 *  assetManager.addEventListener(Event.TEXTURES_RESTORED, function()
 *  {
     *      var brush = new Image(assetManager.getTexture("brush"));
     *      renderTexture.draw(brush);
     *  });</listing>
 *
 *  <p>[Note that this time, there is no need to call <code>clear</code>, because that's the
 *  default behavior of <code>onRestore</code>, anyway — and we didn't modify that.]</p>
 *
 */
export default class RenderTexture extends SubTexture {
    static USE_DOUBLE_BUFFERING_DATA_NAME =
        'starling.textures.RenderTexture.useDoubleBuffering';

    _activeTexture;
    _bufferTexture;
    _helperImage;
    _drawing;
    _bufferReady;
    _isPersistent;

    // helper object
    static sClipRect = new Rectangle();

    /** Creates a new RenderTexture with a certain size (in points). If the texture is
     *  persistent, its contents remains intact after each draw call, allowing you to use the
     *  texture just like a canvas. If it is not, it will be cleared before each draw call.
     *
     *  <p>Non-persistent textures can be used more efficiently on older devices; on modern
     *  hardware, it does not make a difference. For more information, have a look at the
     *  documentation of the <code>useDoubleBuffering</code> property.</p>
     */
    constructor(width, height, persistent = true) {
        const activeTexture = createEmptyTexture({ width, height });
        activeTexture.root.onRestore = activeTexture.root.clear;

        super(activeTexture, new Rectangle(0, 0, width, height), true, null, false);

        this._isPersistent = persistent;
        this._activeTexture = activeTexture;

        if (persistent && RenderTexture.useDoubleBuffering) {
            this._bufferTexture = createEmptyTexture({ width, height });
            this._bufferTexture.root.onRestore = this._bufferTexture.root.clear;
            this._helperImage = new Image(this._bufferTexture);
            this._helperImage.textureSmoothing = TextureSmoothing.NONE; // solves some aliasing-issues
        }
    }

    /** @inheritDoc */
    dispose() {
        this._activeTexture.dispose();

        if (this.isDoubleBuffered) {
            this._bufferTexture.dispose();
            this._helperImage.dispose();
        }

        super.dispose();
    }

    /** Draws an object into the texture. Note that any filters on the object will currently
     *  be ignored.
     *
     *  @param object       The object to draw.
     *  @param matrix       If 'matrix' is null, the object will be drawn adhering its
     *                      properties for position, scale, and rotation. If it is not null,
     *                      the object will be drawn in the orientation depicted by the matrix.
     *  @param alpha        The object's alpha value will be multiplied with this value.
     *  @param antiAliasing Values range from 0 (no antialiasing) to 4 (best quality).
     *                      Beginning with AIR 22, this feature is supported on all platforms
     *                      (except for software rendering mode).
     */
    draw(object, matrix = null, alpha = 1.0,
         antiAliasing = 0) {
        if (!object) return;

        if (this._drawing)
            this.render(object, matrix, alpha);
        else
            this.renderBundled(this.render, object, matrix, alpha, antiAliasing);
    }

    /** Bundles several calls to <code>draw</code> together in a block. This avoids buffer
     *  switches and allows you to draw multiple objects into a non-persistent texture.
     *  Note that the 'antiAliasing' setting provided here overrides those provided in
     *  individual 'draw' calls.
     *
     *  @param drawingBlock  a callback with the form: <pre>function();</pre>
     *  @param antiAliasing  Values range from 0 (no antialiasing) to 4 (best quality).
     *                       Beginning with AIR 22, this feature is supported on all platforms
     *                       (except for software rendering mode).
     */
    drawBundled(drawingBlock, antiAliasing = 0) {
        this.renderBundled(drawingBlock, null, null, 1.0, antiAliasing);
    }

    render(object, matrix = null, alpha = 1.0) {
        const painter = window.StarlingContextManager.current.painter;
        const state = painter.state;
        const wasCacheEnabled = painter.cacheEnabled;
        const filter = object.filter;
        const mask = object.mask;

        painter.cacheEnabled = false;
        painter.pushState();

        state.alpha = object.alpha * alpha;
        state.setModelviewMatricesToIdentity();
        state.blendMode = object.blendMode === BlendMode.AUTO ?
            BlendMode.NORMAL : object.blendMode;

        if (matrix) state.transformModelviewMatrix(matrix);
        else state.transformModelviewMatrix(object.transformationMatrix);

        if (mask) painter.drawMask(mask, object);

        if (filter) filter.render(painter);
        else object.render(painter);

        if (mask) painter.eraseMask(mask, object);

        painter.popState();
        painter.cacheEnabled = wasCacheEnabled;
    }

    renderBundled(renderBlock, object = null, matrix = null, alpha = 1.0, antiAliasing = 0) {
        const { sClipRect } = RenderTexture;
        const starling = window.StarlingContextManager.current;
        const painter = starling.painter;
        const state = painter.state;

        if (!starling.contextValid) return;

        // switch buffers
        if (this.isDoubleBuffered) {
            const tmpTexture = this._activeTexture;
            this._activeTexture = this._bufferTexture;
            this._bufferTexture = tmpTexture;
            this._helperImage.texture = this._bufferTexture;
        }

        painter.pushState();

        const rootTexture = this._activeTexture.root;
        state.setProjectionMatrix(0, 0, rootTexture.width, rootTexture.height, this.width, this.height);

        // limit drawing to relevant area
        sClipRect.setTo(0, 0, this._activeTexture.width, this._activeTexture.height);

        state.clipRect = sClipRect;
        state.setRenderTarget(this._activeTexture, true, antiAliasing);

        painter.prepareToDraw();
        //painter.context.setStencilActions( // should not be necessary, but fixes mask issues
        //    Context3DTriangleFace.FRONT_AND_BACK, Context3DCompareMode.ALWAYS);

        if (this.isDoubleBuffered || !this.isPersistent || !this._bufferReady)
            painter.clear();

        // draw buffer
        if (this.isDoubleBuffered && this._bufferReady)
            this._helperImage.render(painter);
        else
            this._bufferReady = true;

        try {
            this._drawing = true;
            renderBlock(object, matrix, alpha); // todo: ok?
        } finally {
            this._drawing = false;
            painter.popState();
        }
    }

    /** Clears the render texture with a certain color and alpha value. Call without any
     *  arguments to restore full transparency. */
    clear(color = 0, alpha = 0.0) {
        this._activeTexture.root.clear(color, alpha);
        this._bufferReady = true;
    }

    // properties

    /** Indicates if the render texture is using double buffering. This might be necessary for
     *  persistent textures, depending on the runtime version and the value of
     *  'forceDoubleBuffering'. */
    get isDoubleBuffered() {
        return this._bufferTexture != null;
    }

    /** Indicates if the texture is persistent over multiple draw calls. */
    get isPersistent() {
        return this._isPersistent;
    }

    /** @inheritDoc */
    get base() {
        return this._activeTexture.base;
    }

    /** @inheritDoc */
    get root() {
        return this._activeTexture.root;
    }

    /** Indicates if new persistent textures should use double buffering. Single buffering
     *  is faster and requires less memory, but is not supported on all hardware.
     *
     *  <p>By default, applications running with the profile "baseline" or "baselineConstrained"
     *  will use double buffering; all others use just a single buffer. You can override this
     *  behavior, though, by assigning a different value at runtime.</p>
     *
     *  @default true for "baseline" and "baselineConstrained", false otherwise
     */
    static get useDoubleBuffering() {
        const starling = window.StarlingContextManager.current;
        if (starling) {
            const painter = starling.painter;
            const sharedData = painter.sharedData;

            if (RenderTexture.USE_DOUBLE_BUFFERING_DATA_NAME in sharedData) {
                return sharedData[RenderTexture.USE_DOUBLE_BUFFERING_DATA_NAME];
            } else {
                sharedData[RenderTexture.USE_DOUBLE_BUFFERING_DATA_NAME] = 'baseline';
                return 'baseline';
            }
        } else return false;
    }

    static set useDoubleBuffering(value) {
        const starling = window.StarlingContextManager.current;
        if (!starling)
            throw new Error('[IllegalOperationError] Starling not yet initialized');
        else
           starling.painter.sharedData[RenderTexture.USE_DOUBLE_BUFFERING_DATA_NAME] = value;
    }
}
