import { FRONT, BACK, FRONT_AND_BACK } from 'gl-constants';

import Matrix3D from '../math/matrix3d';
import Matrix from '../math/matrix';
import BlendMode from '../display/blend-mode';
import RectangleUtil from '../utils/rectangle-util';
import MatrixUtil from '../utils/matrix-util';
import MathUtil from '../utils/math-util';
import Pool from '../utils/pool';

/** The RenderState stores a combination of settings that are currently used for rendering.
 *  This includes modelview and transformation matrices as well as context3D related settings.
 *
 *  <p>Starling's Painter instance stores a reference to the current RenderState.
 *  Via a stack mechanism, you can always save a specific state and restore it later.
 *  That makes it easy to write rendering code that doesn't have any side effects.</p>
 *
 *  <p>Beware that any context-related settings are not applied on the context
 *  right away, but only after calling <code>painter.prepareToDraw()</code>.
 *  However, the Painter recognizes changes to those settings and will finish the current
 *  batch right away if necessary.</p>
 *
 *  <strong>Matrix Magic</strong>
 *
 *  <p>On rendering, Starling traverses the display tree, constantly moving from one
 *  coordinate system to the next. Each display object stores its vertex coordinates
 *  in its local coordinate system; on rendering, they must be moved to a global,
 *  2D coordinate space (the so-called "clip-space"). To handle these calculations,
 *  the RenderState contains a set of matrices.</p>
 *
 *  <p>By multiplying vertex coordinates with the <code>modelviewMatrix</code>, you'll get the
 *  coordinates in "screen-space", or in other words: in stage coordinates. (Optionally,
 *  there's also a 3D version of this matrix. It comes into play when you're working with
 *  <code>Sprite3D</code> containers.)</p>
 *
 *  <p>By feeding the result of the previous transformation into the
 *  <code>projectionMatrix</code>, you'll end up with so-called "clipping coordinates",
 *  which are in the range <code>[-1, 1]</code> (just as needed by the graphics pipeline).
 *  If you've got vertices in the 3D space, this matrix will also execute a perspective
 *  projection.</p>
 *
 *  <p>Finally, there's the <code>mvpMatrix</code>, which is short for
 *  "modelviewProjectionMatrix". This is simply a combination of <code>modelview-</code> and
 *  <code>projectionMatrix</code>, combining the effects of both. Pass this matrix
 *  to the vertex shader and all your vertices will automatically end up at the right
 *  position.</p>
 *
 *  @see Painter
 *  @see starling.display.Sprite3D
 */
export default class RenderState {
    /** @private */ _alpha;
    /** @private */ _blendMode;
    /** @private */ _modelviewMatrix;

    _culling = BACK;
    _miscOptions;
    _clipRect;
    _renderTarget;
    _onDrawRequired;
    _modelviewMatrix3D;
    _projectionMatrix3D;
    _projectionMatrix3DRev;
    _mvpMatrix3D;

    // helper objects
    static sMatrix3D = new Matrix3D();
    static sProjectionMatrix3DRev = 0;

    /** Creates a new render state with the default settings. */
    constructor()
    {
        this.reset();
    }

    /** Duplicates all properties of another instance on the current instance. */
    copyFrom(renderState)
    {
        const { _clipRect } = this;

        if (!!this._onDrawRequired)
        {
            const currentTarget = this._renderTarget ? this._renderTarget.base : null;
            const nextTarget = renderState._renderTarget ? renderState._renderTarget.base : null;
            const cullingChanges = (this._miscOptions & 0xf00) !== (renderState._miscOptions & 0xf00);
            const clipRectChanges = _clipRect || renderState._clipRect ?
                !RectangleUtil.compare(_clipRect, renderState._clipRect) : false;

            if (this._blendMode !== renderState._blendMode ||
                currentTarget !== nextTarget || clipRectChanges || cullingChanges)
            {
                this._onDrawRequired();
            }
        }

        this._alpha = renderState._alpha;
        this._blendMode = renderState._blendMode;
        this._renderTarget = renderState._renderTarget;
        this._miscOptions = renderState._miscOptions;

        this._modelviewMatrix.copyFrom(renderState._modelviewMatrix);

        if (this._projectionMatrix3DRev !== renderState._projectionMatrix3DRev)
        {
            this._projectionMatrix3DRev = renderState._projectionMatrix3DRev;
            this._projectionMatrix3D.copyFrom(renderState._projectionMatrix3D);
        }

        if (this._modelviewMatrix3D || renderState._modelviewMatrix3D)
            this.modelviewMatrix3D = renderState._modelviewMatrix3D;

        if (_clipRect || renderState._clipRect)
            this.clipRect = renderState._clipRect;
    }

