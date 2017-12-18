import { STATIC_DRAW } from 'gl-constants';

import Point from '../math/point';
import Rectangle from '../math/rectangle';
import Vector3D from '../math/vector3d';
import VertexDataFormat from './vertex-data-format';
import MatrixUtil from '../utils/matrix-util';
import MathUtil from '../utils/math-util';
import Color, { premultiplyAlpha, unmultiplyAlpha } from '../utils/color';
import MeshStyle from '../styles/mesh-style';
import Starling from '../core/starling';

/** The VertexData class manages a raw list of vertex information, allowing direct upload
 *  to Stage3D vertex buffers. <em>You only have to work with this class if you're writing
 *  your own rendering code (e.g. if you create custom display objects).</em>
 *
 *  <p>To render objects with Stage3D, you have to organize vertices and indices in so-called
 *  vertex- and index-buffers. Vertex buffers store the coordinates of the vertices that make
 *  up an object; index buffers reference those vertices to determine which vertices spawn
 *  up triangles. Those buffers reside in graphics memory and can be accessed very
 *  efficiently by the GPU.</p>
 *
 *  <p>Before you can move data into the buffers, you have to set it up in conventional
 *  memory — that is, in a Vector or a ByteArray. Since it's quite cumbersome to manually
 *  create and manipulate those data structures, the IndexData and VertexData classes provide
 *  a simple way to do just that. The data is stored sequentially (one vertex or index after
 *  the other) so that it can easily be uploaded to a buffer.</p>
 *
 *  <strong>Vertex Format</strong>
 *
 *  <p>The VertexData class requires a custom format string on initialization, or an instance
 *  of the VertexDataFormat class. Here is an example:</p>
 *
 *  <listing>
 *  vertexData = new VertexData("position:float2, color:bytes4");
 *  vertexData.setPoint(0, "position", 320, 480);
 *  vertexData.setColor(0, "color", 0xff00ff);</listing>
 *
 *  <p>This instance is set up with two attributes: "position" and "color". The keywords
 *  after the colons depict the format and size of the data that each property uses; in this
 *  case, we store two floats for the position (for the x- and y-coordinates) and four
 *  bytes for the color. Please refer to the VertexDataFormat documentation for details.</p>
 *
 *  <p>The attribute names are then used to read and write data to the respective positions
 *  inside a vertex. Furthermore, they come in handy when copying data from one VertexData
 *  instance to another: attributes with equal name and data format may be transferred between
 *  different VertexData objects, even when they contain different sets of attributes or have
 *  a different layout.</p>
 *
 *  <strong>Colors</strong>
 *
 *  <p>Always use the format <code>bytes4</code> for color data. The color access methods
 *  expect that format, since it's the most efficient way to store color data. Furthermore,
 *  you should always include the string "color" (or "Color") in the name of color data;
 *  that way, it will be recognized as such and will always have its value pre-filled with
 *  pure white at full opacity.</p>
 *
 *  <strong>Premultiplied Alpha</strong>
 *
 *  <p>Per default, color values are stored with premultiplied alpha values, which
 *  means that the <code>rgb</code> values were multiplied with the <code>alpha</code> values
 *  before saving them. You can change this behavior with the <code>premultipliedAlpha</code>
 *  property.</p>
 *
 *  <p>Beware: with premultiplied alpha, the alpha value always affects the resolution of
 *  the RGB channels. A small alpha value results in a lower accuracy of the other channels,
 *  and if the alpha value reaches zero, the color information is lost altogether.</p>
 *
 *  <strong>Tinting</strong>
 *
 *  <p>Some low-end hardware is very sensitive when it comes to fragment shader complexity.
 *  Thus, Starling optimizes shaders for non-tinted meshes. The VertexData class keeps track
 *  of its <code>tinted</code>-state, at least at a basic level: whenever you change color
 *  or alpha value of a vertex to something different than white (<code>0xffffff</code>) with
 *  full alpha (<code>1.0</code>), the <code>tinted</code> property is enabled.</p>
 *
 *  <p>However, that value is not entirely accurate: when you restore the color of just a
 *  range of vertices, or copy just a subset of vertices to another instance, the property
 *  might wrongfully indicate a tinted mesh. If that's the case, you can either call
 *  <code>updateTinted()</code> or assign a custom value to the <code>tinted</code>-property.
 *  </p>
 *
 *  @see VertexDataFormat
 *  @see IndexData
 */
