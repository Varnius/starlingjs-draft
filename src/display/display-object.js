import Starling from '../core/starling';
//import Stage from './stage'; todo: cyclic???

import EventDispatcher from '../events/event-dispatcher';
import Event from '../events/event';
import TouchEvent from '../events/touch-event';
import AbstractMethodError from '../errors/abstract-method-error';
import Align from '../utils/align';

import Point from '../math/point';
import Vector3D from '../math/vector3d';
import Rectangle from '../math/rectangle';
import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';

import BatchToken from '../rendering/batch-token';

import MathUtil from '../utils/math-util';
import MatrixUtil from '../utils/matrix-util';

export default class DisplayObject extends EventDispatcher {
    static sAncestors = [];
    static sHelperPoint = new Point();
    static sHelperPoint3D = new Vector3D();
    static sHelperPointAlt3D = new Vector3D();
    static sHelperRect = new Rectangle();
    static sHelperMatrix = new Matrix();
    static sHelperMatrixAlt = new Matrix();
    static sHelperMatrix3D = new Matrix3D();
    static sHelperMatrixAlt3D = new Matrix3D();
    static sMaskWarningShown = false;

    _x = 0.0;
    _y = 0.0;
    _pivotX = 0.0;
    _pivotY = 0.0;
    _scaleX = 1.0;
    _scaleY = 1.0;
    _skewX = 0.0;
    _skewY = 0.0;
    _rotation = 0.0;
    _alpha = 1.0;
    _visible = true;
    _touchable = true;
    _blendMode = 'auto'; // todo: add enum
    _name;
    _useHandCursor;
    _transformationMatrix = new Matrix();
    _transformationMatrix3D;
    _transformationChanged;
    _is3D;
    _maskee;

    _parent = null;
    _lastParentOrSelfChangeFrameID;
    _lastChildChangeFrameID;
    _tokenFrameID;
    _pushToken = new BatchToken();
    _popToken = new BatchToken();
    _hasVisibleArea = true;
    _filter;
    _mask;

    //constructor()
    //{
    //    // todo: find eqq
    //    //if (getQualifiedClassName(this) == 'starling.display::DisplayObject')
    //    //{
    //    //    throw new AbstractClassError();
    //    //}
    //
    //    super();
    //}

    /** Disposes all resources of the display object.
     * GPU buffers are released, event listeners are removed, filters and masks are disposed. */
    dispose() {
        const { _filter, _mask } = this;
        if (_filter) _filter.dispose();
        if (_mask) _mask.dispose();
        this.removeEventListeners();
        this.mask = null; // clear 'mask._maskee', just to be sure.
    }

    /** Removes the object from its parent, if it has one, and optionally disposes it. */
    removeFromParent(dispose = false) {
        if (this._parent) this._parent.removeChild(this, dispose);
        else if (dispose) this.dispose();
    }

    /** Creates a matrix that represents the transformation from the local coordinate system
     *  to another. If you pass an <code>out</code>-matrix, the result will be stored in this
     *  matrix instead of creating a new object. */
    getTransformationMatrix(targetSpace, out = null) {
        const { transformationMatrix, _parent, base } = this;
        let currentObject;

        if (out) out.identity();
        else out = new Matrix();

        if (targetSpace === this) {
            return out;
        } else if (targetSpace === _parent || (!targetSpace && !_parent)) {
            out.copyFrom(transformationMatrix);
            return out;
        } else if (!targetSpace || targetSpace === base) {
            // targetCoordinateSpace 'null' represents the target space of the base object.
            // -> move up from this to base

            currentObject = this;
            while (currentObject !== targetSpace) {
                out.concat(currentObject.transformationMatrix);
                currentObject = currentObject._parent;
            }

            return out;
        } else if (targetSpace._parent === this) { // optimization
            targetSpace.getTransformationMatrix(this, out);
            out.invert();

            return out;
        }

        // 1. find a common parent of this and the target space

        const commonParent = DisplayObject.findCommonParent(this, targetSpace);

        // 2. move up from this to common parent

        currentObject = this;
        while (currentObject !== commonParent) {
            out.concat(currentObject.transformationMatrix);
            currentObject = currentObject._parent;
        }

        if (commonParent === targetSpace)
            return out;

        // 3. now move up from target until we reach the common parent

        DisplayObject.sHelperMatrix.identity();
        currentObject = targetSpace;
        while (currentObject !== commonParent) {
            DisplayObject.sHelperMatrix.concat(currentObject.transformationMatrix);
            currentObject = currentObject._parent;
        }

        // 4. now combine the two matrices

        DisplayObject.sHelperMatrix.invert();
        out.concat(DisplayObject.sHelperMatrix);

        return out;
    }

