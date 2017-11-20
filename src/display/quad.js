import Mesh from './mesh';

import Vector3D from '../math/vector3d';
import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';
import Rectangle from '../math/rectangle';

import MeshStyle from '../styles/mesh-style';
import VertexData from '../rendering/vertex-data';
import IndexData from '../rendering/index-data';

import RectangleUtil from '../utils/rectangle-util';

/** A Quad represents a colored and/or textured rectangle.
 *
 *  <p>Quads may have a color and a texture. When assigning a texture, the colors of the
 *  vertices will "tint" the texture, i.e. the vertex color will be multiplied with the color
 *  of the texture at the same position. That's why the default color of a quad is pure white:
 *  tinting with white does not change the texture color (that's a multiplication with one).</p>
 *
 *  <p>A quad is, by definition, always rectangular. The basic quad class will always contain
 *  exactly four vertices, arranged like this:</p>
 *
 *  <pre>
 *  0 - 1
 *  | / |
 *  2 - 3
 *  </pre>
 *
 *  <p>You can set the color of each vertex individually; and since the colors will smoothly
 *  fade into each other over the area of the quad, you can use this to create simple linear
 *  color gradients (e.g. by assigning one color to vertices 0 and 1 and another to vertices
 *  2 and 3).</p>
 *
 *  <p>However, note that the number of vertices may be different in subclasses.
 *  Check the property <code>numVertices</code> if you are unsure.</p>
 *
 *  @see starling.textures.Texture
 *  @see Image
 */
export default class Quad extends Mesh {
    _bounds;

    // helper objects
    static sPoint3D = new Vector3D();
    static sMatrix = new Matrix();
    static sMatrix3D = new Matrix3D();

    /** Creates a quad with a certain size and color. */
    constructor(width, height, color = 0xffffff)
    {
        const vertexData = new VertexData(MeshStyle.VERTEX_FORMAT, 4);
        const indexData = new IndexData(6);

        super(vertexData, indexData);

        this._bounds = new Rectangle(0, 0, width, height);

        if (width === 0.0 || height === 0.0)
            throw new Error('[ArgumentError] Invalid size: width and height must not be zero');

        this.setupVertices();
        this.color = color;
    }

    /** Sets up vertex- and index-data according to the current settings. */
    setupVertices()
    {
        const { _bounds } = this;
        const posAttr = 'position';
        const texAttr = 'texCoords';
        const texture = this.style.texture;
        const vertexData = this.vertexData;
        const indexData = this.indexData;

        indexData.numIndices = 0;
        indexData.addQuad(0, 1, 2, 3);

        if (vertexData.numVertices !== 4)
        {
            vertexData.numVertices = 4;
        }

        if (texture)
        {
            texture.setupVertexPositions(vertexData, 0, 'position', _bounds);
            texture.setupTextureCoordinates(vertexData, 0, texAttr);
        }
        else
        {
            vertexData.setPoint(0, posAttr, _bounds.left, _bounds.top);
            vertexData.setPoint(1, posAttr, _bounds.right, _bounds.top);
            vertexData.setPoint(2, posAttr, _bounds.left, _bounds.bottom);
            vertexData.setPoint(3, posAttr, _bounds.right, _bounds.bottom);

            vertexData.setPoint(0, texAttr, 0.0, 0.0);
            vertexData.setPoint(1, texAttr, 1.0, 0.0);
            vertexData.setPoint(2, texAttr, 0.0, 1.0);
            vertexData.setPoint(3, texAttr, 1.0, 1.0);
        }

        this.setRequiresRedraw();
    }

    /** @inheritDoc */
    getBounds(targetSpace, out = null)
    {
        const { _bounds, isRotated, x, y, pivotY, pivotX } = this;
        const { sMatrix3D, sPoint3D, sMatrix } = Quad;
        if (out === null) out = new Rectangle();

        if (targetSpace === this) // optimization
        {
            out.copyFrom(_bounds);
        }
        else if (targetSpace === this.parent && !isRotated) // optimization
        {
            const scaleX = this.scaleX;
            const scaleY = this.scaleY;

            out.setTo(x - pivotX * scaleX, y - pivotY * scaleY,
                _bounds.width * scaleX, _bounds.height * scaleY);

            if (scaleX < 0)
            {
                out.width *= -1;
                out.x -= out.width;
            }
            if (scaleY < 0)
            {
                out.height *= -1;
                out.y -= out.height;
            }
        }
        else if (this.is3D && this.stage)
        {
            this.stage.getCameraPosition(targetSpace, sPoint3D);
            this.getTransformationMatrix3D(targetSpace, sMatrix3D);
            RectangleUtil.getBoundsProjected(_bounds, sMatrix3D, sPoint3D, out);
        }
        else
        {
            this.getTransformationMatrix(targetSpace, sMatrix);
            RectangleUtil.getBounds(_bounds, sMatrix, out);
        }

        return out;
    }

    /** @inheritDoc */
    hitTest(localPoint)
    {
        if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;
        else if (this._bounds.containsPoint(localPoint)) return this;
        else return null;
    }

    /** Readjusts the dimensions of the quad. Use this method without any arguments to
     *  synchronize quad and texture size after assigning a texture with a different size.
     *  You can also force a certain width and height by passing positive, non-zero
     *  values for width and height. */
    readjustSize(width = -1, height = -1)
    {
        const { texture } = this;
        if (width <= 0) width = texture ? texture.frameWidth : this._bounds.width;
        if (height <= 0) height = texture ? texture.frameHeight : this._bounds.height;

        if (width !== this._bounds.width || height !== this._bounds.height)
        {
            this._bounds.setTo(0, 0, width, height);
            this.setupVertices();
        }
    }

    /** Creates a quad from the given texture.
     *  The quad will have the same size as the texture. */
    static fromTexture(texture)
    {
        const quad = new Quad(100, 100);
        quad.texture = texture;
        quad.readjustSize();
        return quad;
    }

    /** The texture that is mapped to the quad (or <code>null</code>, if there is none).
     *  Per default, it is mapped to the complete quad, i.e. to the complete area between the
     *  top left and bottom right vertices. This can be changed with the
     *  <code>setTexCoords</code>-method.
     *
     *  <p>Note that the size of the quad will not change when you assign a texture, which
     *  means that the texture might be distorted at first. Call <code>readjustSize</code> to
     *  synchronize quad and texture size.</p>
     *
     *  <p>You could also set the texture via the <code>style.texture</code> property.
     *  That way, however, the texture frame won't be taken into account. Since only rectangular
     *  objects can make use of a texture frame, only a property on the Quad class can do that.
     *  </p>
     */
    get texture() {
        return super.texture;
    }

    set texture(value)
    {
        if (value !== this.texture)
        {
            super.texture = value;
            this.setupVertices();
        }
    }
}
