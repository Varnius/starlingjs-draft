import { RGBA } from 'gl-constants';

import Matrix3D from '../math/matrix3d';
import Matrix from '../math/matrix';
import VertexData from '../rendering/vertex-data';
import IndexData from '../rendering/index-data';
import Starling from '../core/starling';
import RectangleUtil from '../utils/rectangle-util';
import Pool from '../utils/pool';
import Stage from '../display/stage';
import Mesh from '../display/mesh';
import EventDispatcher from '../events/event-dispatcher';
import MatrixUtil from '../utils/matrix-util';
import FilterHelper from './filter-helper';
import Padding from '../utils/padding';
import FilterEffect from '../rendering/filter-effect';
import Event from '../events/event';
import TextureSmoothing from '../textures/texture-smoothing';
import { vertexDataToSomethingReadable } from '../utils/debug';

/** The FragmentFilter class is the base class for all filter effects in Starling.
 *  All filters must extend this class. You can attach them to any display object through the
 *  <code>filter</code> property.
 *
 *  <p>A fragment filter works in the following way:</p>
 *  <ol>
 *    <li>The object to be filtered is rendered into a texture.</li>
 *    <li>That texture is passed to the <code>process</code> method.</li>
 *    <li>This method processes the texture using a <code>FilterEffect</code> subclass
 *        that processes the input via fragment and vertex shaders to achieve a certain
 *        effect.</li>
 *    <li>If the filter requires several passes, the process method may execute the
 *        effect several times, or even make use of other filters in the process.</li>
 *    <li>In the end, a quad with the output texture is added to the batch renderer.
 *        In the next frame, if the object hasn't changed, the filter is drawn directly
 *        from the render cache.</li>
 *    <li>Alternatively, the last pass may be drawn directly to the back buffer. That saves
 *        one draw call, but means that the object may not be drawn from the render cache in
 *        the next frame. Starling makes an educated guess if that makes sense, but you can
 *        also force it to do so via the <code>alwaysDrawToBackBuffer</code> property.</li>
 *  </ol>
 *
 *  <p>All of this is set up by the basic FragmentFilter class. Concrete subclasses
 *  just need to override the protected method <code>createEffect</code> and (optionally)
 *  <code>process</code>. Multi-pass filters must also override <code>numPasses</code>.</p>
 *
 *  <p>Typically, any properties on the filter are just forwarded to an effect instance,
 *  which is then used automatically by <code>process</code> to render the filter pass.
 *  For a simple example on how to write a single-pass filter, look at the implementation of
 *  the <code>ColorMatrixFilter</code>; for a composite filter (i.e. a filter that combines
 *  several others), look at the <code>GlowFilter</code>.
 *  </p>
 *
 *  <p>Beware that a filter instance may only be used on one object at a time!</p>
 *
 *  <p><strong>Animated filters</strong></p>
 *
 *  <p>The <code>process</code> method of a filter is only called when it's necessary, i.e.
 *  when the filter properties or the target display object changes. This means that you cannot
 *  rely on the method to be called on a regular basis, as needed when creating an animated
 *  filter class. Instead, you can do so by listening for an <code>ENTER_FRAME</code>-event.
 *  It is dispatched on the filter once every frame, as long as the filter is assigned to
 *  a display object that is connected to the stage.</p>
 *
 *  <p><strong>Caching</strong></p>
 *
 *  <p>Per default, whenever the target display object is changed in any way (i.e. the render
 *  cache fails), the filter is reprocessed. However, you can manually cache the filter output
 *  via the method of the same name: this will let the filter redraw the current output texture,
 *  even if the target object changes later on. That's especially useful if you add a filter
 *  to an object that changes only rarely, e.g. a TextField or an Image. Keep in mind, though,
 *  that you have to call <code>cache()</code> again in order for any changes to show up.</p>
 *
 *  @see starling.rendering.FilterEffect
 */
export default class FragmentFilter extends EventDispatcher {
    _quad;
    _target;
    _effect;
    _vertexData;
    _indexData;
    _padding;
    _helper;
    _resolution;
    _antiAliasing;
    _textureFormat;
    _textureSmoothing;
    _alwaysDrawToBackBuffer;
    _cacheRequested;
    _cached;