    /** Returns a rectangle that completely encloses the object as it appears in another
     *  coordinate system. If you pass an <code>out</code>-rectangle, the result will be
     *  stored in this rectangle instead of creating a new object. */
    getBounds(targetSpace, out = null) { // eslint-disable-line
        throw new AbstractMethodError();
    }

    /** Returns the object that is found topmost beneath a point in local coordinates, or nil
     *  if the test fails. Untouchable and invisible objects will cause the test to fail. */
    hitTest(localPoint) {
        const { _visible, _touchable, _mask, hitTestMask, getBounds } = this;

        // on a touch test, invisible or untouchable objects cause the test to fail
        if (!_visible || !_touchable) return null;

        // if we've got a mask and the hit occurs outside, fail
        if (_mask && !hitTestMask(localPoint)) return null;

        // otherwise, check bounding box
        if (getBounds(this, DisplayObject.sHelperRect).containsPoint(localPoint)) return this;
        return null;
    }

    /** Checks if a certain point is inside the display object's mask. If there is no mask,
     *  this method always returns <code>true</code> (because having no mask is equivalent
     *  to having one that's infinitely big). */
    hitTestMask(localPoint) {
        const { _mask, getTransformationMatrix } = this;
        const { sHelperPoint } = DisplayObject;
        if (_mask) {
            if (_mask.stage) getTransformationMatrix(_mask, DisplayObject.sHelperMatrixAlt);
            else {
                DisplayObject.sHelperMatrixAlt.copyFrom(_mask.transformationMatrix);
                DisplayObject.sHelperMatrixAlt.invert();
            }

            const helperPoint = localPoint === sHelperPoint ? new Point() : sHelperPoint;
            MatrixUtil.transformPoint(DisplayObject.sHelperMatrixAlt, localPoint, helperPoint);
            return !!_mask.hitTest(helperPoint);
        }

        return true;
    }

    /** Transforms a point from the local coordinate system to global (stage) coordinates.
     *  If you pass an <code>out</code>-point, the result will be stored in this point instead
     *  of creating a new object. */
    localToGlobal(localPoint, out = null) {
        const { is3D, local3DToGlobal } = this;
        const { sHelperPoint3D, sHelperMatrixAlt } = DisplayObject;

        if (is3D) {
            sHelperPoint3D.setTo(localPoint.x, localPoint.y, 0);
            return local3DToGlobal(sHelperPoint3D, out);
        }

        this.getTransformationMatrix(this.base, sHelperMatrixAlt);
        return MatrixUtil.transformPoint(sHelperMatrixAlt, localPoint, out);
    }

    /** Transforms a point from global (stage) coordinates to the local coordinate system.
     *  If you pass an <code>out</code>-point, the result will be stored in this point instead
     *  of creating a new object. */
    globalToLocal(globalPoint, out = null) {
        const { is3D, stage } = this;
        const { sHelperPoint3D, sHelperPointAlt3D } = DisplayObject;

        if (is3D) {
            this.globalToLocal3D(globalPoint, sHelperPoint3D);
            stage.getCameraPosition(this, sHelperPointAlt3D);
            return MathUtil.intersectLineWithXYPlane(sHelperPointAlt3D, sHelperPoint3D, out);
        }

        this.getTransformationMatrix(this.base, DisplayObject.sHelperMatrixAlt);
        DisplayObject.sHelperMatrixAlt.invert();
        return MatrixUtil.transformPoint(DisplayObject.sHelperMatrixAlt, globalPoint, out);
    }

    /** Renders the display object with the help of a painter object. Never call this method
     *  directly, except from within another render method.
     *
     *  @param painter Captures the current render state and provides utility functions
     *                 for rendering.
     */
    render(painter) { // eslint-disable-line
        throw new AbstractMethodError();
    }

