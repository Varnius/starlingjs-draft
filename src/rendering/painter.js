import { NEVER } from 'gl-constants';

import BatchProcessor from './batch-processor';
import RenderState from './render-state';

import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';
import Rectangle from '../math/rectangle';
import Vector3D from '../math/vector3d';

import BlendMode from '../display/blend-mode';
import Quad from '../display/quad';

import MathUtil from '../utils/math-util';
import MatrixUtil from '../utils/matrix-util';
import MeshSubset from '../utils/mesh-subset';
import Pool from '../utils/pool';
import RectangleUtil from '../utils/rectangle-util';
import RenderUtil from '../utils/render-util';
//import SystemUtil from '../utils/system-util';

/** A class that orchestrates rendering of all Starling display objects.
 *
 *  <p>A Starling instance contains exactly one 'Painter' instance that should be used for all
 *  rendering purposes. Each frame, it is passed to the render methods of all rendered display
 *  objects. To access it outside a render method, call <code>Starling.painter</code>.</p>
 *
 *  <p>The painter is responsible for drawing all display objects to the screen. At its
 *  core, it is a wrapper for many Context3D methods, but that's not all: it also provides
 *  a convenient state mechanism, supports masking and acts as middleman between display
 *  objects and renderers.</p>
 *
 *  <strong>The State Stack</strong>
 *
 *  <p>The most important concept of the Painter class is the state stack. A RenderState
 *  stores a combination of settings that are currently used for rendering, e.g. the current
 *  projection- and modelview-matrices and context-related settings. It can be accessed
 *  and manipulated via the <code>state</code> property. Use the methods
 *  <code>pushState</code> and <code>popState</code> to store a specific state and restore
 *  it later. That makes it easy to write rendering code that doesn't have any side effects.</p>
 *
 *  <listing>
 *  painter.pushState(); // save a copy of the current state on the stack
 *  painter.state.renderTarget = renderTexture;
 *  painter.state.transformModelviewMatrix(object.transformationMatrix);
 *  painter.state.alpha = 0.5;
 *  painter.prepareToDraw(); // apply all state settings at the render context
 *  drawSomething(); // insert Stage3D rendering code here
 *  painter.popState(); // restores previous state</listing>
 *
 *  @see RenderState
 */
export default class Painter {
    // the key for the programs stored in 'sharedData'
    static PROGRAM_DATA_NAME = 'starling.rendering.Painter.Programs';

    /** The value with which the stencil buffer will be cleared,
     *  and the default reference value used for stencil tests. */
    static DEFAULT_STENCIL_VALUE = 127;

    // members

    _stage3D;
    _context;
    _shareContext;
    _drawCount;
    _frameID;
    _pixelSize;
    _enableErrorChecking;
    _stencilReferenceValues;
    _clipRectStack;
    _batchCacheExclusions;

    _batchProcessor;
    _batchProcessorCurr; // current  processor
    _batchProcessorPrev; // previous processor (cache)
    _batchProcessorSpec; // special  processor (no cache)

    _actualRenderTarget;
    _actualRenderTargetOptions;
    _actualCulling;
    _actualBlendMode;

    _backBufferWidth;
    _backBufferHeight;
    _backBufferScaleFactor;

    _state;
    _stateStack;
    _stateStackPos;
    _stateStackLength;

    // shared data
    static sSharedData = new Map();

    // helper objects
    static sMatrix = new Matrix();
    static sPoint3D = new Vector3D();
    static sMatrix3D = new Matrix3D();
    static sClipRect = new Rectangle();
    static sBufferRect = new Rectangle();
    static sScissorRect = new Rectangle();
    static sMeshSubset = new MeshSubset();

    // construction

    /** Creates a new Painter object. Normally, it's not necessary to create any custom
     *  painters; instead, use the global painter found on the Starling instance. */
    constructor(canvas) {
        const gl = canvas.getContext('webgl2', { stencil: true, depth: true });

        if (!gl) {
            console.log('Dafuq, WebGL 2 is not available.  See <a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>');
            return;
        }

        gl.frontFace(gl.CW);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.STENCIL_TEST);
        gl.enable(gl.CULL_FACE);
        this._context = gl;