    // helpers
    static sMatrix3D = new Matrix3D();

    /** Creates a new instance. The base class' implementation just draws the unmodified
     *  input texture. */
    constructor() {
        super();

        this._resolution = 1.0;
        this._textureFormat = RGBA;
        this._textureSmoothing = TextureSmoothing.BILINEAR;

        // Handle lost context (using conventional Flash event for weak listener support)
        //Starling.current.stage3D.addEventListener(Event.CONTEXT3D_CREATE,
        //    this.onContextCreated, false, 0, true);
    }

    /** Disposes all resources that have been created by the filter. */
    dispose() {
        //Starling.current.stage3D.removeEventListener(Event.CONTEXT3D_CREATE, onContextCreated); todo:

        if (this._helper) this._helper.dispose();
        if (this._effect) this._effect.dispose();
        if (this._quad) this._quad.dispose();

        this._effect = null;
        this._quad = null;
    }

    //onContextCreated(event) {
    //    this.setRequiresRedraw();
    //}

    /** Renders the filtered target object. Most users will never have to call this manually;
     *  it's executed automatically in the rendering process of the filtered display object.
     */
    render(painter) {
        const { _target, _quad } = this;

        if (!_target)
            throw new Error('[IllegalOperationError] Cannot render filter without target');

        if (_target.is3D)
            this._cached = this._cacheRequested = false;

        if (!this._cached || this._cacheRequested) {
            this.renderPasses(painter, this._cacheRequested);
            this._cacheRequested = false;
        } else if (_quad.visible) {
            _quad.render(painter);
        }
    }

    renderPasses(painter, forCache) {
        if (!this._helper) this._helper = new FilterHelper(this._textureFormat);
        if (!this._quad) {
            this._quad = new FilterQuad(this._textureSmoothing);
        } else {
            this._helper.putTexture(this._quad.texture);
            this._quad.texture = null;
        }

        const bounds = Pool.getRectangle(); // might be recursive -> no static var
        let drawLastPassToBackBuffer = false;
        const origResolution = this._resolution;
        const renderSpace = this._target.stage || this._target.parent;
        const isOnStage = renderSpace instanceof Stage; // todo: was renderSpace is stage
        const stage = Starling.current.stage;
        let stageBounds;

        if (!forCache && (this._alwaysDrawToBackBuffer || this._target.requiresRedraw)) {
            // If 'requiresRedraw' is true, the object is non-static, and we guess that this
            // will be the same in the next frame. So we render directly to the back buffer.
            //
            // -- That, however, is only possible for full alpha values, because
            // (1) 'FilterEffect' can't handle alpha (and that will do the rendering)
            // (2) we don't want lower layers (CompositeFilter!) to shine through.

            drawLastPassToBackBuffer = painter.state.alpha === 1.0;
            painter.excludeFromCache(this._target);
        }

        if (this._target === Starling.current.root) {
            // full-screen filters use exactly the stage bounds
            stage.getStageBounds(this._target, bounds);
        } else {
            // Unfortunately, the following bounds calculation yields the wrong result when
            // drawing a filter to a RenderTexture using a custom matrix. The 'modelviewMatrix'
            // should be used for the bounds calculation, but the API doesn't support this.
            // A future version should change this to: 'getBounds(modelviewMatrix, bounds)'

            this._target.getBounds(renderSpace, bounds);

            if (!forCache && isOnStage) { // normally, we don't need anything outside
                stageBounds = stage.getStageBounds(null, Pool.getRectangle());
                RectangleUtil.intersect(bounds, stageBounds, bounds);
                Pool.putRectangle(stageBounds);
            }
        }

        this._quad.visible = !bounds.isEmpty();
        if (!this._quad.visible) {
            Pool.putRectangle(bounds);
            return;
        }

        if (this._padding) RectangleUtil.extend(bounds,
            this._padding.left, this._padding.right, this._padding.top, this._padding.bottom);

        // extend to actual pixel bounds for maximum sharpness + to avoid jiggling
        RectangleUtil.extendToWholePixels(bounds, Starling.contentScaleFactor);

        this._helper.textureScale = Starling.contentScaleFactor * this._resolution;
        this._helper.projectionMatrix3D = painter.state.projectionMatrix3D;
        this._helper.renderTarget = painter.state.renderTarget;
        this._helper.clipRect = painter.state.clipRect;
        this._helper.targetBounds = bounds;
        this._helper.target = this._target;
        this._helper.start(this.numPasses, drawLastPassToBackBuffer);

        this._quad.setBounds(bounds);
        this._resolution = 1.0; // applied via '_helper.textureScale' already;
        // only 'child'-filters use resolution directly (in 'process')

        const wasCacheEnabled = painter.cacheEnabled;
        const input = this._helper.getTexture(); // todo <-- subtexture

        painter.cacheEnabled = false; // -> what follows should not be cached
        painter.pushState();
        painter.state.alpha = 1.0;
        painter.state.clipRect = null;
        painter.state.setRenderTarget(input, true, this._antiAliasing);
        painter.state.setProjectionMatrix(bounds.x, bounds.y,
            input.root.width, input.root.height,
            stage.stageWidth, stage.stageHeight, stage.cameraPosition);

        this._target.render(painter); // -> draw target object into 'input'

        painter.finishMeshBatch();
        painter.state.setModelviewMatricesToIdentity();

        const output = this.process(painter, this._helper, input); // -> feed 'input' to actual filter code

        painter.popState();
        painter.cacheEnabled = wasCacheEnabled; // -> cache again

        if (output) { // indirect rendering
            painter.pushState();

            if (this._target.is3D) painter.state.setModelviewMatricesToIdentity(); // -> stage coords
            else this._quad.moveVertices(renderSpace, this._target); // -> local coords

            this._quad.texture = output;
            this._quad.render(painter);

            painter.finishMeshBatch();
            painter.popState();
        }

        this._helper.target = null;
        this._helper.putTexture(input);
        this._resolution = origResolution;
        Pool.putRectangle(bounds);
    }