    /** Moves the pivot point to a certain position within the local coordinate system
     *  of the object. If you pass no arguments, it will be centered. */
    alignPivot(horizontalAlign = 'center', verticalAlign = 'center') {
        const { sHelperRect } = DisplayObject;
        const bounds = this.getBounds(this, sHelperRect);
        this.setTransformationChanged();

        if (horizontalAlign === Align.LEFT) this._pivotX = bounds.x;
        else if (horizontalAlign === Align.CENTER) this._pivotX = bounds.x + bounds.width / 2.0;
        else if (horizontalAlign === Align.RIGHT) this._pivotX = bounds.x + bounds.width;
        else throw new Error('[ArgumentError] Invalid horizontal alignment: ' + horizontalAlign);

        if (verticalAlign === Align.TOP) this._pivotY = bounds.y;
        else if (verticalAlign === Align.CENTER) this._pivotY = bounds.y + bounds.height / 2.0;
        else if (verticalAlign === Align.BOTTOM) this._pivotY = bounds.y + bounds.height;
        else throw new Error('[ArgumentError] Invalid vertical alignment: ' + verticalAlign);
    }

    // 3D transformation

    /** Creates a matrix that represents the transformation from the local coordinate system
     *  to another. This method supports three dimensional objects created via 'Sprite3D'.
     *  If you pass an <code>out</code>-matrix, the result will be stored in this matrix
     *  instead of creating a new object. */
    getTransformationMatrix3D(targetSpace, out = null) {
        const { _parent } = this;
        const { sHelperMatrix3D } = DisplayObject;
        let currentObject;

        if (out) out.identity();
        else out = new Matrix3D();

        if (targetSpace === this) {
            return out;
        } else if (targetSpace === _parent || (!targetSpace && !_parent)) {
            out.copyFrom(this.transformationMatrix3D);
            return out;
        } else if (!targetSpace || targetSpace === this.base) {
            // targetCoordinateSpace 'null' represents the target space of the base object.
            // -> move up from this to base

            currentObject = this;
            while (currentObject !== targetSpace) {
                out.concat(currentObject.transformationMatrix3D); // todo: was append
                currentObject = currentObject._parent;
            }

            return out;
        } else if (targetSpace._parent === this) { // optimization
            targetSpace.getTransformationMatrix3D(this, out);
            out.invert();

            return out;
        }

        // 1. find a common parent of this and the target space

        const commonParent = DisplayObject.findCommonParent(this, targetSpace);

        // 2. move up from this to common parent

        currentObject = this;
        while (currentObject !== commonParent) {
            out.concat(currentObject.transformationMatrix3D);
            currentObject = currentObject._parent;
        }

        if (commonParent === targetSpace)
            return out;

        // 3. now move up from target until we reach the common parent

        sHelperMatrix3D.identity();
        currentObject = targetSpace;
        while (currentObject !== commonParent) {
            sHelperMatrix3D.concat(currentObject.transformationMatrix3D);
            currentObject = currentObject._parent;
        }

        // 4. now combine the two matrices

        sHelperMatrix3D.invert();
        out.concat(sHelperMatrix3D);

        return out;
    }

    /** Transforms a 3D point from the local coordinate system to global (stage) coordinates.
     *  This is achieved by projecting the 3D point onto the (2D) view plane.
     *
     *  <p>If you pass an <code>out</code>-point, the result will be stored in this point
     *  instead of creating a new object.</p> */
    local3DToGlobal(localPoint, out = null) {
        const { sHelperMatrixAlt3D, sHelperPoint3D } = DisplayObject;
        const stage = this.stage;
        if (!stage) throw new Error('[IllegalOperationError] Object not connected to stage');

        this.getTransformationMatrix3D(stage, sHelperMatrixAlt3D);
        MatrixUtil.transformPoint3D(sHelperMatrixAlt3D, localPoint, sHelperPoint3D);
        return MathUtil.intersectLineWithXYPlane(stage.cameraPosition, sHelperPoint3D, out);
    }

    /** Transforms a point from global (stage) coordinates to the 3D local coordinate system.
     *  If you pass an <code>out</code>-vector, the result will be stored in this vector
     *  instead of creating a new object. */
    globalToLocal3D(globalPoint, out = null) {
        const { sHelperMatrixAlt3D } = DisplayObject;
        const stage = this.stage;
        if (!stage) throw new Error('[IllegalOperationError] Object not connected to stage');

        this.getTransformationMatrix3D(stage, sHelperMatrixAlt3D);
        sHelperMatrixAlt3D.invert();
        return MatrixUtil.transformCoords3D(sHelperMatrixAlt3D, globalPoint.x, globalPoint.y, 0, out);
    }