export default class VertexData {
    _rawData = {};
    _numVertices = 0;
    _format;
    _attributes;
    _numAttributes;
    _premultipliedAlpha;
    _tinted;

    _vertexSize; // in bytes

    // helper objects
    static sHelperPoint = new Point();
    static sHelperPoint3D = new Vector3D();

    /** Creates an empty VertexData object with the given format and initial capacity.
     *
     *  @param format
     *
     *  Either a VertexDataFormat instance or a String that describes the data format.
     *  Refer to the VertexDataFormat class for more information. If you don't pass a format,
     *  the default <code>MeshStyle.VERTEX_FORMAT</code> will be used.
     *
     *  @param initialCapacity
     *
     *  The initial capacity affects just the way the internal ByteArray is allocated, not the
     *  <code>numIndices</code> value, which will always be zero when the constructor returns.
     *  The reason for this behavior is the peculiar way in which ByteArrays organize their
     *  memory:
     *
     *  <p>The first time you set the length of a ByteArray, it will adhere to that:
     *  a ByteArray with length 20 will take up 20 bytes (plus some overhead). When you change
     *  it to a smaller length, it will stick to the original value, e.g. with a length of 10
     *  it will still take up 20 bytes. However, now comes the weird part: change it to
     *  anything above the original length, and it will allocate 4096 bytes!</p>
     *
     *  <p>Thus, be sure to always make a generous educated guess, depending on the planned
     *  usage of your VertexData instances.</p>
     */
    constructor(format = null, initialCapacity = 4)
    {
        if (!format) this._format = MeshStyle.VERTEX_FORMAT;
        else if (format instanceof VertexDataFormat) this._format = format;
        else if (typeof (format) === 'string' || format instanceof String) this._format = VertexDataFormat.fromString(format);
        else throw new Error('[ArgumentError] \'format\' must be String or VertexDataFormat');

        this._attributes = this._format.attributes;
        this._numAttributes = this._attributes.length;
        this._vertexSize = this._format.vertexSize;

        // Initialize buffers
        this._format.attributes.forEach(attribute =>
        {
            const bufferType = VertexData.getBufferTypeForAttribute(attribute);
            this._rawData[attribute.name] = new bufferType(initialCapacity * attribute.size);

            if (attribute.name === 'color') this._rawData[attribute.name].fill(0xffffff);
            if (attribute.name === 'alpha') this._rawData[attribute.name].fill(0.0);
        });

        this.numVertices = 0;
    }

    /** Explicitly frees up the memory used by the ByteArray. */
    //clear()
    //{
    //    this._rawData.clear(); // todo:
    //    this._numVertices = 0;
    //    this._tinted = false;
    //}

    /** Creates a duplicate of the vertex data object. */
    clone()
    {
        const { _numVertices, _premultipliedAlpha } = this;
        const clone = new VertexData(this._format, _numVertices);

        const newData = {};

        this._attributes
            .forEach(attribute =>
            {
                if (attribute)
                    newData[attribute.name] = this._rawData[attribute.name].slice();
            });

        clone._rawData = newData;
        clone._numVertices = _numVertices;
        clone._premultipliedAlpha = _premultipliedAlpha;
        clone._tinted = this._tinted;

        return clone;
    }