    /** Resets the RenderState to the default settings.
     *  (Check each property documentation for its default value.) */
    reset()
    {
        this.alpha = 1.0;
        this.blendMode = BlendMode.NORMAL;
        //this.culling = Context3DTriangleFace.NONE;
        this.modelviewMatrix3D = null;
        this.renderTarget = null;
        this.clipRect = null;
        this._projectionMatrix3DRev = 0;

        if (this._modelviewMatrix) this._modelviewMatrix.identity();
        else this._modelviewMatrix = new Matrix();

        if (this._projectionMatrix3D) this._projectionMatrix3D.identity();
        else this._projectionMatrix3D = new Matrix3D();

        if (!this._mvpMatrix3D) this._mvpMatrix3D = new Matrix3D();
    }

    // matrix methods / properties

    /** Prepends the given matrix to the 2D modelview matrix. */
    transformModelviewMatrix(matrix)
    {console.log('derp')
        MatrixUtil.prependMatrix(this._modelviewMatrix, matrix);
    }

    /** Prepends the given matrix to the 3D modelview matrix.
     *  The current contents of the 2D modelview matrix is stored in the 3D modelview matrix
     *  before doing so; the 2D modelview matrix is then reset to the identity matrix.
     */
    transformModelviewMatrix3D(matrix)
    {
        console.log('derp')
        if (!this._modelviewMatrix3D)
            this._modelviewMatrix3D = Pool.getMatrix3D();

        this._modelviewMatrix3D.prepend(MatrixUtil.convertTo3D(this._modelviewMatrix, RenderState.sMatrix3D));
        this._modelviewMatrix3D.prepend(matrix);
        this._modelviewMatrix.identity();
    }

    /** Creates a perspective projection matrix suitable for 2D and 3D rendering.
     *
     *  <p>The first 4 parameters define which area of the stage you want to view (the camera
     *  will 'zoom' to exactly this region). The final 3 parameters determine the perspective
     *  in which you're looking at the stage.</p>
     *
     *  <p>The stage is always on the rectangle that is spawned up between x- and y-axis (with
     *  the given size). All objects that are exactly on that rectangle (z equals zero) will be
     *  rendered in their true size, without any distortion.</p>
     *
     *  <p>If you pass only the first 4 parameters, the camera will be set up above the center
     *  of the stage, with a field of view of 1.0 rad.</p>
     */
    setProjectionMatrix(x, y, width, height, stageWidth = 0, stageHeight = 0, cameraPos = null)
    {
        this._projectionMatrix3DRev = ++RenderState.sProjectionMatrix3DRev;

        MatrixUtil.createPerspectiveProjectionMatrix(x, y, width, height, stageWidth, stageHeight, cameraPos, this._projectionMatrix3D);
    }

    /** This method needs to be called whenever <code>projectionMatrix3D</code> was changed
     *  other than via <code>setProjectionMatrix</code>.
     */
    setProjectionMatrixChanged()
    {
        this._projectionMatrix3DRev = ++RenderState.sProjectionMatrix3DRev;
    }

    /** Changes the modelview matrices (2D and, if available, 3D) to identity matrices.
     *  An object transformed an identity matrix performs no transformation.
     */
    setModelviewMatricesToIdentity()
    {
        this._modelviewMatrix.identity();
        if (this._modelviewMatrix3D) this._modelviewMatrix3D.identity();
    }

    /** Returns the current 2D modelview matrix.
     *  CAUTION: Use with care! Each call returns the same instance.
     *  @default identity matrix */
    get modelviewMatrix()
    {
        return this._modelviewMatrix;
    }

    set modelviewMatrix(value)
    {
        this._modelviewMatrix.copyFrom(value);
    }

    /** Returns the current 3D modelview matrix, if there have been 3D transformations.
     *  CAUTION: Use with care! Each call returns the same instance.
     *  @default null */
    get modelviewMatrix3D()
    {
        return this._modelviewMatrix3D;
    }

    set modelviewMatrix3D(value)
    {
        if (value)
        {
            if (!this._modelviewMatrix3D) this._modelviewMatrix3D = Pool.getMatrix3D(false);
            this._modelviewMatrix3D.copyFrom(value);
        }
        else if (this._modelviewMatrix3D)
        {
            Pool.putMatrix3D(this._modelviewMatrix3D);
            this._modelviewMatrix3D = null;
        }
    }

    /** Returns the current projection matrix. You can use the method 'setProjectionMatrix3D'
     *  to set it up in an intuitive way.
     *  CAUTION: Use with care! Each call returns the same instance. If you modify the matrix
     *           in place, you have to call <code>setProjectionMatrixChanged</code>.
     *  @default identity matrix */
    get projectionMatrix3D()
    {
        return this._projectionMatrix3D;
    }

    set projectionMatrix3D(value)
    {
        this.setProjectionMatrixChanged();
        this._projectionMatrix3D.copyFrom(value);
    }

    /** Calculates the product of modelview and projection matrix and stores it in a 3D matrix.
     *  CAUTION: Use with care! Each call returns the same instance. */
    get mvpMatrix3D()
    {
        this._mvpMatrix3D.copyFrom(this._projectionMatrix3D);
        if (this._modelviewMatrix3D) this._mvpMatrix3D.prepend(this._modelviewMatrix3D);
        this._mvpMatrix3D.prepend(MatrixUtil.convertTo3D(this._modelviewMatrix, RenderState.sMatrix3D));
        return this._mvpMatrix3D;
    }