    // internal methods

    /** @private */
    setParent(value) {
        // check for a recursion
        let ancestor = value;
        while (ancestor !== this && !!ancestor)
            ancestor = ancestor._parent;

        if (ancestor === this)
            throw new Error('[ArgumentError] An object cannot be added as a child to itself or one ' +
                'of its children (or children`s children, etc.)');
        else
            this._parent = value;
    }

    /** @private */
    setIs3D(value) {
        this._is3D = value;
    }


    /** @private */
    get isMask() {
        return !!this._maskee;
    }

    // render cache

    /** Forces the object to be redrawn in the next frame.
     *  This will prevent the object to be drawn from the render cache.
     *
     *  <p>This method is called every time the object changes in any way. When creating
     *  custom mesh styles or any other custom rendering code, call this method if the object
     *  needs to be redrawn.</p>
     *
     *  <p>If the object needs to be redrawn just because it does not support the render cache,
     *  call <code>painter.excludeFromCache()</code> in the object's render method instead.
     *  That way, Starling's <code>skipUnchangedFrames</code> policy won't be disrupted.</p>
     */
    setRequiresRedraw() {
        const { _parent, _maskee, _alpha, _scaleX, _scaleY, _visible } = this;
        let parent = _parent || _maskee;
        const frameID = Starling.frameID;

        this._lastParentOrSelfChangeFrameID = frameID;

        this._hasVisibleArea = (
            _alpha !== 0.0
            && _visible
            && !_maskee
            && _scaleX !== 0.0
            && _scaleY !== 0.0
        );

        while (parent && parent._lastChildChangeFrameID !== frameID) {
            parent._lastChildChangeFrameID = frameID;
            parent = parent._parent || parent._maskee;
        }
    }

    /** Indicates if the object needs to be redrawn in the upcoming frame, i.e. if it has
     *  changed its location relative to the stage or some other aspect of its appearance
     *  since it was last rendered. */
    get requiresRedraw() {
        const frameID = Starling.frameID;
        return this._lastParentOrSelfChangeFrameID === frameID || this._lastChildChangeFrameID === frameID;
    }

    /** @private Makes sure the object is not drawn from cache in the next frame.
     *  This method is meant to be called only from <code>Painter.finishFrame()</code>,
     *  since it requires rendering to be concluded. */
    excludeFromCache() {
        let object = this;
        const max = 0xffffffff;

        while (object && object._tokenFrameID !== max) {
            object._tokenFrameID = max;
            object = object._parent;
        }
    }

    // helpers

    /** @private */
    setTransformationChanged() {
        this._transformationChanged = true;
        this.setRequiresRedraw();
    }

    /** @private */
    updateTransformationMatrices(x, y, pivotX, pivotY, scaleX, scaleY,
                                 skewX, skewY, rotation, out, out3D) {
        if (skewX === 0.0 && skewY === 0.0) {
            // optimization: no skewing / rotation simplifies the matrix math

            if (rotation === 0.0) {
                out.setTo(scaleX, 0.0, 0.0, scaleY, x - pivotX * scaleX, y - pivotY * scaleY);
            } else {
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const a = scaleX * cos;
                const b = scaleX * sin;
                const c = scaleY * -sin;
                const d = scaleY * cos;
                const tx = x - pivotX * a - pivotY * c;
                const ty = y - pivotX * b - pivotY * d;

                out.setTo(a, b, c, d, tx, ty);
            }
        } else {
            out.identity();
            out.scale(scaleX, scaleY);
            MatrixUtil.skew(out, skewX, skewY);
            out.rotate(rotation);
            out.translate(x, y);

            if (pivotX !== 0.0 || pivotY !== 0.0) {
                // prepend pivot transformation
                out.tx = x - out.a * pivotX - out.c * pivotY;
                out.ty = y - out.b * pivotX - out.d * pivotY;
            }
        }

        if (out3D) MatrixUtil.convertTo3D(out, out3D);
    }