    /** Copies the vertex data (or a range of it, defined by 'vertexID' and 'numVertices')
     *  of this instance to another vertex data object, starting at a certain target index.
     *  If the target is not big enough, it will be resized to fit all the new vertices.
     *
     *  <p>If you pass a non-null matrix, the 2D position of each vertex will be transformed
     *  by that matrix before storing it in the target object. (The position being either an
     *  attribute with the name "position" or, if such an attribute is not found, the first
     *  attribute of each vertex. It must consist of two float values containing the x- and
     *  y-coordinates of the vertex.)</p>
     *
     *  <p>Source and target do not need to have the exact same format. Only properties that
     *  exist in the target will be copied; others will be ignored. If a property with the
     *  same name but a different format exists in the target, an exception will be raised.
     *  Beware, though, that the copy-operation becomes much more expensive when the formats
     *  differ.</p>
     */
    copyTo(target, targetVertexID = 0, matrix = null, vertexID = 0, numVertices = -1)
    {
        const { _numVertices, _tinted, _rawData, _attributes } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (target._numVertices < targetVertexID + numVertices)
            target.numVertices = targetVertexID + numVertices;

        target._tinted = target._tinted || _tinted;

        const targetRawData = target._rawData;

        for (let i = 0; i < target.format.attributes.length; ++i)
        {
            const attribute = target.format.attributes[i];

            if (!_attributes.find(a => a.name === attribute.name)) continue;

            for (let j = targetVertexID * attribute.size; j < (targetVertexID + numVertices) * attribute.size; ++j)
            {
                let value = _rawData[attribute.name][j - (targetVertexID * attribute.size)];

                if (matrix && (attribute.name === 'position' || i === 0))
                {
                    const isX = j % 2 === 0;
                    const x = isX ? value : _rawData[attribute.name][j - (targetVertexID * attribute.size) - 1];
                    const y = isX ? _rawData[attribute.name][j - (targetVertexID * attribute.size) + 1] : value;

                    value = isX ? matrix.a * x + matrix.c * y + matrix.tx : matrix.d * y + matrix.b * x + matrix.ty;
                }

                targetRawData[attribute.name][j] = value;
            }
        }
    }

    /** Returns a string representation of the VertexData object,
     *  describing both its format and size. */
    toString()
    {
        return `[VertexData format="${this._format.formatString} numVertices=${this._numVertices}]`;
    }

    /** Reads a float value from the specified vertex and attribute. */
    getFloat(vertexID, attrName)
    {
        return this._rawData[attrName][vertexID];
    }

    /** Writes a float value to the specified vertex and attribute. */
    setFloat(vertexID, attrName, value)
    {
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        this._rawData[attrName][vertexID] = value;
    }

