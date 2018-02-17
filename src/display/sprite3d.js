import DisplayObjectContainer from './display-object-container';
import Vector3D from '../math/vector3d';
import Matrix3D from '../math/matrix3d';
import SystemUtil from '../utils/system-util';
import MathUtil from '../utils/math-util';
import MatrixUtil from '../utils/matrix-util';
import rad2deg from '../utils/rad2deg';

/** A container that allows you to position objects in three-dimensional space.
 *
 *  <p>Starling is, at its heart, a 2D engine. However, sometimes, simple 3D effects are
 *  useful for special effects, e.g. for screen transitions or to turn playing cards
 *  realistically. This class makes it possible to create such 3D effects.</p>
 *
 *  <p><strong>Positioning objects in 3D</strong></p>
 *
 *  <p>Just like a normal sprite, you can add and remove children to this container, which
 *  allows you to group several display objects together. In addition to that, Sprite3D
 *  adds some interesting properties:</p>
 *
 *  <ul>
 *    <li>z - Moves the sprite closer to / further away from the camera.</li>
 *    <li>rotationX — Rotates the sprite around the x-axis.</li>
 *    <li>rotationY — Rotates the sprite around the y-axis.</li>
 *    <li>scaleZ - Scales the sprite along the z-axis.</li>
 *    <li>pivotZ - Moves the pivot point along the z-axis.</li>
 *  </ul>
 *
 *  <p>With the help of these properties, you can move a sprite and all its children in the
 *  3D space. By nesting several Sprite3D containers, it's even possible to construct simple
 *  volumetric objects (like a cube).</p>
 *
 *  <p>Note that Starling does not make any z-tests: visibility is solely established by the
 *  order of the children, just as with 2D objects.</p>
 *
 *  <p><strong>Setting up the camera</strong></p>
 *
 *  <p>The camera settings are found directly on the stage. Modify the 'focalLength' or
 *  'fieldOfView' properties to change the distance between stage and camera; use the
 *  'projectionOffset' to move it to a different position.</p>
 *
 *  <p><strong>Limitations</strong></p>
 *
 *  <p>On rendering, each Sprite3D requires its own draw call — except if the object does not
 *  contain any 3D transformations ('z', 'rotationX/Y' and 'pivotZ' are zero). Furthermore,
 *  it interrupts the render cache, i.e. the cache cannot contain objects within different
 *  3D coordinate systems. Flat contents within the Sprite3D will be cached, though.</p>
 *
 */
export default class Sprite3D extends DisplayObjectContainer {
    static E = 0.00001;

    _rotationX;
    _rotationY;
    _scaleZ;
    _pivotZ;
    _z;

    /** Helper objects. */
    static sHelperPoint = new Vector3D();
    static sHelperPointAlt = new Vector3D();
    static sHelperMatrix = new Matrix3D();

    /** Creates an empty Sprite3D. */
    constructor() {
        super();

        this._scaleZ = 1.0;
        this._rotationX = this._rotationY = this._pivotZ = this._z = 0.0;
        this.setIs3D(true);

        addEventListener(Event.ADDED, this.onAddedChild);
        addEventListener(Event.REMOVED, this.onRemovedChild);
    }

    /** @inheritDoc */
    render(painter) {
        if (this.isFlat) super.render(painter);
        else {
            painter.finishMeshBatch();
            painter.pushState();
            painter.state.transformModelviewMatrix3D(this.transformationMatrix3D);

            super.render(painter);

            painter.finishMeshBatch();
            painter.excludeFromCache(this);
            painter.popState();
        }
    }

    /** @inheritDoc */
    hitTest(localPoint) {
        const { sHelperPoint, sHelperPointAlt, sHelperMatrix } = Sprite3D;
        if (this.isFlat) return super.hitTest(localPoint);
        else {
            if (!this.visible || !this.touchable) return null;

            // We calculate the interception point between the 3D plane that is spawned up
            // by this sprite3D and the straight line between the camera and the hit point.

            sHelperMatrix.copyFrom(this.transformationMatrix3D);
            sHelperMatrix.invert();

            this.stage.getCameraPosition(this, sHelperPoint);
            MatrixUtil.transformCoords3D(sHelperMatrix, localPoint.x, localPoint.y, 0, sHelperPointAlt);
            MathUtil.intersectLineWithXYPlane(sHelperPoint, sHelperPointAlt, localPoint);

            return super.hitTest(localPoint);
        }
    }

    // helpers

    onAddedChild(event) {
        this.recursivelySetIs3D(event.target, true);
    }

    onRemovedChild(event) {
        this.recursivelySetIs3D(event.target, false);
    }