    static findCommonParent(object1, object2) {
        const { sAncestors } = DisplayObject;
        let currentObject = object1;

        while (currentObject) {
            sAncestors[sAncestors.length] = currentObject; // avoiding 'push'
            currentObject = currentObject._parent;
        }

        currentObject = object2;
        while (currentObject && sAncestors.indexOf(currentObject) === -1)
            currentObject = currentObject._parent;

        sAncestors.length = 0;

        if (currentObject) return currentObject;

        throw new Error('[ArgumentError] Object not connected to target');
    }

    // stage event handling

    /** @private */
    dispatchEvent(event) {
        if (event.type === Event.REMOVED_FROM_STAGE && !this.stage)
            return; // special check to avoid double-dispatch of RfS-event.

        super.dispatchEvent(event);
    }

    // enter frame event optimization

    // To avoid looping through the complete display tree each frame to find out who's
    // listening to ENTER_FRAME events, we manage a list of them manually in the Stage class.
    // We need to take care that (a) it must be dispatched only when the object is
    // part of the stage, (b) it must not cause memory leaks when the user forgets to call
    // dispose and (c) there might be multiple listeners for this event.

    /** @inheritDoc */
    addEventListener(type, listener) {
        if (type === Event.ENTER_FRAME && !this.hasEventListener(type)) {
            this.addEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
            this.addEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
            if (this.stage) this.addEnterFrameListenerToStage();
        }

        super.addEventListener(type, listener);
    }

    /** @inheritDoc */
    removeEventListener(type, listener) {
        super.removeEventListener(type, listener);

        if (type === Event.ENTER_FRAME && !this.hasEventListener(type)) {
            this.removeEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
            this.removeEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
            this.removeEnterFrameListenerFromStage();
        }
    }

    /** @inheritDoc */
    removeEventListeners(type = null) {
        if ((!type || type === Event.ENTER_FRAME) && this.hasEventListener(Event.ENTER_FRAME)) {
            this.removeEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
            this.removeEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
            this.removeEnterFrameListenerFromStage();
        }

        super.removeEventListeners(type);
    }

    addEnterFrameListenerToStage() {
        Starling.current.stage.addEnterFrameListener(this);
    }

    removeEnterFrameListenerFromStage() {
        Starling.current.stage.removeEnterFrameListener(this);
    }

    // properties

    /** The transformation matrix of the object relative to its parent.
     *
     *  <p>If you assign a custom transformation matrix, Starling will try to figure out
     *  suitable values for <code>x, y, scaleX, scaleY,</code> and <code>rotation</code>.
     *  However, if the matrix was created in a different way, this might not be possible.
     *  In that case, Starling will apply the matrix, but not update the corresponding
     *  properties.</p>
     *
     *  <p>CAUTION: not a copy, but the actual object!</p> */
    get transformationMatrix() {
        const { _transformationMatrix, _skewX, _skewY, _rotation, _pivotX, _pivotY, _scaleX, _scaleY, _x, _y } = this;

        if (this._transformationChanged) {
            this._transformationChanged = false;

            if (_skewX === 0.0 && _skewY === 0.0) {
                // optimization: no skewing / rotation simplifies the matrix math

                if (_rotation === 0.0) {
                    _transformationMatrix.setTo(_scaleX, 0.0, 0.0, _scaleY, _x - _pivotX * _scaleX, _y - _pivotY * _scaleY);
                } else {
                    const cos = Math.cos(_rotation);
                    const sin = Math.sin(_rotation);
                    const a = _scaleX * cos;
                    const b = _scaleX * sin;
                    const c = _scaleY * -sin;
                    const d = _scaleY * cos;
                    const tx = _x - _pivotX * a - _pivotY * c;
                    const ty = _y - _pivotX * b - _pivotY * d;

                    _transformationMatrix.setTo(a, b, c, d, tx, ty);
                }
            } else {
                _transformationMatrix.identity();
                _transformationMatrix.scale(_scaleX, _scaleY);
                MatrixUtil.skew(_transformationMatrix, _skewX, _skewY);
                _transformationMatrix.rotate(_rotation);
                _transformationMatrix.translate(_x, _y);

                if (_pivotX !== 0.0 || _pivotY !== 0.0) {
                    // prepend pivot transformation
                    _transformationMatrix.tx = _x - _transformationMatrix.a * _pivotX
                        - _transformationMatrix.c * _pivotY;
                    _transformationMatrix.ty = _y - _transformationMatrix.b * _pivotX
                        - _transformationMatrix.d * _pivotY;
                }
            }
        }

        return _transformationMatrix;
    }