    /** Does the actual filter processing. This method will be called with up to four input
     *  textures and must return a new texture (acquired from the <code>helper</code>) that
     *  contains the filtered output. To to do this, it configures the FilterEffect
     *  (provided via <code>createEffect</code>) and calls its <code>render</code> method.
     *
     *  <p>In a standard filter, only <code>input0</code> will contain a texture; that's the
     *  object the filter was applied to, rendered into an appropriately sized texture.
     *  However, filters may also accept multiple textures; that's useful when you need to
     *  combine the output of several filters into one. For example, the DropShadowFilter
     *  uses a BlurFilter to create the shadow and then feeds both input and shadow texture
     *  into a CompositeFilter.</p>
     *
     *  <p>Never create or dispose any textures manually within this method; instead, get
     *  new textures from the provided helper object, and pass them to the helper when you do
     *  not need them any longer. Ownership of both input textures and returned texture
     *  lies at the caller; only temporary textures should be put into the helper.</p>
     */
    process(painter, helper, input0 = null) {
        const effect = this.effect;
        const output = helper.getTexture(this._resolution);

        let projectionMatrix;
        let bounds = null;
        let renderTarget;

        if (output) { // render to texture
            renderTarget = output;
            projectionMatrix = MatrixUtil.createPerspectiveProjectionMatrix(0, 0,
                output.root.width / this._resolution, output.root.height / this._resolution,
                0, 0, null, FragmentFilter.sMatrix3D);
        } else { // render to back buffer
            bounds = helper.targetBounds;
            renderTarget = helper.renderTarget;
            projectionMatrix = helper.projectionMatrix3D;
            effect.textureSmoothing = this._textureSmoothing;

            // restore clipRect (projection matrix influences clipRect!)
            painter.state.clipRect = helper.clipRect;
            painter.state.projectionMatrix3D.copyFrom(projectionMatrix);
        }

        painter.state.renderTarget = renderTarget;
        painter.prepareToDraw();
        painter.drawCount += 1;

        input0.setupVertexPositions(this.vertexData, 0, 'position', bounds);
        input0.setupTextureCoordinates(this.vertexData, 0, 'texCoords', true);

        effect.texture = input0;
        effect.mvpMatrix3D = projectionMatrix;
        effect.uploadVertexData(this.vertexData);
        effect.uploadIndexData(this.indexData);
        effect.render(0, this.indexData.numTriangles);

        return output;
    }