    // other methods

    /** Changes the the current render target.
     *
     *  @param target     Either a texture or <code>null</code> to render into the back buffer.
     *  @param enableDepthAndStencil  Indicates if depth and stencil testing will be available.
     *                    This parameter affects only texture targets.
     *  @param antiAlias  The anti-aliasing quality (range: <code>0 - 4</code>).
     *                    This parameter affects only texture targets. Note that at the time
     *                    of this writing, AIR supports anti-aliasing only on Desktop.
     */
    setRenderTarget(target, enableDepthAndStencil = true, antiAlias = 0)
    {
        const { _miscOptions, _onDrawRequired } = this;
        const currentTarget = this._renderTarget ? this._renderTarget.base : null;
        const newTarget = target ? target.base : null;
        const newOptions = MathUtil.min(antiAlias, 0xf) | (enableDepthAndStencil >>> 0) << 4; // todo: was cast to uint
        const optionsChange = newOptions !== (_miscOptions & 0xff);

        if (currentTarget !== newTarget || optionsChange)
        {
            if (!!_onDrawRequired) _onDrawRequired();

            this._renderTarget = target;
            this._miscOptions = (_miscOptions & 0xffffff00) | newOptions;
        }
    }

    // other properties

    /** The current, cumulated alpha value. Beware that, in a standard 'render' method,
     *  this already includes the current object! The value is the product of current object's
     *  alpha value and all its parents. @default 1.0
     */
    get alpha()
    {
        return this._alpha;
    }

    set alpha(value)
    {
        this._alpha = value;
    }

    /** The blend mode to be used on rendering. A value of "auto" is ignored, since it
     *  means that the mode should remain unchanged.
     *
     *  @default BlendMode.NORMAL
     *  @see starling.display.BlendMode
     */
    get blendMode()
    {
        return this._blendMode;
    }

    set blendMode(value)
    {
        if (value !== BlendMode.AUTO && this._blendMode !== value)
        {
            if (this._onDrawRequired) this._onDrawRequired();
            this._blendMode = value;
        }
    }

    /** The texture that is currently being rendered into, or <code>null</code>
     *  to render into the back buffer. On assignment, calls <code>setRenderTarget</code>
     *  with its default parameters. */
    get renderTarget()
    {
        return this._renderTarget;
    }

    set renderTarget(value)
    {
        this.setRenderTarget(value);
    }

    /** @private */
    get renderTargetBase()
    {
        return this._renderTarget ? this._renderTarget.base : null;
    }

    /** @private */
    get renderTargetOptions()
    {
        return this._miscOptions & 0xff;
    }

    /** Sets the triangle culling mode. Allows to exclude triangles from rendering based on
     *  their orientation relative to the view plane.
     *  @default Context3DTriangleFace.NONE
     */
    get culling()
    {
        return this._culling;
    }

    set culling(value)
    {
        if (this.culling !== value)
        {
            if (!!this._onDrawRequired) this._onDrawRequired();
            this._culling = value;
        }
    }

    /** The clipping rectangle can be used to limit rendering in the current render target to
     *  a certain area. This method expects the rectangle in stage coordinates. To prevent
     *  any clipping, assign <code>null</code>.
     *
     *  @default null
     */
    get clipRect()
    {
        return this._clipRect;
    }

    set clipRect(value)
    {
        if (!RectangleUtil.compare(this._clipRect, value))
        {
            if (this._onDrawRequired) this._onDrawRequired();
            if (value)
            {
                if (!this._clipRect) this._clipRect = Pool.getRectangle();
                this._clipRect.copyFrom(value);
            }
            else if (this._clipRect)
            {
                Pool.putRectangle(this._clipRect);
                this._clipRect = null;
            }
        }
    }

    /** The anti-alias setting used when setting the current render target
     *  via <code>setRenderTarget</code>. */
    get renderTargetAntiAlias()
    {
        return this._miscOptions & 0xf;
    }

    /** Indicates if the render target (set via <code>setRenderTarget</code>)
     *  has its depth and stencil buffers enabled. */
    get renderTargetSupportsDepthAndStencil()
    {
        return (this._miscOptions & 0xf0) !== 0;
    }

    /** Indicates if there have been any 3D transformations.
     *  Returns <code>true</code> if the 3D modelview matrix contains a value. */
    get is3D()
    {
        return !!this._modelviewMatrix3D;
    }

    /** @private
     *
     *  This callback is executed whenever a state change requires a draw operation.
     *  This is the case if blend mode, render target, culling or clipping rectangle
     *  are changing. */
    get onDrawRequired()
    {
        return this._onDrawRequired;
    }

    set onDrawRequired(value)
    {
        this._onDrawRequired = value;
    }
}