    set transformationMatrix(matrix) {
        const PI_Q = Math.PI / 4.0;

        this.setRequiresRedraw();
        this._transformationChanged = false;
        this._transformationMatrix.copyFrom(matrix);
        this._pivotX = this._pivotY = 0;

        this._x = matrix.tx;
        this._y = matrix.ty;

        this._skewX = Math.atan(-matrix.c / matrix.d);
        this._skewY = Math.atan(matrix.b / matrix.a);

        // NaN check ('isNaN' causes allocation)
        if (isNaN(this._skewX)) this._skewX = 0.0;
        if (isNaN(this._skewY)) this._skewY = 0.0;

        this._scaleY = (this._skewX > -PI_Q && this._skewX < PI_Q) ? matrix.d / Math.cos(this._skewX)
            : -matrix.c / Math.sin(this._skewX);
        this._scaleX = (this._skewY > -PI_Q && this._skewY < PI_Q) ? matrix.a / Math.cos(this._skewY)
            : matrix.b / Math.sin(this._skewY);

        if (MathUtil.isEquivalent(this._skewX, this._skewY)) {
            this._rotation = this._skewX;
            this._skewX = this._skewY = 0;
        } else {
            this._rotation = 0;
        }
    }

    /** The 3D transformation matrix of the object relative to its parent.
     *
     *  <p>For 2D objects, this property returns just a 3D version of the 2D transformation
     *  matrix. Only the 'Sprite3D' class supports real 3D transformations.</p>
     *
     *  <p>CAUTION: not a copy, but the actual object!</p> */
    get transformationMatrix3D() {
        if (!this._transformationMatrix3D)
            this._transformationMatrix3D = MatrixUtil.convertTo3D(this._transformationMatrix);

        if (this._transformationChanged) {
            this._transformationChanged = false;
            this.updateTransformationMatrices(
                this._x, this._y, this._pivotX, this._pivotY, this._scaleX, this._scaleY, this._skewX, this._skewY, this._rotation,
                this._transformationMatrix, this._transformationMatrix3D);
        }

        return this._transformationMatrix3D;
    }

    /** Indicates if this object or any of its parents is a 'Sprite3D' object. */
    get is3D() {
        return this._is3D;
    }

    /** Indicates if th e mouse cursor should transform into a hand while it's over the sprite.
     *  @default false */
    get useHandCursor() {
        return this._useHandCursor;
    }

    set useHandCursor(value) {
        if (value === this._useHandCursor) return;
        this._useHandCursor = value;

        if (this._useHandCursor)
            this.addEventListener(TouchEvent.TOUCH, this.onTouch);
        else
            this.removeEventListener(TouchEvent.TOUCH, this.onTouch);
    }

    //onTouch(event)
    //{
    //    // todo: handle touch
    //    Mouse.cursor = event.interactsWith(this) ? MouseCursor.BUTTON : MouseCursor.AUTO;
    //}

    /** The bounds of the object relative to the local coordinates of the parent. */
    get bounds() {
        return this.getBounds(this._parent);
    }

    /** The width of the object in pixels.
     *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
     *  be accurate until the object is part of the display list. */
    get width() {
        return this.getBounds(this._parent, DisplayObject.sHelperRect).width;
    }

    set width(value) {
        // this method calls 'this.scaleX' instead of changing _scaleX directly.
        // that way, subclasses reacting on size changes need to override only the scaleX method.

        let actualWidth;
        const scaleIsNaN = this._scaleX !== this._scaleX; // avoid 'isNaN' call
        const scaleIsZero = this._scaleX < 1e-8 && this._scaleX > -1e-8;

        if (scaleIsZero || scaleIsNaN) {
            this.scaleX = 1.0;
            actualWidth = this.width;
        } else actualWidth = Math.abs(this.width / this._scaleX);

        if (actualWidth) {
            this.scaleX = value / actualWidth;
        }
    }

    /** The height of the object in pixels.
     *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
     *  be accurate until the object is part of the display list. */
    get height() {
        return this.getBounds(this._parent, DisplayObject.sHelperRect).height;
    }