    recursivelySetIs3D(object, value) {
        if (object instanceof Sprite3D)
            return;

        if (SystemUtil.isBaseClass(this.constructor, 'DisplayObjectContainer')) {
            const container = object;
            const numChildren = container.numChildren;

            for (let i = 0; i < numChildren; ++i)
                this.recursivelySetIs3D(container.getChildAt(i), value);
        }

        object.setIs3D(value);
    }

    updateTransformationMatrices(x, y, pivotX, pivotY, scaleX, scaleY,
                                 skewX, skewY, rotation, out, out3D) {
        if (this.isFlat) super.updateTransformationMatrices(
            x, y, pivotX, pivotY, scaleX, scaleY, skewX, skewY, rotation, out, out3D);
        else this.updateTransformationMatrices3D(
            x, y, this._z, pivotX, pivotY, this._pivotZ, scaleX, scaleY, this._scaleZ,
            this._rotationX, this._rotationY, rotation, out, out3D);
    }

    updateTransformationMatrices3D(x, y, z,
                                   pivotX, pivotY, pivotZ,
                                   scaleX, scaleY, scaleZ,
                                   rotationX, rotationY, rotationZ,
                                   out, out3D) {
        out.identity();
        out3D.identity();

        const E = Sprite3D.E;

        if (scaleX !== 1.0 || scaleY !== 1.0 || scaleZ !== 1.0)
            out3D.scale(scaleX || E, scaleY || E, scaleZ || E);
        if (rotationX !== 0.0)
            out3D.rotateX(rotationX);
        if (rotationY !== 0.0)
            out3D.rotateY(rotationY);
        if (rotationZ !== 0.0)
            out3D.rotateZ(rotationZ);
        if (x !== 0.0 || y !== 0.0 || z !== 0.0)
            out3D.appendTranslation(x, y, z);
        if (pivotX !== 0.0 || pivotY !== 0.0 || pivotZ !== 0.0)
            out3D.prependTranslation(-pivotX, -pivotY, -pivotZ);
    }

    // properties

    get transformationMatrix() {
        return super.transformationMatrix;
    }

    set transformationMatrix(value) {
        super.transformationMatrix = value;
        this._rotationX = this._rotationY = this._pivotZ = this._z = 0;
        this.setTransformationChanged();
    }

    /** The z coordinate of the object relative to the local coordinates of the parent.
     *  The z-axis points away from the camera, i.e. positive z-values will move the object further
     *  away from the viewer. */
    get z() {
        return this._z;
    }

    set z(value) {
        this._z = value;
        this.setTransformationChanged();
    }

    /** The z coordinate of the object's origin in its own coordinate space (default: 0). */
    get pivotZ() {
        return this._pivotZ;
    }

    set pivotZ(value) {
        this._pivotZ = value;
        this.setTransformationChanged();
    }

    /** The depth scale factor. '1' means no scale, negative values flip the object. */
    get scaleZ() {
        return this._scaleZ;
    }

    set scaleZ(value) {
        this._scaleZ = value;
        this.setTransformationChanged();
    }

    /** @private */
    get scale() {
        return super.scale;
    }

    set scale(value) {
        this.scaleX = this.scaleY = this.scaleZ = value;
    }

    /** @private */
    set skewX(value) {
        throw new Error('3D objects do not support skewing');

        // super.skewX = value;
        // _orientationChanged = true;
    }

    /** @private */
    set skewY(value) {
        throw new Error('3D objects do not support skewing');

        // super.skewY = value;
        // _orientationChanged = true;
    }

    /** The rotation of the object about the x axis, in radians.
     *  (In Starling, all angles are measured in radians.) */
    get rotationX() {
        return this._rotationX;
    }

    set rotationX(value) {
        this._rotationX = MathUtil.normalizeAngle(value);
        this.setTransformationChanged();
    }

    /** The rotation of the object about the y axis, in radians.
     *  (In Starling, all angles are measured in radians.) */
    get rotationY() {
        return this._rotationY;
    }

    set rotationY(value) {
        this._rotationY = MathUtil.normalizeAngle(value);
        this.setTransformationChanged();
    }

    /** The rotation of the object about the z axis, in radians.
     *  (In Starling, all angles are measured in radians.) */
    get rotationZ() {
        return this.rotation;
    }

    set rotationZ(value) {
        this.rotation = value;
    }

    /** If <code>true</code>, this 3D object contains only 2D content.
     *  This means that rendering will be just as efficient as for a standard 2D object. */
    get isFlat() {
        const E = Sprite3D.E;
        return this._z > -E && this._z < E &&
            this._rotationX > -E && this._rotationX < E &&
            this._rotationY > -E && this._rotationY < E &&
            this._pivotZ > -E && this._pivotZ < E;
    }
}