    /** Reads a Point from the specified vertex and attribute. */
    getPoint(vertexID, attrName, out = null)
    {
        if (!out) out = new Point();

        const attrSize = this.getAttribute(attrName).size;
        out.x = this._rawData[attrName][vertexID * attrSize];
        out.y = this._rawData[attrName][vertexID * attrSize + 1];

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint(vertexID, attrName, x, y)
    {
        if (this._numVertices < vertexID + 1) this.numVertices = vertexID + 1;

        const attrSize = this.getAttribute(attrName).size;

        this._rawData[attrName][vertexID * attrSize] = x;
        this._rawData[attrName][vertexID * attrSize + 1] = y;
    }

    /** Reads a Vector3D from the specified vertex and attribute.
     *  The 'w' property of the Vector3D is ignored. */
    getPoint3D(vertexID, attrName, out = null)
    {
        if (!out) out = new Vector3D();

        const attrSize = this.getAttribute(attrName).size;
        out.x = this._rawData[attrName][vertexID * attrSize];
        out.y = this._rawData[attrName][vertexID * attrSize + 1];
        out.z = this._rawData[attrName][vertexID * attrSize + 2];

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint3D(vertexID, attrName, x, y, z)
    {
        if (this._numVertices < vertexID + 1) this.numVertices = vertexID + 1;

        const attrSize = this.getAttribute(attrName).size;

        this._rawData[attrName][vertexID * attrSize] = x;
        this._rawData[attrName][vertexID * attrSize + 1] = y;
        this._rawData[attrName][vertexID * attrSize + 2] = z;
    }

    /** Reads a Vector3D from the specified vertex and attribute, including the fourth
     *  coordinate ('w'). */
    getPoint4D(vertexID, attrName, out = null)
    {
        if (!out) out = new Vector3D();

        const attrSize = this.getAttribute(attrName).size;
        out.x = this._rawData[attrName][vertexID * attrSize];
        out.y = this._rawData[attrName][vertexID * attrSize + 1];
        out.z = this._rawData[attrName][vertexID * attrSize + 2];
        out.w = this._rawData[attrName][vertexID * attrSize + 3];

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint4D(vertexID, attrName, x, y, z, w = 1.0)
    {
        if (this._numVertices < vertexID + 1) this.numVertices = vertexID + 1;

        const attrSize = this.getAttribute(attrName).size;

        this._rawData[attrName][vertexID * attrSize] = x;
        this._rawData[attrName][vertexID * attrSize + 1] = y;
        this._rawData[attrName][vertexID * attrSize + 2] = z;
        this._rawData[attrName][vertexID * attrSize + 3] = w;
    }

    /** Reads an RGB color from the specified vertex and attribute (no alpha). */
    getColor(vertexID, attrName = 'color')
    {
        if (vertexID < 0 || vertexID >= this._numVertices) throw new RangeError('[RangeError] Out of bounds');

        let rgba = this._rawData[attrName][vertexID];
        if (this._premultipliedAlpha) rgba = unmultiplyAlpha(rgba);
        return (rgba >> 8) & 0xffffff;
    }

    /** Writes the RGB color to the specified vertex and attribute (alpha is not changed). */
    setColor(vertexID, attrName, color)
    {
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        const alpha = this.getAlpha(vertexID, attrName);
        this.colorize(attrName, color, alpha, vertexID, 1);
    }

    /** Reads the alpha value from the specified vertex and attribute. */
    getAlpha(vertexID, attrName = 'color')
    {
        const rgba = this._rawData[attrName][vertexID];
        return (rgba & 0xff) / 255.0;
    }

    /** Writes the given alpha value to the specified vertex and attribute (range 0-1). */
    setAlpha(vertexID, attrName, alpha)
    {
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        const color = this.getColor(vertexID, attrName);
        this.colorize(attrName, color, alpha, vertexID, 1);
    }

    // bounds helpers

    /** Calculates the bounds of the 2D vertex positions identified by the given name.
     *  The positions may optionally be transformed by a matrix before calculating the bounds.
     *  If you pass an 'out' Rectangle, the result will be stored in this rectangle
     *  instead of creating a new object. To use all vertices for the calculation, set
     *  'numVertices' to '-1'. */
    getBounds(attrName = 'position', matrix = null, vertexID = 0, numVertices = -1, out = null)
    {
        const { _numVertices, _rawData } = this;
        const { sHelperPoint } = VertexData;

        if (!out) out = new Rectangle();
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (numVertices === 0)
        {
            if (!matrix)
                out.setEmpty();
            else
            {
                MatrixUtil.transformCoords(matrix, 0, 0, sHelperPoint);
                out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
            }
        }
        else
        {
            let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
            const attribute = this.getAttribute(attrName);
            let x, y, i;

            if (!matrix)
            {
                for (i = 0; i < numVertices; ++i)
                {
                    x = _rawData[attribute.name][i * attribute.size];
                    y = _rawData[attribute.name][i * attribute.size + 1];

                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                }
            }
            else
            {
                for (i = 0; i < numVertices; ++i)
                {
                    x = _rawData[attribute.name][i * attribute.size];
                    y = _rawData[attribute.name][i * attribute.size + 1];

                    MatrixUtil.transformCoords(matrix, x, y, sHelperPoint);

                    if (minX > sHelperPoint.x) minX = sHelperPoint.x;
                    if (maxX < sHelperPoint.x) maxX = sHelperPoint.x;
                    if (minY > sHelperPoint.y) minY = sHelperPoint.y;
                    if (maxY < sHelperPoint.y) maxY = sHelperPoint.y;
                }
            }

            out.setTo(minX, minY, maxX - minX, maxY - minY);
        }

        return out;
    }

    /** Calculates the bounds of the 2D vertex positions identified by the given name,
     *  projected into the XY-plane of a certain 3D space as they appear from the given
     *  camera position. Note that 'camPos' is expected in the target coordinate system
     *  (the same that the XY-plane lies in).
     *
     *  <p>If you pass an 'out' Rectangle, the result will be stored in this rectangle
     *  instead of creating a new object. To use all vertices for the calculation, set
     *  'numVertices' to '-1'.</p> */
    getBoundsProjected(attrName, matrix, camPos, vertexID = 0, numVertices = -1, out = null)
    {
        const { _numVertices, _rawData } = this;
        const { sHelperPoint, sHelperPoint3D } = VertexData;

        if (!out) out = new Rectangle();
        if (!camPos) throw new Error('[ArgumentError] camPos must not be null');
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (numVertices === 0)
        {
            if (matrix)
                MatrixUtil.transformCoords3D(matrix, 0, 0, 0, sHelperPoint3D);
            else
                sHelperPoint3D.setTo(0, 0, 0);

            MathUtil.intersectLineWithXYPlane(camPos, sHelperPoint3D, sHelperPoint);
            out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
        }
        else
        {
            let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
            const attributeSize = this.getAttribute(attrName).size;
            let x, y, i;

            for (i = 0; i < numVertices; ++i)
            {
                x = _rawData[attrName][i * attributeSize];
                y = _rawData[attrName][i * attributeSize + 1];

                if (matrix)
                    MatrixUtil.transformCoords3D(matrix, x, y, 0, sHelperPoint3D);
                else
                    sHelperPoint3D.setTo(x, y, 0);

                MathUtil.intersectLineWithXYPlane(camPos, sHelperPoint3D, sHelperPoint);

                if (minX > sHelperPoint.x) minX = sHelperPoint.x;
                if (maxX < sHelperPoint.x) maxX = sHelperPoint.x;
                if (minY > sHelperPoint.y) minY = sHelperPoint.y;
                if (maxY < sHelperPoint.y) maxY = sHelperPoint.y;
            }

            out.setTo(minX, minY, maxX - minX, maxY - minY);
        }

        return out;
    }

    /** Indicates if color attributes should be stored premultiplied with the alpha value.
     *  Changing this value does <strong>not</strong> modify any existing color data.
     *  If you want that, use the <code>setPremultipliedAlpha</code> method instead.
     *  @default true */
    get premultipliedAlpha()
    {
        return this._premultipliedAlpha;
    }

    set premultipliedAlpha(value)
    {
        this.setPremultipliedAlpha(value, false);
    }

    /** Changes the way alpha and color values are stored. Optionally updates all existing
     *  vertices. */
    setPremultipliedAlpha(value, updateData)
    {
        const { _attributes, _numAttributes, _numVertices, _rawData, _premultipliedAlpha } = this;

        if (updateData && value !== _premultipliedAlpha)
        {
            for (let i = 0; i < _numAttributes; ++i)
            {
                const attribute = _attributes[i];
                if (attribute.isColor)
                {
                    let oldColor;
                    let newColor;

                    for (let j = 0; j < _numVertices; ++j)
                    {
                        oldColor = _rawData[attribute.name][j];
                        newColor = value ? premultiplyAlpha(oldColor) : unmultiplyAlpha(oldColor);
                        _rawData[attribute.name][j] = newColor;
                    }
                }
            }
        }

        this._premultipliedAlpha = value;
    }

    /** Updates the <code>tinted</code> property from the actual color data. This might make
     *  sense after copying part of a tinted VertexData instance to another, since not each
     *  color value is checked in the process. An instance is tinted if any vertices have a
     *  non-white color or are not fully opaque. */
    updateTinted(attrName = 'color')
    {
        const { _rawData, _numVertices } = this;

        this._tinted = false;

        for (let i = 0; i < _numVertices; ++i)
        {
            if (_rawData[attrName][i] !== 0xffffffff)
            {
                this._tinted = true;
                break;
            }
        }

        return this._tinted;
    }

    // modify multiple attributes

    /** Transforms the 2D positions of subsequent vertices by multiplication with a
     *  transformation matrix. */
    transformPoints(attrName, matrix, vertexID = 0, numVertices = -1)
    {
        const { _numVertices, _vertexSize, _rawData } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        let x, y;
        const attribute = this.getAttribute(attrName);
        let pos = vertexID * attribute.size;
        const endPos = pos + numVertices * attribute.size;

        while (pos < endPos)
        {
            x = _rawData[attribute.name][pos];
            y = _rawData[attribute.name][pos + 1];
            _rawData[attribute.name][pos] = matrix.a * x + matrix.c * y + matrix.tx;
            _rawData[attribute.name][pos + 1] = matrix.d * y + matrix.b * x + matrix.ty;

            pos += _vertexSize;
        }
    }

    /** Translates the 2D positions of subsequent vertices by a certain offset. */
    translatePoints(attrName, deltaX, deltaY, vertexID = 0, numVertices = -1)
    {
        const { _numVertices, _rawData } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        const attributeSize = this.getAttribute(attrName).size;
        let pos = vertexID;
        const endPos = pos + numVertices * attributeSize;

        while (pos < endPos)
        {
            _rawData[attrName][pos] += deltaX;
            _rawData[attrName][pos + 1] += deltaY;

            pos += attributeSize;
        }
    }

    /** Multiplies the alpha values of subsequent vertices by a certain factor. */
    scaleAlphas(attrName, factor, vertexID = 0, numVertices = -1)
    {
        const { _numVertices, _rawData, _premultipliedAlpha } = this;

        if (factor === 1.0) return;
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        this._tinted = true; // factor must be != 1, so there's definitely tinting.

        let i;
        let alpha, rgba;

        for (i = 0; i < numVertices; ++i)
        {
            alpha = Color.getAlphaRgba(_rawData[attrName][i]) / 255.0 * factor;

            if (alpha > 1.0) alpha = 1.0;
            else if (alpha < 0.0) alpha = 0.0;

            if (alpha === 1.0 || !_premultipliedAlpha)
            {
                _rawData[attrName][i] = Color.setAlphaRgba(_rawData[attrName][i], alpha * 255);
            }
            else
            {
                rgba = unmultiplyAlpha(_rawData[attrName][i]);
                rgba = Color.setAlphaRgba(rgba, alpha * 255);
                rgba = premultiplyAlpha(rgba);
                _rawData[attrName][i] = rgba;
            }
        }
    }

    /** Writes the given RGB and alpha values to the specified vertices. */
    colorize(attrName = 'color', color = 0xffffff, alpha = 1.0, vertexID = 0, numVertices = -1)
    {
        const { _numVertices, _rawData, _premultipliedAlpha } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        let pos = vertexID;
        const endPos = pos + numVertices;

        if (alpha > 1.0) alpha = 1.0;
        else if (alpha < 0.0) alpha = 0.0;

        let rgba = ((color << 8) & 0xffffff00) | (~~(alpha * 255.0) & 0xff);
        rgba >>>= 0; // to unsigned
        if (rgba === 0xffffffff && numVertices === this._numVertices) this._tinted = false;
        else if (rgba !== 0xffffffff) this._tinted = true;

        if (_premultipliedAlpha && alpha !== 1.0) rgba = premultiplyAlpha(rgba);

        while (pos < endPos)
        {
            _rawData[attrName][pos] = rgba;
            pos++;
        }
    }

    // format helpers

    /** Returns the format of a certain vertex attribute, identified by its name.
     * Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
    getFormat(attrName)
    {
        return this.getAttribute(attrName).format;
    }

    /** Indicates if the VertexData instances contains an attribute with the specified name. */
    hasAttribute(attrName)
    {
        return !!this.getAttribute(attrName);
    }

    // VertexBuffer helpers

    /** Creates a vertex buffer object with the right size to fit the complete data.
     *  Optionally, the current data is uploaded right away. */
    uploadToVertexBuffer(bufferUsage = STATIC_DRAW)
    {
        if (this._numVertices === 0) return;
        const gl = Starling.context;
        if (!gl) throw new Error('[MissingContextError]');
        const { _numAttributes, _rawData, _attributes } = this;

        for (let attributeIndex = 0; attributeIndex < _numAttributes; ++attributeIndex)
        {
            const attribute = _attributes[attributeIndex];
            const buffer = gl.createBuffer();

            console.log(`SET attrib ${attribute.name} at index=${attributeIndex}, size ${attribute.size}`, _rawData[attribute.name]);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, _rawData[attribute.name], bufferUsage);
            gl.enableVertexAttribArray(attributeIndex);

            if (attribute.isColor)
                gl.vertexAttribPointer(attributeIndex, 4, gl.UNSIGNED_BYTE, true, 4, 0);
            else
                gl.vertexAttribPointer(attributeIndex, attribute.size, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    getAttribute(attrName)
    {
        let i, attribute;

        for (i = 0; i < this._numAttributes; ++i)
        {
            attribute = this._attributes[i];
            if (attribute.name === attrName) return attribute;
        }

        return null;
    }

    // properties

    /** The total number of vertices. If you make the object bigger, it will be filled up with
     *  <code>1.0</code> for all alpha values and zero for everything else. */
    get numVertices()
    {
        return this._numVertices;
    }

    set numVertices(newLength)
    {
        const { _numAttributes, _attributes, _rawData } = this;

        if (newLength > this._numVertices)
        {
            for (let i = 0; i < _numAttributes; ++i)
            {
                const attribute = _attributes[i];
                const bufferType = VertexData.getBufferTypeForAttribute(attribute);

                if (!_rawData[attribute.name])
                {
                    _rawData[attribute.name] = new bufferType(newLength * attribute.size);
                }

                if (_rawData[attribute.name] && _rawData[attribute.name].length > (newLength * attribute.size))
                {
                    _rawData[attribute.name] = _rawData[attribute.name].slice(0, newLength * attribute.size);
                }

                if (_rawData[attribute.name] && _rawData[attribute.name].length < (newLength * attribute.size))
                {
                    const oldData = _rawData[attribute.name];
                    _rawData[attribute.name] = new bufferType(newLength * attribute.size);

                    for (let j = 0; j < this._numVertices * attribute.size; ++j)
                    {
                        _rawData[attribute.name][j] = oldData[j];
                    }
                }

                if (attribute.isColor) // initialize color values with "white" and full alpha
                {
                    for (let j = this._numVertices; j < newLength; ++j)
                    {
                        _rawData[attribute.name][j] = 0xffffffff;
                    }
                }
            }
        }

        if (newLength === 0) this._tinted = false;
        this._numVertices = newLength;
    }

    /** The raw vertex data; not a copy! */
    get rawData()
    {
        return this._rawData;
    }

    /** The format that describes the attributes of each vertex.
     *  When you assign a different format, the raw data will be converted accordingly,
     *  i.e. attributes with the same name will still point to the same data.
     *  New properties will be filled up with zeros (except for colors, which will be
     *  initialized with an alpha value of 1.0). As a side-effect, the instance will also
     *  be trimmed. */
    get format()
    {
        return this._format;
    }

    set format(value)
    {
        const { _numVertices } = this;
        if (this._format === value) return;

        let a, i;
        const newRawData = {};
        const numAttributes = value.numAttributes;

        // todo: could reuse old buffers if they are big enough
        for (a = 0; a < numAttributes; ++a)
        {
            const tgtAttr = value.attributes[a];
            const srcAttr = this.getAttribute(tgtAttr.name);
            const bufferType = VertexData.getBufferTypeForAttribute(tgtAttr);
            const bufferSize = _numVertices * tgtAttr.size;

            if (srcAttr) // copy attributes that exist in both targets
            {
                const oldData = this._rawData[srcAttr.name];
                const newData = new bufferType(bufferSize);

                for (i = 0; i < _numVertices; ++i)
                {
                    for (let j = 0; j < tgtAttr.size; ++j)
                    {
                        newData[i * tgtAttr.size + j] = oldData[i * tgtAttr.size + j];
                    }
                }

                newRawData[srcAttr.name] = newData;
            }
            else
            {
                newRawData[tgtAttr.name] = new bufferType(bufferSize);

                if (tgtAttr.isColor) // initialize color values with "white" and full alpha
                {
                    newRawData[tgtAttr.name].fill(0xffffffff);
                }
            }
        }

        this._rawData = newRawData;
        this._format = value;
        this._attributes = this._format.attributes;
        this._numAttributes = this._attributes.length;
    }

    /** Indicates if the mesh contains any vertices that are not white or not fully opaque.
     *  If <code>false</code> (and the value wasn't modified manually), the result is 100%
     *  accurate; <code>true</code> represents just an educated guess. To be entirely sure,
     *  you may call <code>updateTinted()</code>.
     */
    get tinted()
    {
        return this._tinted;
    }

    set tinted(value)
    {
        this._tinted = value;
    }

    /** The format string that describes the attributes of each vertex. */
    get formatString()
    {
        return this._format.formatString;
    }

    /** The size (in bytes) of each vertex. */
    get vertexSize()
    {
        return this._vertexSize;
    }

    static getBufferTypeForAttribute(attribute)
    {
        return attribute.isColor ? Uint32Array : Float32Array;
    }
}