    set height(value) {
        let actualHeight;
        const scaleIsNaN = this._scaleY !== this._scaleY; // avoid 'isNaN' call
        const scaleIsZero = this._scaleY < 1e-8 && this._scaleY > -1e-8;

        if (scaleIsZero || scaleIsNaN) {
            this.scaleY = 1.0;
            actualHeight = this.height;
        } else actualHeight = Math.abs(this.height / this._scaleY);

        if (actualHeight) this.scaleY = value / actualHeight;
    }

    /** The x coordinate of the object relative to the local coordinates of the parent. */
    get x() {
        return this._x;
    }

    set x(value) {
        if (this._x !== value) {
            this._x = value;
            this.setTransformationChanged();
        }
    }

    /** The y coordinate of the object relative to the local coordinates of the parent. */
    get y() {
        return this._y;
    }

    set y(value) {
        if (this._y !== value) {
            this._y = value;
            this.setTransformationChanged();
        }
    }

    /** The x coordinate of the object's origin in its own coordinate space (default: 0). */
    get pivotX() {
        return this._pivotX;
    }

    set pivotX(value) {
        if (this._pivotX !== value) {
            this._pivotX = value;
            this.setTransformationChanged();
        }
    }

    /** The y coordinate of the object's origin in its own coordinate space (default: 0). */
    get pivotY() {
        return this._pivotY;
    }

    set pivotY(value) {
        if (this._pivotY !== value) {
            this._pivotY = value;
            this.setTransformationChanged();
        }
    }

    /** The horizontal scale factor. '1' means no scale, negative values flip the object.
     *  @default 1 */
    get scaleX() {
        return this._scaleX;
    }

    set scaleX(value) {
        if (this._scaleX !== value) {
            this._scaleX = value;
            this.setTransformationChanged();
        }
    }

    /** The vertical scale factor. '1' means no scale, negative values flip the object.
     *  @default 1 */
    get scaleY() {
        return this._scaleY;
    }

    set scaleY(value) {
        if (this._scaleY !== value) {
            this._scaleY = value;
            this.setTransformationChanged();
        }
    }

    /** Sets both 'scaleX' and 'scaleY' to the same value. The getter simply returns the
     *  value of 'scaleX' (even if the scaling values are different). @default 1 */
    get scale() {
        return this.scaleX;
    }

    set scale(value) {
        this.scaleX = this.scaleY = value;
    }

    /** The horizontal skew angle in radians. */
    get skewX() {
        return this._skewX;
    }

    set skewX(value) {
        value = MathUtil.normalizeAngle(value);

        if (this._skewX !== value) {
            this._skewX = value;
            this.setTransformationChanged();
        }
    }

    /** The vertical skew angle in radians. */
    get skewY() {
        return this._skewY;
    }

    set skewY(value) {
        value = MathUtil.normalizeAngle(value);

        if (this._skewY !== value) {
            this._skewY = value;
            this.setTransformationChanged();
        }
    }

    /** The rotation of the object in radians. (In Starling, all angles are measured
     *  in radians.) */
    get rotation() {
        return this._rotation;
    }

    set rotation(value) {
        value = MathUtil.normalizeAngle(value);

        if (this._rotation !== value) {
            this._rotation = value;
            this.setTransformationChanged();
        }
    }

    /** @private Indicates if the object is rotated or skewed in any way. */
    get isRotated() {
        return this._rotation !== 0.0 || this._skewX !== 0.0 || this._skewY !== 0.0;
    }

    /** The opacity of the object. 0 = transparent, 1 = opaque. @default 1 */
    get alpha() {
        return this._alpha;
    }

    set alpha(value) {
        if (value !== this._alpha) {
            this._alpha = value < 0.0 ? 0.0 : (value > 1.0 ? 1.0 : value);
            this.setRequiresRedraw();
        }
    }

    /** The visibility of the object. An invisible object will be untouchable. */
    get visible() {
        return this._visible;
    }

    set visible(value) {
        if (value !== this._visible) {
            this._visible = value;
            this.setRequiresRedraw();
        }
    }

    /** Indicates if this object (and its children) will receive touch events. */
    get touchable() {
        return this._touchable;
    }