    /** Creates the effect that does the actual, low-level rendering.
     *  Must be overridden by all subclasses that do any rendering on their own (instead
     *  of just forwarding processing to other filters).
     */
    createEffect() {
        return new FilterEffect();
    }

    /** Caches the filter output into a texture.
     *
     *  <p>An uncached filter is rendered every frame (except if it can be rendered from the
     *  global render cache, which happens if the target object does not change its appearance
     *  or location relative to the stage). A cached filter is only rendered once; the output
     *  stays unchanged until you call <code>cache</code> again or change the filter settings.
     *  </p>
     *
     *  <p>Beware: you cannot cache filters on 3D objects; if the object the filter is attached
     *  to is a Sprite3D or has a Sprite3D as (grand-) parent, the request will be silently
     *  ignored. However, you <em>can</em> cache a 2D object that has 3D children!</p>
     */
    cache() {
        this._cached = this._cacheRequested = true;
        this.setRequiresRedraw();
    }

    /** Clears the cached output of the filter. After calling this method, the filter will be
     *  processed once per frame again. */
    clearCache() {
        this._cached = this._cacheRequested = false;
        this.setRequiresRedraw();
    }

    // enter frame event

    /** @private */
    addEventListener(type, listener) {
        if (type === Event.ENTER_FRAME && this._target)
            this._target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);

        super.addEventListener(type, listener);
    }

    /** @private */
    removeEventListener(type, listener) {
        if (type === Event.ENTER_FRAME && this._target)
            this._target.removeEventListener(type, this.onEnterFrame);

        super.removeEventListener(type, listener);
    }

    onEnterFrame(event) {
        this.dispatchEvent(event);
    }

    // properties

    /** The effect instance returning the FilterEffect created via <code>createEffect</code>. */
    get effect() {
        if (!this._effect) this._effect = this.createEffect();
        return this._effect;
    }

    /** The VertexData used to process the effect. Per default, uses the format provided
     *  by the effect, and contains four vertices enclosing the target object. */
    get vertexData() {
        if (!this._vertexData) this._vertexData = new VertexData(this.effect.vertexFormat, 4);
        return this._vertexData;
    }

    /** The IndexData used to process the effect. Per default, references a quad (two triangles)
     *  of four vertices. */
    get indexData() {
        if (!this._indexData) {
            this._indexData = new IndexData(6);
            this._indexData.addQuad(0, 1, 2, 3);
        }

        return this._indexData;
    }

    /** Call this method when any of the filter's properties changes.
     *  This will make sure the filter is redrawn in the next frame. */
    setRequiresRedraw() {
        this.dispatchEventWith(Event.CHANGE);
        if (this._target) this._target.setRequiresRedraw();
        if (this._cached) this._cacheRequested = true;
    }

    /** Indicates the number of rendering passes required for this filter.
     *  Subclasses must override this method if the number of passes is not <code>1</code>. */
    get numPasses() {
        return 1;
    }

    /** Called when assigning a target display object.
     *  Override to plug in class-specific logic. */
    onTargetAssigned(target) {} // eslint-disable-line

    /** Padding can extend the size of the filter texture in all directions.
     *  That's useful when the filter 'grows' the bounds of the object in any direction. */
    get padding() {
        if (!this._padding) {
            this._padding = new Padding();
            this._padding.addEventListener(Event.CHANGE, this.setRequiresRedraw);
        }

        return this._padding;
    }

    set padding(value) {
        this.padding.copyFrom(value);
    }

    /** Indicates if the filter is cached (via the <code>cache</code> method). */
    get isCached() {
        return this._cached;
    }

    /** The resolution of the filter texture. '1' means stage resolution, '0.5' half the stage
     *  resolution. A lower resolution saves memory and execution time, but results in a lower
     *  output quality. Values greater than 1 are allowed; such values might make sense for a
     *  cached filter when it is scaled up. @default 1
     */
    get resolution() {
        return this._resolution;
    }

    set resolution(value) {
        if (value !== this._resolution) {
            if (value > 0) this._resolution = value;
            else throw new Error('[ArgumentError] resolution must be > 0');
            this.setRequiresRedraw();
        }
    }

    /** The anti-aliasing level. This is only used for rendering the target object
     *  into a texture, not for the filter passes. 0 - none, 4 - maximum. @default 0 */
    get antiAliasing() {
        return this._antiAliasing;
    }

    set antiAliasing(value) {
        if (value !== this._antiAliasing) {
            this._antiAliasing = value;
            this.setRequiresRedraw();
        }
    }

    /** The smoothing mode of the filter texture. @default bilinear */
    get textureSmoothing() {
        return this._textureSmoothing;
    }

    set textureSmoothing(value) {
        if (value !== this._textureSmoothing) {
            this._textureSmoothing = value;
            if (this._quad) this._quad.textureSmoothing = value;
            this.setRequiresRedraw();
        }
    }

    /** The format of the filter texture. @default BGRA */
    get textureFormat() {
        return this._textureFormat;
    }

    set textureFormat(value) {
        if (value !== this._textureFormat) {
            this._textureFormat = value;
            if (this._helper) this._helper.textureFormat = value;
            this.setRequiresRedraw();
        }
    }

    /** Indicates if the last filter pass is always drawn directly to the back buffer.
     *
     *  <p>Per default, the filter tries to automatically render in a smart way: objects that
     *  are currently moving are rendered to the back buffer, objects that are static are
     *  rendered into a texture first, which allows the filter to be drawn directly from the
     *  render cache in the next frame (in case the object remains static).</p>
     *
     *  <p>However, this fails when filters are added to an object that does not support the
     *  render cache, or to a container with such a child (e.g. a Sprite3D object or a masked
     *  display object). In such a case, enable this property for maximum performance.</p>
     *
     *  @default false
     */
    get alwaysDrawToBackBuffer() {
        return this._alwaysDrawToBackBuffer;
    }

    set alwaysDrawToBackBuffer(value) {
        this._alwaysDrawToBackBuffer = value;
    }

    // internal methods

    /** @private */
    setTarget = target => {
        if (target !== this._target) {
            const prevTarget = this._target;
            this._target = target;

            if (!target) {
                if (this._helper) this._helper.purge();
                if (this._effect) this._effect.purgeBuffers();
                if (this._quad) this._quad.disposeTexture();
            }

            if (prevTarget) {
                prevTarget.filter = null;
                prevTarget.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame);
            }

            if (target) {
                if (this.hasEventListener(Event.ENTER_FRAME))
                    target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);

                this.onTargetAssigned(target);
            }
        }
    }
}

