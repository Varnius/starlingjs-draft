import Rectangle from '../math/rectangle';
import Texture from '../textures/texture';
import Matrix from '../math/matrix';

/** A SubTexture represents a section of another texture. This is achieved solely by
 *  manipulation of texture coordinates, making the class very efficient.
 *
 *  <p><em>Note that it is OK to create subtextures of subtextures.</em></p>
 */
export default class SubTexture extends Texture {
    _parent;
    _ownsParent;
    _region;
    _frame;
    _rotated;
    _width;
    _height;
    _scale;
    _transformationMatrix;
    _transformationMatrixToRoot;

    /** Creates a new SubTexture containing the specified region of a parent texture.
     *
     *  @param parent     The texture you want to create a SubTexture from.
     *  @param region     The region of the parent texture that the SubTexture will show
     *                    (in points). If <code>null</code>, the complete area of the parent.
     *  @param ownsParent If <code>true</code>, the parent texture will be disposed
     *                    automatically when the SubTexture is disposed.
     *  @param frame      If the texture was trimmed, the frame rectangle can be used to restore
     *                    the trimmed area.
     *  @param rotated    If true, the SubTexture will show the parent region rotated by
     *                    90 degrees (CCW).
     *  @param scaleModifier  The scale factor of the SubTexture will be calculated by
     *                    multiplying the parent texture's scale factor with this value.
     */
    constructor(parent, region = null, ownsParent = false, frame = null, rotated = false, scaleModifier = 1) {
        super();
        this.setTo(parent, region, ownsParent, frame, rotated, scaleModifier);
    }

    /** @private
     *
     *  <p>Textures are supposed to be immutable, and Starling uses this assumption for
     *  optimizations and simplifications all over the place. However, in some situations where
     *  the texture is not accessible to the outside, this can be overruled in order to avoid
     *  allocations.</p>
     */
    setTo(parent, region = null, ownsParent = false, frame = null, rotated = false, scaleModifier = 1) {
        if (!this._region) this._region = new Rectangle();
        if (region) this._region.copyFrom(region);
        else this._region.setTo(0, 0, parent.width, parent.height);

        if (frame) {
            if (this._frame) this._frame.copyFrom(frame);
            else this._frame = frame.clone();
        } else this._frame = null;

        this._parent = parent;
        this._ownsParent = ownsParent;
        this._rotated = rotated;
        this._width = (rotated ? this._region.height : this._region.width) / scaleModifier;
        this._height = (rotated ? this._region.width : this._region.height) / scaleModifier;
        this._scale = this._parent.scale * scaleModifier;

        if (this._frame && (this._frame.x > 0 || this._frame.y > 0 ||
            this._frame.right < this._width || this._frame.bottom < this._height)) {
            console.warning("[Starling] Warning: frames inside the texture's region are unsupported.");
        }

        this.updateMatrices();
    }

    updateMatrices() {
        if (this._transformationMatrix) this._transformationMatrix.identity();
        else this._transformationMatrix = new Matrix();

        if (this._transformationMatrixToRoot) this._transformationMatrixToRoot.identity();
        else this._transformationMatrixToRoot = new Matrix();

        if (this._rotated) {
            this._transformationMatrix.translate(0, -1);
            this._transformationMatrix.rotate(Math.PI / 2.0);
        }

        this._transformationMatrix.scale(this._region.width / this._parent.width,
            this._region.height / this._parent.height);
        this._transformationMatrix.translate(this._region.x / this._parent.width,
            this._region.y / this._parent.height);

        let texture = this;
        while (texture) {
            this._transformationMatrixToRoot.concat(texture._transformationMatrix);
            texture = texture.parent instanceof SubTexture ? texture.parent : null;
        }
    }

    /** Disposes the parent texture if this texture owns it. */
    dispose() {
        if (this._ownsParent) this._parent.dispose();
        super.dispose();
    }

    /** The texture which the SubTexture is based on. */
    get parent() {
        return this._parent;
    }

    /** Indicates if the parent texture is disposed when this object is disposed. */
    get ownsParent() {
        return this._ownsParent;
    }

    /** If true, the SubTexture will show the parent region rotated by 90 degrees (CCW). */
    get rotated() {
        return this._rotated;
    }

    /** The region of the parent texture that the SubTexture is showing (in points).
     *
     *  <p>CAUTION: not a copy, but the actual object! Do not modify!</p> */
    get region() {
        return this._region;
    }

    /** @inheritDoc */
    get transformationMatrix() {
        return this._transformationMatrix;
    }

    /** @inheritDoc */
    get transformationMatrixToRoot() {
        return this._transformationMatrixToRoot;
    }

    /** @inheritDoc */
    get base() {
        return this._parent.base;
    }

    /** @inheritDoc */
    get root() {
        return this._parent.root;
    }

    /** @inheritDoc */
    get format() {
        return this._parent.format;
    }

    /** @inheritDoc */
    get width() {
        return this._width;
    }

    /** @inheritDoc */
    get height() {
        return this._height;
    }

    /** @inheritDoc */
    get nativeWidth() {
        return this._width * this._scale;
    }

    /** @inheritDoc */
    get nativeHeight() {
        return this._height * this._scale;
    }

    /** @inheritDoc */
    get mipMapping() {
        return this._parent.mipMapping;
    }

    /** @inheritDoc */
    get premultipliedAlpha() {
        return this._parent.premultipliedAlpha;
    }

    /** @inheritDoc */
    get scale() {
        return this._scale;
    }

    /** @inheritDoc */
    get frame() {
        return this._frame;
    }
}