        this._actualBlendMode = null;
        this._actualCulling = null;
        this._backBufferWidth = canvas.width;
        this._backBufferHeight = canvas.height;
        this._shareContext = false;
        this._backBufferWidth = this._context ? canvas.width : 0;
        this._backBufferHeight = this._context ? canvas.height : 0;
        this._backBufferScaleFactor = this._pixelSize = 1.0;
        this._stencilReferenceValues = new WeakMap();
        this._clipRectStack = [];

        this._batchProcessorCurr = new BatchProcessor();
        this._batchProcessorCurr.onBatchComplete = this.drawBatch;

        this._batchProcessorPrev = new BatchProcessor();
        this._batchProcessorPrev.onBatchComplete = this.drawBatch;

        this._batchProcessorSpec = new BatchProcessor();
        this._batchProcessorSpec.onBatchComplete = this.drawBatch;

        this._batchProcessor = this._batchProcessorCurr;
        this._batchCacheExclusions = [];

        this._state = new RenderState();
        this._state.onDrawRequired = this.finishMeshBatch;
        this._stateStack = [];
        this._stateStackPos = -1;
        this._stateStackLength = 0;
    }

    /** Disposes all mesh batches, programs, and - if it is not being shared -
     *  the render context. */
    dispose() {
        this._batchProcessorCurr.dispose();
        this._batchProcessorPrev.dispose();
        this._batchProcessorSpec.dispose();

        if (!this._shareContext) {
            this._context.dispose(false);
            Painter.sSharedData = new Map();
        }
    }

    // program management

    /** Registers a program under a certain name.
     *  If the name was already used, the previous program is overwritten. */
    registerProgram(name, program) {
        this.deleteProgram(name);
        this.programs[name] = program;
    }

    /** Deletes the program of a certain name. */
    deleteProgram(name) {
        const program = this.getProgram(name);
        if (program) {
            program.dispose();
            delete this.programs[name];
        }
    }

    /** Returns the program registered under a certain name, or null if no program with
     *  this name has been registered. */
    getProgram(name) {
        return this.programs[name];
    }

    /** Indicates if a program is registered under a certain name. */
    hasProgram(name) {
        return name in this.programs;
    }

    // state stack

    /** Pushes the current render state to a stack from which it can be restored later.
     *
     *  <p>If you pass a BatchToken, it will be updated to point to the current location within
     *  the render cache. That way, you can later reference this location to render a subset of
     *  the cache.</p>
     */
    pushState(token = null) {
        this._stateStackPos++;

        if (this._stateStackLength < this._stateStackPos + 1) this._stateStack[this._stateStackLength++] = new RenderState();
        if (token) this._batchProcessor.fillToken(token);

        this._stateStack[this._stateStackPos].copyFrom(this._state);
    }

    /** Modifies the current state with a transformation matrix, alpha factor, and blend mode.
     *
     *  @param transformationMatrix Used to transform the current <code>modelviewMatrix</code>.
     *  @param alphaFactor          Multiplied with the current alpha value.
     *  @param blendMode            Replaces the current blend mode; except for 'auto', which
     *                              means the current value remains unchanged.
     */
    setStateTo(transformationMatrix, alphaFactor = 1.0, blendMode = 'auto') {
        if (transformationMatrix) MatrixUtil.prependMatrix(this._state._modelviewMatrix, transformationMatrix);
        if (alphaFactor !== 1.0) this._state._alpha *= alphaFactor;
        if (blendMode !== BlendMode.AUTO) this._state.blendMode = blendMode;
    }

    /** Restores the render state that was last pushed to the stack. If this changes
     *  blend mode, clipping rectangle, render target or culling, the current batch
     *  will be drawn right away.
     *
     *  <p>If you pass a BatchToken, it will be updated to point to the current location within
     *  the render cache. That way, you can later reference this location to render a subset of
     *  the cache.</p>
     */
    popState(token = null) {
        if (this._stateStackPos < 0)
            throw new Error('[IllegalOperation] Cannot pop empty state stack');

        this._state.copyFrom(this._stateStack[this._stateStackPos]); // -> might cause 'finishMeshBatch'
        this._stateStackPos--;

        if (token) this._batchProcessor.fillToken(token);
    }

    /** Restores the render state that was last pushed to the stack, but does NOT remove
     *  it from the stack. */
    restoreState() {
        if (this._stateStackPos < 0)
            throw new Error('[IllegalOperationError] Cannot restore from empty state stack');

        this._state.copyFrom(this._stateStack[this._stateStackPos]); // -> might cause 'finishMeshBatch'
    }

    /** Updates all properties of the given token so that it describes the current position
     *  within the render cache. */
    fillToken(token) {
        if (token) this._batchProcessor.fillToken(token);
    }

    // masks

    /** Draws a display object into the stencil buffer, incrementing the buffer on each
     *  used pixel. The stencil reference value is incremented as well; thus, any subsequent
     *  stencil tests outside of this area will fail.
     *
     *  <p>If 'mask' is part of the display list, it will be drawn at its conventional stage
     *  coordinates. Otherwise, it will be drawn with the current modelview matrix.</p>
     *
     *  <p>As an optimization, this method might update the clipping rectangle of the render
     *  state instead of utilizing the stencil buffer. This is possible when the mask object
     *  is of type <code>starling.display.Quad</code> and is aligned parallel to the stage
     *  axes.</p>
     *
     *  <p>Note that masking breaks the render cache; the masked object must be redrawn anew
     *  in the next frame. If you pass <code>maskee</code>, the method will automatically
     *  call <code>excludeFromCache(maskee)</code> for you.</p>
     */
    drawMask(mask, maskee = null) {
        const gl = this._context;
        const { sMatrix, sClipRect } = Painter;

        if (!gl) return;

        this.finishMeshBatch();

        if (this.isRectangularMask(mask, maskee, sMatrix)) {
            mask.getBounds(mask, sClipRect);
            RectangleUtil.getBounds(sClipRect, sMatrix, sClipRect);
            this.pushClipRect(sClipRect);
        } else {

            // In 'renderMask', we'll make sure the depth test always fails. Thus, the 3rd
            // parameter of 'setStencilActions' will always be ignored; the 4th is the one
            // that counts!

            if (maskee && maskee.maskInverted) {
                gl.stencilFunc(gl.ALWAYS, this.stencilReferenceValue, 0xff);
                gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);

                this.renderMask(mask);
            } else {
                gl.stencilFunc(gl.EQUAL, this.stencilReferenceValue, 0xff);
                gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP); // sfail zfail bothpass

                this.renderMask(mask);
                this.stencilReferenceValue++;
            }

            gl.stencilFunc(gl.EQUAL, this.stencilReferenceValue, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        }

        this.excludeFromCache(maskee);
    }

    /** Draws a display object into the stencil buffer, decrementing the
     *  buffer on each used pixel. This effectively erases the object from the stencil buffer,
     *  restoring the previous state. The stencil reference value will be decremented.
     *
     *  <p>Note: if the mask object meets the requirements of using the clipping rectangle,
     *  it will be assumed that this erase operation undoes the clipping rectangle change
     *  caused by the corresponding <code>drawMask()</code> call.</p>
     */
    eraseMask(mask, maskee = null) {
        const gl = this._context;
        if (!gl) return;

        this.finishMeshBatch();

        if (this.isRectangularMask(mask, maskee, Painter.sMatrix)) {
            this.popClipRect();
        } else {
            // In 'renderMask', we'll make sure the depth test always fails. Thus, the 3rd
            // parameter of 'setStencilActions' will always be ignored; the 4th is the one
            // that counts!

            if (maskee && maskee.maskInverted) {
                gl.stencilFunc(gl.ALWAYS, this.stencilReferenceValue, 0xff);
                gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP);

                this.renderMask(mask);
            } else {
                gl.stencilFunc(gl.EQUAL, this.stencilReferenceValue, 0xff);
                gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);

                this.renderMask(mask);
                this.stencilReferenceValue--;
            }

            // restore default stencil action ("keep")

            gl.stencilFunc(gl.EQUAL, this.stencilReferenceValue, 0xff);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        }
    }

    renderMask(mask) {
        const { _state } = this;
        const { sMatrix3D, sMatrix } = Painter;
        const wasCacheEnabled = this.cacheEnabled;
        const gl = this._context;

        this.pushState();
        this.cacheEnabled = false;
        _state.depthTest = NEVER;  // depth test always fails ->
                                   // color buffer won't be modified
        let matrix = null;
        let matrix3D = null;

        if (mask.stage) {
            _state.setModelviewMatricesToIdentity();

            if (mask.is3D) matrix3D = mask.getTransformationMatrix3D(null, sMatrix3D);
            else matrix = mask.getTransformationMatrix(null, sMatrix);
        } else if (mask.is3D) matrix3D = mask.transformationMatrix3D;
        else matrix = mask.transformationMatrix;

        if (matrix3D) _state.transformModelviewMatrix3D(matrix3D);
        else _state.transformModelviewMatrix(matrix);

        gl.colorMask(false, false, false, false);
        mask.render(this);
        this.finishMeshBatch();
        gl.colorMask(true, true, true, true);

        this.cacheEnabled = wasCacheEnabled;
        this.popState();
    }

    pushClipRect(clipRect) {
        const stack = this._clipRectStack;
        const stackLength = stack.length;
        const intersection = Pool.getRectangle();

        if (stackLength)
            RectangleUtil.intersect(stack[stackLength - 1], clipRect, intersection);
        else
            intersection.copyFrom(clipRect);

        stack[stackLength] = intersection;
        this._state.clipRect = intersection;
    }

    popClipRect() {
        const stack = this._clipRectStack;
        let stackLength = stack.length;

        if (stackLength === 0)
            throw new Error('Trying to pop from empty clip rectangle stack');

        stackLength--;
        Pool.putRectangle(stack.pop());
        this._state.clipRect = stackLength ? stack[stackLength - 1] : null;
    }

    /** Figures out if the mask can be represented by a scissor rectangle; this is possible
     *  if it's just a simple (untextured) quad that is parallel to the stage axes. The 'out'
     *  parameter will be filled with the transformation matrix required to move the mask into
     *  stage coordinates. */
    isRectangularMask(mask, maskee, out) {
        const quad = mask instanceof Quad ? mask : null;
        const is3D = mask.is3D || (maskee && maskee.is3D && !mask.stage);

        if (quad && !is3D && !quad.texture && !maskee.maskInverted) {
            if (mask.stage) mask.getTransformationMatrix(null, out);
            else {
                out.copyFrom(mask.transformationMatrix);
                out.concat(this._state.modelviewMatrix);
            }

            return (MathUtil.isEquivalent(out.a, 0) && MathUtil.isEquivalent(out.d, 0)) ||
                (MathUtil.isEquivalent(out.b, 0) && MathUtil.isEquivalent(out.c, 0));
        }
        return false;
    }

    // mesh rendering

    /** Adds a mesh to the current batch of unrendered meshes. If the current batch is not
     *  compatible with the mesh, all previous meshes are rendered at once and the batch
     *  is cleared.
     *
     *  @param mesh    The mesh to batch.
     *  @param subset  The range of vertices to be batched. If <code>null</code>, the complete
     *                 mesh will be used.
     */
    batchMesh(mesh, subset = null) {
        this._batchProcessor.addMesh(mesh, this._state, subset);
    }

    /** Finishes the current mesh batch and prepares the next one. */
    finishMeshBatch = () => {
        this._batchProcessor.finishBatch();
    };

    /** Completes all unfinished batches, cleanup procedures. */
    finishFrame() {
        const { _frameID, _batchProcessorCurr, _batchProcessorSpec } = this;
        if (_frameID % 99 === 0) _batchProcessorCurr.trim(); // odd number -> alternating processors
        if (_frameID % 150 === 0) _batchProcessorSpec.trim();

        this._batchProcessor.finishBatch();
        this._batchProcessor = _batchProcessorSpec; // no cache between frames
        this.processCacheExclusions();
    }

    processCacheExclusions() {
        let i;
        const length = this._batchCacheExclusions.length;
        for (i = 0; i < length; ++i) this._batchCacheExclusions[i].excludeFromCache();
        this._batchCacheExclusions.length = 0;
    }

    /** Makes sure that the default context settings Starling relies on will be refreshed
     *  before the next 'draw' operation. This includes blend mode, culling, and depth test. */
    setupContextDefaults() {
        this._actualBlendMode = null;
        this._actualCulling = null;
        this._actualDepthMask = false;
        this._actualDepthTest = null;
    }

    /** Resets the current state, state stack, batch processor, stencil reference value,
     *  clipping rectangle, and draw count. Furthermore, depth testing is disabled. */
    nextFrame() {
        // update batch processors
        this._batchProcessor = this.swapBatchProcessors();
        this._batchProcessor.clear();
        this._batchProcessorSpec.clear();

        this.setupContextDefaults();

        // reset everything else
        this.stencilReferenceValue = Painter.DEFAULT_STENCIL_VALUE;
        this._clipRectStack.length = 0;
        this._drawCount = 0;
        this._stateStackPos = -1;
        this._state.reset();
    }

    swapBatchProcessors() {
        const tmp = this._batchProcessorPrev;
        this._batchProcessorPrev = this._batchProcessorCurr;
        this._batchProcessorCurr = tmp;
        return tmp;
    }

    /** Draws all meshes from the render cache between <code>startToken</code> and
     *  (but not including) <code>endToken</code>. The render cache contains all meshes
     *  rendered in the previous frame. */
    drawFromCache(startToken, endToken) {
        let meshBatch;
        const subset = Painter.sMeshSubset;

        if (!startToken.equals(endToken)) {
            this.pushState();

            for (let i = startToken.batchID; i <= endToken.batchID; ++i) {
                meshBatch = this._batchProcessorPrev.getBatchAt(i);
                subset.setTo(); // resets subset

                if (i === startToken.batchID) {
                    subset.vertexID = startToken.vertexID;
                    subset.indexID = startToken.indexID;
                    subset.numVertices = meshBatch.numVertices - subset.vertexID;
                    subset.numIndices = meshBatch.numIndices - subset.indexID;
                }

                if (i === endToken.batchID) {
                    subset.numVertices = endToken.vertexID - subset.vertexID;
                    subset.numIndices = endToken.indexID - subset.indexID;
                }

                if (subset.numVertices) {
                    this._state.alpha = 1.0;
                    this._state.blendMode = meshBatch.blendMode;
                    this._batchProcessor.addMesh(meshBatch, this._state, subset, true);
                }
            }

            this.popState();
        }
    }

    /** Prevents the object from being drawn from the render cache in the next frame.
     *  Different to <code>setRequiresRedraw()</code>, this does not indicate that the object
     *  has changed in any way, but just that it doesn't support being drawn from cache.
     *
     *  <p>Note that when a container is excluded from the render cache, its children will
     *  still be cached! This just means that batching is interrupted at this object when
     *  the display tree is traversed.</p>
     */
    excludeFromCache(object) {
        if (object) this._batchCacheExclusions[this._batchCacheExclusions.length] = object;
    }

    drawBatch = meshBatch => {
        this.pushState();

        this.state.blendMode = meshBatch.blendMode;
        this.state.modelviewMatrix.identity();
        this.state.alpha = 1.0;

        meshBatch.render(this);

        this.popState();
    };

    // helper methods

    /** Applies all relevant state settings to at the render context. This includes
     *  blend mode, render target and clipping rectangle. Always call this method before
     *  <code>context.drawTriangles()</code>.
     */
    prepareToDraw() {
        this.applyBlendMode();
        this.applyRenderTarget();
        this.applyClipRect();
        this.applyCulling();
        this.applyDepthTest();
    }

    /** Clears the render context with a certain color and alpha value. Since this also
     *  clears the stencil buffer, the stencil reference value is also reset to '0'. */
    clear(rgb = 0, alpha = 0.0) {
        this.applyRenderTarget();
        this.stencilReferenceValue = Painter.DEFAULT_STENCIL_VALUE;
        RenderUtil.clear(rgb, alpha, 1.0, Painter.DEFAULT_STENCIL_VALUE);
    }

    /** Resets the render target to the back buffer and displays its contents. */
    present() {
        this._state.renderTarget = null;
        this._actualRenderTarget = null;
        //this._context.present(); todo: no need for this with gl, consider removing this method
    }

    applyBlendMode() {
        const blendMode = this._state.blendMode;

        if (blendMode !== this._actualBlendMode) {
            BlendMode.get(this._state.blendMode).activate();
            this._actualBlendMode = blendMode;
        }
    }

    applyCulling() {
        const culling = this._state.culling;

        if (culling !== this._actualCulling) {
            const gl = this._context;
            gl.cullFace(culling);

            this._actualCulling = culling;
        }
    }

    applyDepthTest() {
        const depthMask = this._state.depthMask;
        const depthTest = this._state.depthTest;

        if (depthMask !== this._actualDepthMask || depthTest !== this._actualDepthTest) {
            const gl = this._context;
            gl.depthMask(depthMask);
            gl.depthFunc(depthTest);
            this._actualDepthMask = depthMask;
            this._actualDepthTest = depthTest;
        }
    }

    applyRenderTarget() {
        const gl = this._context;
        const { _state } = this;
        const target = _state.renderTargetBase;
        const options = _state.renderTargetOptions;

        if (target !== this._actualRenderTarget || options !== this._actualRenderTargetOptions) {
            if (target) {
                //const antiAlias = _state.renderTargetAntiAlias;
                //const depthAndStencil = _state.renderTargetSupportsDepthAndStencil;
                //_context.setRenderToTexture(target, depthAndStencil, antiAlias);
                // todo: implement depth, stencil

                const fb = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                console.log('implemented: setRenderToBackBuffer');
            }

            gl.stencilFunc(gl.ALWAYS, this.stencilReferenceValue, 0xff);

            this._actualRenderTargetOptions = options;
            this._actualRenderTarget = target;
        }
    }

    applyClipRect() {
        const clipRect = this._state.clipRect;
        const gl = this._context;

        if (clipRect) {
            let width, height;
            const projMatrix = this._state.projectionMatrix3D;
            const renderTarget = this._state.renderTarget;

            if (renderTarget) {
                width = renderTarget.root.nativeWidth;
                height = renderTarget.root.nativeHeight;
            } else {
                width = this._backBufferWidth;
                height = this._backBufferHeight;
            }

            const { sPoint3D, sClipRect, sBufferRect, sScissorRect } = Painter;

            // convert to pixel coordinates (matrix transformation ends up in range [-1, 1])
            MatrixUtil.transformCoords3D(projMatrix, clipRect.x, clipRect.y, 0.0, sPoint3D);
            sPoint3D.project(); // eliminate w-coordinate
            sClipRect.x = (sPoint3D.x * 0.5 + 0.5) * width;
            sClipRect.y = (0.5 - sPoint3D.y * 0.5) * height;

            MatrixUtil.transformCoords3D(projMatrix, clipRect.right, clipRect.bottom, 0.0, sPoint3D);
            sPoint3D.project(); // eliminate w-coordinate
            sClipRect.right = (sPoint3D.x * 0.5 + 0.5) * width;
            sClipRect.bottom = (0.5 - sPoint3D.y * 0.5) * height;

            sBufferRect.setTo(0, 0, width, height);
            RectangleUtil.intersect(sClipRect, sBufferRect, sScissorRect);

            // an empty rectangle is not allowed, so we set it to the smallest possible size
            if (sScissorRect.width < 1 || sScissorRect.height < 1)
                sScissorRect.setTo(0, 0, 1, 1);

            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(sScissorRect.x, height - sScissorRect.y - sScissorRect.height, sScissorRect.width, sScissorRect.height);
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
    }

    // properties

    /** Indicates the number of stage3D draw calls. */
    get drawCount() {
        return this._drawCount;
    }

    set drawCount(value) {
        this._drawCount = value;
    }

    /** The current stencil reference value of the active render target. This value
     *  is typically incremented when drawing a mask and decrementing when erasing it.
     *  The painter keeps track of one stencil reference value per render target.
     *  Only change this value if you know what you're doing!
     */
    get stencilReferenceValue() {
        const key = this._state.renderTarget ? this._state.renderTargetBase : this;
        if (key in this._stencilReferenceValues) return this._stencilReferenceValues[key];
        else return Painter.DEFAULT_STENCIL_VALUE;
    }

    set stencilReferenceValue(value) {
        const key = this._state.renderTarget ? this._state.renderTargetBase : this;
        const gl = this._context;
        this._stencilReferenceValues[key] = value;

        if (this.contextValid)
            gl.stencilFunc(gl.ALWAYS, this.stencilReferenceValue, 0xff);
    }

    /** Indicates if the render cache is enabled. Normally, this should be left at the default;
     *  however, some custom rendering logic might require to change this property temporarily.
     *  Also note that the cache is automatically reactivated each frame, right before the
     *  render process.
     *
     *  @default true
     */
    get cacheEnabled() {
        return this._batchProcessor === this._batchProcessorCurr;
    }

    set cacheEnabled(value) {
        if (value !== this.cacheEnabled) {
            this.finishMeshBatch();

            if (value) this._batchProcessor = this._batchProcessorCurr;
            else this._batchProcessor = this._batchProcessorSpec;
        }
    }

    /** The current render state, containing some of the context settings, projection- and
     *  modelview-matrix, etc. Always returns the same instance, even after calls to 'pushState'
     *  and 'popState'.
     *
     *  <p>When you change the current RenderState, and this change is not compatible with
     *  the current render batch, the batch will be concluded right away. Thus, watch out
     *  for changes of blend mode, clipping rectangle, render target or culling.</p>
     */
    get state() {
        return this._state;
    }

    /** The Context3D instance this painter renders into. */
    get context() {
        return this._context;
    }

    /** Returns the index of the current frame <strong>if</strong> the render cache is enabled;
     *  otherwise, returns zero. To get the frameID regardless of the render cache, call
     *  <code>Starling.frameID</code> instead. */
    set frameID(value) {
        this._frameID = value;
    }

    get frameID() {
        return this._batchProcessor === this._batchProcessorCurr ? this._frameID : 0;
    }

    /** The size (in points) that represents one pixel in the back buffer. */
    get pixelSize() {
        return this._pixelSize;
    }

    set pixelSize(value) {
        this._pixelSize = value;
    }

    /** Indicates if another Starling instance (or another Stage3D framework altogether)
     *  uses the same render context. @default false */
    get shareContext() {
        return this._shareContext;
    }

    set shareContext(value) {
        this._shareContext = value;
    }

    /** Returns the current width of the back buffer. In most cases, this value is in pixels;
     *  however, if the app is running on an HiDPI display with an activated
     *  'supportHighResolutions' setting, you have to multiply with 'backBufferPixelsPerPoint'
     *  for the actual pixel count. Alternatively, use the Context3D-property with the
     *  same name: it will return the exact pixel values. */
    get backBufferWidth() {
        return this._backBufferWidth;
    }

    /** Returns the current height of the back buffer. In most cases, this value is in pixels;
     *  however, if the app is running on an HiDPI display with an activated
     *  'supportHighResolutions' setting, you have to multiply with 'backBufferPixelsPerPoint'
     *  for the actual pixel count. Alternatively, use the Context3D-property with the
     *  same name: it will return the exact pixel values. */
    get backBufferHeight() {
        return this._backBufferHeight;
    }

    /** The number of pixels per point returned by the 'backBufferWidth/Height' properties.
     *  Except for desktop HiDPI displays with an activated 'supportHighResolutions' setting,
     *  this will always return '1'. */
    get backBufferScaleFactor() {
        return this._backBufferScaleFactor;
    }

    /** Indicates if the Context3D object is currently valid (i.e. it hasn't been lost or
     *  disposed). */
    get contextValid() {
        return true;
        //if (this._context)
        //{
        //    const driverInfo = this._context.driverInfo;
        //    return driverInfo !== null && driverInfo !== '' && driverInfo !== 'Disposed';
        //}
        //else return false;
    }

    /** A dictionary that can be used to save custom data related to the render context.
     *  If you need to share data that is bound to the render context (e.g. textures), use
     *  this dictionary instead of creating a static class variable. That way, the data will
     *  be available for all Starling instances that use this stage3D / context. */
    get sharedData() {
        let data = Painter.sSharedData[this._context];
        if (!data) {
            data = new Map();
            Painter.sSharedData[this._context] = data;
        }
        return data;
    }

    get programs() {
        let programs = this.sharedData[Painter.PROGRAM_DATA_NAME];
        if (!programs) {
            programs = new Map();
            this.sharedData[Painter.PROGRAM_DATA_NAME] = programs;
        }
        return programs;
    }
}