class FilterQuad extends Mesh {
    static sMatrix = new Matrix();

    constructor(smoothing) {
        const vertexData = new VertexData(null, 4);
        vertexData.numVertices = 4;

        const indexData = new IndexData(6);
        indexData.addQuad(0, 1, 2, 3);

        super(vertexData, indexData);

        this.textureSmoothing = smoothing;
        this.pixelSnapping = false;
    }

    dispose() {
        this.disposeTexture();
        super.dispose();
    }

    disposeTexture() {
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
    }

    moveVertices(sourceSpace, targetSpace) {
        if (targetSpace.is3D)
            throw new Error('cannot move vertices into 3D space');
        else if (sourceSpace !== targetSpace) {
            targetSpace.getTransformationMatrix(sourceSpace, FilterQuad.sMatrix).invert(); // ss could be null!
            this.vertexData.transformPoints('position', FilterQuad.sMatrix);
        }
    }

    setBounds(bounds) {
        const vertexData = this.vertexData;
        const attrName = 'position';

        vertexData.setPoint(0, attrName, bounds.x, bounds.y);
        vertexData.setPoint(1, attrName, bounds.right, bounds.y);
        vertexData.setPoint(2, attrName, bounds.x, bounds.bottom);
        vertexData.setPoint(3, attrName, bounds.right, bounds.bottom);
    }

    get texture() {
        return super.texture;
    }

    set texture(value) {
        super.texture = value;
        if (value) value.setupTextureCoordinates(this.vertexData, 0, 'texCoords', true);
    }
}