    set touchable(value) {
        this._touchable = value;
    }

    /** The blend mode determines how the object is blended with the objects underneath.
     *   @default auto
     *   @see starling.display.BlendMode */
    get blendMode() {
        return this._blendMode;
    }

    set blendMode(value) {
        if (value !== this._blendMode) {
            this._blendMode = value;
            this.setRequiresRedraw();
        }
    }

    /** The name of the display object (default: null). Used by 'getChildByName()' of
     *  display object containers. */
    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    /** The filter that is attached to the display object. The <code>starling.filters</code>
     *  package contains several classes that define specific filters you can use. To combine
     *  several filters, assign an instance of the <code>FilterChain</code> class; to remove
     *  all filters, assign <code>null</code>.
     *
     *  <p>Beware that a filter instance may only be used on one object at a time! Furthermore,
     *  when you remove or replace a filter, it is NOT disposed automatically (since you might
     *  want to reuse it on a different object).</p>
     *
     *  @default null
     *  @see starling.filters.FragmentFilter
     *  @see starling.filters.FilterChain
     */
    get filter() {
        return this._filter;
    }

    set filter(value) {
        if (value !== this._filter) {
            if (this._filter) this._filter.setTarget(null);
            if (value) value.setTarget(this);

            this._filter = value;
            this.setRequiresRedraw();
        }
    }

    /** The display object that acts as a mask for the current object.
     *  Assign <code>null</code> to remove it.
     *
     *  <p>A pixel of the masked display object will only be drawn if it is within one of the
     *  mask's polygons. Texture pixels and alpha values of the mask are not taken into
     *  account. The mask object itself is never visible.</p>
     *
     *  <p>If the mask is part of the display list, masking will occur at exactly the
     *  location it occupies on the stage. If it is not, the mask will be placed in the local
     *  coordinate system of the target object (as if it was one of its children).</p>
     *
     *  <p>For rectangular masks, you can use simple quads; for other forms (like circles
     *  or arbitrary shapes) it is recommended to use a 'Canvas' instance.</p>
     *
     *  <p><strong>Note:</strong> a mask will typically cause at least two additional draw
     *  calls: one to draw the mask to the stencil buffer and one to erase it. However, if the
     *  mask object is an instance of <code>starling.display.Quad</code> and is aligned
     *  parallel to the stage axes, rendering will be optimized: instead of using the
     *  stencil buffer, the object will be clipped using the scissor rectangle. That's
     *  faster and reduces the number of draw calls, so make use of this when possible.</p>
     *
     *  <p><strong>Note:</strong> AIR apps require the <code>depthAndStencil</code> node
     *  in the application descriptor XMLs to be enabled! Otherwise, stencil masking won't
     *  work.</p>
     *
     *  @see Canvas
     *  @default null
     */
    get mask() {
        return this._mask;
    }

    set mask(value) {
        if (this._mask !== value) {
            if (!DisplayObject.sMaskWarningShown) {
                // todo: not sure if need this
                //if (!SystemUtil.supportsDepthAndStencil)
                //    console.log('[Starling] Full mask support requires 'depthAndStencil' to be enabled in the application descriptor.');

                DisplayObject.sMaskWarningShown = true;
            }

            if (this._mask) this._mask._maskee = null;
            if (value) {
                value._maskee = this;
                value._hasVisibleArea = false;
            }

            this._mask = value;
            this.setRequiresRedraw();
        }
    }

    /** The display object container that contains this display object. */
    get parent() {
        return this._parent;
    }

    /** The topmost object in the display tree the object is part of. */
    get base() {
        let currentObject = this;
        while (currentObject._parent) currentObject = currentObject._parent;
        return currentObject;
    }

    /** The root object the display object is connected to (i.e. an instance of the class
     *  that was passed to the Starling constructor), or null if the object is not connected
     *  to the stage. */
    get root() {
        let currentObject = this;
        while (currentObject._parent) {
            //if (currentObject._parent instanceof Stage) return currentObject;
            if (currentObject._parent.constructor.name === 'Stage') return currentObject;

            currentObject = currentObject.parent;
        }

        return null;
    }

    /** The stage the display object is connected to, or null if it is not connected
     *  to the stage. */
    get stage() {
        const base = this.base;
        return base.constructor.name === 'Stage' ? base : null;
    }
}
