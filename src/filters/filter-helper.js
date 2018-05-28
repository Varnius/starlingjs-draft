import { RGBA } from 'gl-constants';

import MathUtil from '../utils/math-util';
import Rectangle from '../math/rectangle';
import Texture from '../textures/texture';
import SubTexture from '../textures/subtexture';
import Starling from '../core/starling';
import Pool from '../utils/pool';
import Matrix3D from '../math/matrix3d';
import { createEmptyTexture } from '../utils/texture-creators';

/** @private
 *
 *  This class manages texture creation, pooling and disposal of all textures
 *  during filter processing.
 */
export default class FilterHelper {
    _width;
    _height;
    _nativeWidth;
    _nativeHeight;
    _pool;
    _usePotTextures;
    _textureFormat;
    _preferredScale;
    _scale;
    _sizeStep;
    _numPasses;
    _projectionMatrix;
    _renderTarget;
    _targetBounds;
    _target;
    _clipRect;

    // helpers
    sRegion = new Rectangle();

    /** Creates a new, empty instance. */
    constructor(textureFormat = RGBA) {
        //this._usePotTextures = Starling.current.profile == Context3DProfile.BASELINEthis._CONSTRAINED;
        this._preferredScale = Starling.contentScaleFactor;
        this._textureFormat = textureFormat;
        this._sizeStep = 64; // must be POT!
        this._pool = [];
        this._projectionMatrix = new Matrix3D();
        this._targetBounds = new Rectangle();

        this.setSize(this._sizeStep, this._sizeStep);
    }

    /** Purges the pool. */
    dispose() {
        Pool.putRectangle(this._clipRect);
        this._clipRect = null;

        this.purge();
    }

    /** Starts a new round of rendering. If <code>numPasses</code> is greater than zero, each
     *  <code>getTexture()</code> call will be counted as one pass; the final pass will then
     *  return <code>null</code> instead of a texture, to indicate that this pass should be
     *  rendered to the back buffer.
     */
    start(numPasses, drawLastPassToBackBuffer) {
        this._numPasses = drawLastPassToBackBuffer ? numPasses : -1;
    }

    /** @inheritDoc */
    getTexture(resolution = 1.0) {
        let texture;
        const { sRegion } = this;

        if (this._numPasses >= 0)
            if (this._numPasses-- === 0) return null;

        if (this._pool.length) {
            texture = this._pool.pop();
        } else {
            texture = createEmptyTexture({
                width: this._nativeWidth / this._scale,
                height: this._nativeHeight / this._scale,
                optimizeForRenderToTexture: true, // todo: implement
                scale: this._scale,
                format: this._textureFormat,
            });
        }

        if (!MathUtil.isEquivalent(texture.width, this._width, 0.1) || !MathUtil.isEquivalent(texture.height, this._height, 0.1) || !MathUtil.isEquivalent(texture.scale, this._scale * resolution)) {
            sRegion.setTo(0, 0, this._width * resolution, this._height * resolution);

            if (texture instanceof SubTexture)
                texture.setTo(texture.root, sRegion, true, null, false, resolution);
            else
                texture = new SubTexture(texture.root, sRegion, true, null, false, resolution);
        }

        texture.root.clear();
        return texture;
    }

    /** @inheritDoc */
    putTexture(texture) {
        if (texture) {
            if (texture.root.nativeWidth === this._nativeWidth && texture.root.nativeHeight === this._nativeHeight)
                this._pool.splice(this._pool.length, 0, texture);
            else
                texture.dispose();
        }
    }

    /** Purges the pool and disposes all textures. */
    purge() {
        for (let i = 0, len = this._pool.length; i < len; ++i)
            this._pool[i].dispose();

        this._pool.length = 0;
    }

    /** Updates the size of the returned textures. Small size changes may allow the
     *  existing textures to be reused; big size changes will automatically dispose
     *  them. */
    setSize(width, height) {
        let factor;
        let newScale = this._preferredScale;
        const maxNativeSize = Texture.maxSize;
        let newNativeWidth = this.getNativeSize(width, newScale);
        let newNativeHeight = this.getNativeSize(height, newScale);

        if (newNativeWidth > maxNativeSize || newNativeHeight > maxNativeSize) {
            factor = maxNativeSize / Math.max(newNativeWidth, newNativeHeight);
            newNativeWidth *= factor;
            newNativeHeight *= factor;
            newScale *= factor;
        }

        if (this._nativeWidth !== newNativeWidth || this._nativeHeight !== newNativeHeight ||
            this._scale !== newScale) {
            this.purge();

            this._scale = newScale;
            this._nativeWidth = newNativeWidth;
            this._nativeHeight = newNativeHeight;
        }

        this._width = width;
        this._height = height;
    }

    getNativeSize(size, textureScale) {
        const nativeSize = size * textureScale;

        if (this._usePotTextures)
            return nativeSize > this._sizeStep ? MathUtil.getNextPowerOfTwo(nativeSize) : this._sizeStep;
        else
            return Math.ceil(nativeSize / this._sizeStep) * this._sizeStep;
    }

    /** The projection matrix that was active when the filter started processing. */
    get projectionMatrix3D() {
        return this._projectionMatrix;
    }

    set projectionMatrix3D(value) {
        this._projectionMatrix.copyFrom(value);
    }

    /** The render target that was active when the filter started processing. */
    get renderTarget() {
        return this._renderTarget;
    }

    set renderTarget(value) {
        this._renderTarget = value;
    }

    /** The clipping rectangle that was active when the filter started processing. */
    get clipRect() {
        return this._clipRect;
    }

    set clipRect(value) {
        if (value) {
            if (this._clipRect) this._clipRect.copyFrom(value);
            else this._clipRect = Pool.getRectangle(value.x, value.y, value.width, value.height);
        } else if (this._clipRect) {
            Pool.putRectangle(this._clipRect);
            this._clipRect = null;
        }
    }

    /** @inheritDoc */
    get targetBounds() {
        return this._targetBounds;
    }

    set targetBounds(value) {
        this._targetBounds.copyFrom(value);
        this.setSize(value.width, value.height);
    }

    /** @inheritDoc */
    get target() {
        return this._target;
    }

    set target(value) {
        this._target = value;
    }

    /** The scale factor of the returned textures. */
    get textureScale() {
        return this._preferredScale;
    }

    set textureScale(value) {
        this._preferredScale = value > 0 ? value : Starling.contentScaleFactor;
    }

    /** The texture format of the returned textures. @default BGRA */
    get textureFormat() {
        return this._textureFormat;
    }

    set textureFormat(value) {
        this._textureFormat = value;
    }
}
