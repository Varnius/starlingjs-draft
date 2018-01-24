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
import { copyFromDataView, getDataViewOfLength } from '../utils/data-view';

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
    _rawData;
    _numVertices = 0;
    _format;
    _attributes;
    _numAttributes;
    _premultipliedAlpha = false;
    _tinted = false;

    _posOffset; // in bytes
    _colOffset; // in bytes
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
    constructor(format = null, initialCapacity = 32) {
        if (!format) this._format = MeshStyle.VERTEX_FORMAT;
        else if (format instanceof VertexDataFormat) this._format = format;
        else if (typeof (format) === 'string' || format instanceof String) this._format = VertexDataFormat.fromString(format);
        else throw new Error('[ArgumentError] \'format\' must be String or VertexDataFormat');

        this._attributes = this._format.attributes;
        this._numAttributes = this._attributes.length;
        this._posOffset = this._format.hasAttribute('position') ? this._format.getOffset('position') : 0;
        this._colOffset = this._format.hasAttribute('color') ? this._format.getOffset('color') : 0;
        this._vertexSize = this._format.vertexSize;
        this._numVertices = 0; // todo: remove the one below???
        this._premultipliedAlpha = true;

        this._rawData = getDataViewOfLength(initialCapacity * this._vertexSize);
    }

    /** Explicitly frees up the memory used by the ByteArray. */
    clear() {
        this._rawData = null;
        this._numVertices = 0;
        this._tinted = false;
    }

    /** Creates a duplicate of the vertex data object. */
    clone() {
        const { _numVertices, _premultipliedAlpha, _rawData } = this;
        const clone = new VertexData(this._format, _numVertices);

        //todo: clean up extra arraybuffer creation in the copy
        clone._rawData = new DataView(_rawData.buffer.slice(0));
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
    copyTo(target, targetVertexID = 0, matrix = null, vertexID = 0, numVertices = -1) {
        const { _numVertices, _tinted, _rawData, _attributes, _format, _vertexSize, _posOffset, _numAttributes } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (_format === target._format) {
            if (target._numVertices < targetVertexID + numVertices)
                target._numVertices = targetVertexID + numVertices;

            target._tinted = target._tinted || _tinted;

            // In this case, it's fastest to copy the complete range in one call
            // and then overwrite only the transformed positions.

            const targetStartPosition = targetVertexID * _vertexSize;

            // Sets new instance if there was a need to extend, uses same otherwise
            target._rawData = copyFromDataView(
                _rawData,
                target._rawData,
                vertexID * _vertexSize,
                numVertices * _vertexSize,
                targetStartPosition
            );

            if (matrix) {
                let x, y;
                let pos = targetVertexID * _vertexSize + _posOffset;
                const endPos = pos + (numVertices * _vertexSize);

                while (pos < endPos) {
                    x = target._rawData.getFloat32(pos);
                    y = target._rawData.getFloat32(pos + 4);

                    target._rawData.setFloat32(pos, matrix.a * x + matrix.c * y + matrix.tx);
                    target._rawData.setFloat32(pos + 4, matrix.d * y + matrix.b * x + matrix.ty);

                    pos += _vertexSize;
                }
            }
        } else {
            if (target._numVertices < targetVertexID + numVertices)
                target.numVertices = targetVertexID + numVertices; // ensure correct alphas!

            for (let i = 0; i < _numAttributes; ++i) {
                const srcAttr = _attributes[i];
                const tgtAttr = target.getAttribute(srcAttr.name);

                if (tgtAttr) { // only copy attributes that exist in the target, as well
                    if (srcAttr.offset === _posOffset)
                        this.copyAttributeToInternal(
                            target, targetVertexID, matrix,
                            srcAttr, tgtAttr, vertexID, numVertices
                        );
                    else
                        this.copyAttributeToInternal(
                            target, targetVertexID, null,
                            srcAttr, tgtAttr, vertexID, numVertices
                        );
                }
            }
        }
    }

    copyAttributeToInternal(target, targetVertexID, matrix,
                            sourceAttribute, targetAttribute, vertexID, numVertices) {
        if (sourceAttribute.format !== targetAttribute.format)
            throw new Error('Attribute formats differ between source and target');

        const { _vertexSize, _numVertices, _rawData } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (target._numVertices < targetVertexID + numVertices)
            target._numVertices = targetVertexID + numVertices;

        let i, j, x, y;
        const sourceData = _rawData;
        const targetData = target._rawData;
        const sourceDelta = _vertexSize - sourceAttribute.size;
        const targetDelta = target._vertexSize - targetAttribute.size;
        const attributeSizeIn32Bits = sourceAttribute.size / 4;

        let sourcePos = vertexID * _vertexSize + sourceAttribute.offset;
        let targetPos = targetVertexID * target._vertexSize + targetAttribute.offset;

        if (matrix) {
            for (i = 0; i < numVertices; ++i) {
                x = sourceData.getFloat32(sourcePos);
                sourcePos += 4;
                y = sourceData.getFloat32(sourcePos);
                sourcePos += 4;

                targetData.setFloat32(targetPos, matrix.a * x + matrix.c * y + matrix.tx);
                targetPos += 4;
                targetData.setFloat32(targetPos, matrix.d * y + matrix.b * x + matrix.ty);
                targetPos += 4;

                sourcePos += sourceDelta;
                targetPos += targetDelta;
            }
        } else {
            for (i = 0; i < numVertices; ++i) {
                for (j = 0; j < attributeSizeIn32Bits; ++j) {
                    targetData.setUint32(targetPos, sourceData.getUint32(sourcePos));
                    sourcePos += 4;
                    targetPos += 4;
                }

                sourcePos += sourceDelta;
                targetPos += targetDelta;
            }
        }
    }

    /** Returns a string representation of the VertexData object,
     *  describing both its format and size. */
    toString() {
        return `[VertexData format="${this._format.formatString} numVertices=${this._numVertices}]`;
    }

    /** Reads a float value from the specified vertex and attribute. */
    getFloat(vertexID, attrName) {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        const { _rawData, _vertexSize } = this;
        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        return _rawData.getFloat32(position);
    }

    /** Writes a float value to the specified vertex and attribute. */
    setFloat(vertexID, attrName, value) {
        const { _rawData, _vertexSize } = this;
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        _rawData.setFloat32(position, value);
    }

    /** Reads a Point from the specified vertex and attribute. */
    getPoint(vertexID, attrName, out = null) {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        if (!out) out = new Point();

        const { _posOffset, _rawData, _vertexSize } = this;
        const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
        const position = vertexID * _vertexSize + offset;
        out.x = _rawData.getFloat32(position);
        out.y = _rawData.getFloat32(position + 4);

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint(vertexID, attrName, x, y) {
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        const { _posOffset, _rawData, _vertexSize } = this;
        const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
        const position = vertexID * _vertexSize + offset;
        _rawData.setFloat32(position, x);
        _rawData.setFloat32(position + 4, y);
    }

    /** Reads a Vector3D from the specified vertex and attribute.
     *  The 'w' property of the Vector3D is ignored. */
    getPoint3D(vertexID, attrName, out = null) {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        if (!out) out = new Vector3D();

        const { _rawData, _vertexSize } = this;
        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        out.x = _rawData.getFloat32(position);
        out.y = _rawData.getFloat32(position + 4);
        out.z = _rawData.getFloat32(position + 8);

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint3D(vertexID, attrName, x, y, z) {
        if (this._numVertices < vertexID + 1) this.numVertices = vertexID + 1;

        const { _rawData, _vertexSize } = this;
        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        _rawData.setFloat32(position, x);
        _rawData.setFloat32(position + 4, y);
        _rawData.setFloat32(position + 8, z);
    }

    /** Reads a Vector3D from the specified vertex and attribute, including the fourth
     *  coordinate ('w'). */
    getPoint4D(vertexID, attrName, out = null) {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        if (!out) out = new Vector3D();

        const { _rawData, _vertexSize } = this;
        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        out.x = _rawData.getFloat32(position);
        out.y = _rawData.getFloat32(position + 4);
        out.z = _rawData.getFloat32(position + 8);
        out.w = _rawData.getFloat32(position + 12);

        return out;
    }

    /** Writes the given coordinates to the specified vertex and attribute. */
    setPoint4D(vertexID, attrName, x, y, z, w = 1.0) {
        if (this._numVertices < vertexID + 1) this.numVertices = vertexID + 1;

        const { _rawData, _vertexSize } = this;
        const position = vertexID * _vertexSize + this.getAttribute(attrName).offset;
        _rawData.setFloat32(position, x);
        _rawData.setFloat32(position + 4, y);
        _rawData.setFloat32(position + 8, z);
        _rawData.setFloat32(position + 12, w);
    }

    /** Reads an RGB color from the specified vertex and attribute (no alpha). */
    getColor(vertexID, attrName = 'color') {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        const { _colOffset, _rawData, _vertexSize, _premultipliedAlpha } = this;
        const offset = attrName === 'color' ? _colOffset : this.getAttribute(attrName).offset;
        const position = vertexID * _vertexSize + offset;

        let rgba = _rawData.getUint32(position);

        if (_premultipliedAlpha) {
            rgba = unmultiplyAlpha(rgba);
        }

        return (rgba >> 8) & 0xffffff;
    }

    /** Writes the RGB color to the specified vertex and attribute (alpha is not changed). */
    setColor(vertexID, attrName, color) {
        if (this._numVertices < vertexID + 1)
            this.numVertices = vertexID + 1;

        const alpha = this.getAlpha(vertexID, attrName);
        this.colorize(attrName, color, alpha, vertexID, 1);
    }

    /** Reads the alpha value from the specified vertex and attribute. */
    getAlpha(vertexID, attrName = 'color') {
        if (vertexID >= this._numVertices) throw new Error('Vertex out of bounds');

        const { _colOffset, _rawData, _vertexSize } = this;
        const offset = attrName === 'color' ? _colOffset : this.getAttribute(attrName).offset;
        const position = vertexID * _vertexSize + offset;
        const rgba = _rawData.getUint32(position);
        return (rgba & 0xff) / 255.0;
    }

    /** Writes the given alpha value to the specified vertex and attribute (range 0-1). */
    setAlpha(vertexID, attrName, alpha) {
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
    getBounds(attrName = 'position', matrix = null, vertexID = 0, numVertices = -1, out = null) {
        const { _numVertices, _rawData, _vertexSize, _posOffset } = this;
        const { sHelperPoint } = VertexData;

        if (!out) out = new Rectangle();
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (numVertices === 0) {
            if (!matrix)
                out.setEmpty();
            else {
                MatrixUtil.transformCoords(matrix, 0, 0, sHelperPoint);
                out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
            }
        } else {
            let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
            const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
            let position = vertexID * _vertexSize + offset;
            let x, y, i;

            if (!matrix) {
                for (i = 0; i < numVertices; ++i) {
                    x = _rawData.getFloat32(position);
                    y = _rawData.getFloat32(position + 4);
                    position += _vertexSize;

                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                }
            } else {
                for (i = 0; i < numVertices; ++i) {
                    x = _rawData.getFloat32(position);
                    y = _rawData.getFloat32(position + 4);
                    position += _vertexSize;

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
    getBoundsProjected(attrName, matrix, camPos, vertexID = 0, numVertices = -1, out = null) {
        const { _numVertices, _rawData, _vertexSize, _posOffset } = this;
        const { sHelperPoint, sHelperPoint3D } = VertexData;

        if (!out) out = new Rectangle();
        if (!camPos) throw new Error('[ArgumentError] camPos must not be null');
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        if (numVertices === 0) {
            if (matrix)
                MatrixUtil.transformCoords3D(matrix, 0, 0, 0, sHelperPoint3D);
            else
                sHelperPoint3D.setTo(0, 0, 0);

            MathUtil.intersectLineWithXYPlane(camPos, sHelperPoint3D, sHelperPoint);
            out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
        } else {
            let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
            const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
            let position = vertexID * _vertexSize + offset;
            let x, y, i;

            for (i = 0; i < numVertices; ++i) {
                x = _rawData.getFloat32(position);
                y = _rawData.getFloat32(position);

                position += _vertexSize;

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
    get premultipliedAlpha() {
        return this._premultipliedAlpha;
    }

    set premultipliedAlpha(value) {
        this.setPremultipliedAlpha(value, false);
    }

    /** Changes the way alpha and color values are stored. Optionally updates all existing
     *  vertices. */
    setPremultipliedAlpha(value, updateData) {
        const { _attributes, _numAttributes, _numVertices, _rawData, _premultipliedAlpha, _vertexSize } = this;

        if (updateData && value !== _premultipliedAlpha) {
            for (let i = 0; i < _numAttributes; ++i) {
                const attribute = _attributes[i];
                if (attribute.isColor) {
                    let pos = attribute.offset;
                    let oldColor;
                    let newColor;

                    for (let j = 0; j < _numVertices; ++j) {
                        oldColor = _rawData.getUint32(pos); // todo: endianess
                        newColor = value ? premultiplyAlpha(oldColor) : unmultiplyAlpha(oldColor);
                        _rawData.setUint32(pos, newColor);

                        pos += _vertexSize;
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
    updateTinted(attrName = 'color') {
        const { _rawData, _numVertices, _colOffset, _vertexSize } = this;

        let pos = attrName === 'color' ? _colOffset : this.getAttribute(attrName).offset;
        this._tinted = false;

        for (let i = 0; i < _numVertices; ++i) {
            if (_rawData.getUint32(pos) !== 0xffffffff) {
                this._tinted = true;
                break;
            }

            pos += _vertexSize;
        }

        return this._tinted;
    }

    // modify multiple attributes

    /** Transforms the 2D positions of subsequent vertices by multiplication with a
     *  transformation matrix. */
    transformPoints(attrName, matrix, vertexID = 0, numVertices = -1) {
        const { _numVertices, _vertexSize, _rawData, _posOffset } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        let x, y;
        const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
        let pos = vertexID * _vertexSize + offset;
        const endPos = pos + numVertices * _vertexSize;

        while (pos < endPos) {
            x = _rawData.getFloat32(pos);
            y = _rawData.getFloat32(pos + 4);

            _rawData.setFloat32(pos, matrix.a * x + matrix.c * y + matrix.tx);
            _rawData.setFloat32(pos + 4, matrix.d * y + matrix.b * x + matrix.ty);

            pos += _vertexSize;
        }
    }

    /** Translates the 2D positions of subsequent vertices by a certain offset. */
    translatePoints(attrName, deltaX, deltaY, vertexID = 0, numVertices = -1) {
        const { _posOffset, _rawData, _vertexSize, _numVertices } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        let x, y;
        const offset = attrName === 'position' ? _posOffset : this.getAttribute(attrName).offset;
        let pos = vertexID * _vertexSize + offset;
        const endPos = pos + numVertices * _vertexSize;

        while (pos < endPos) {
            x = _rawData.getFloat32(pos);
            y = _rawData.getFloat32(pos + 4);

            _rawData.setFloat32(pos, x + deltaX);
            _rawData.setFloat32(pos + 4, y + deltaY);

            pos += _vertexSize;
        }
    }

    /** Multiplies the alpha values of subsequent vertices by a certain factor. */
    scaleAlphas(attrName, factor, vertexID = 0, numVertices = -1) {
        const { _numVertices, _rawData, _premultipliedAlpha, _vertexSize, _colOffset } = this;

        if (factor === 1.0) return;
        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;
        this._tinted = true; // factor must be != 1, so there's definitely tinting.

        const offset = attrName === 'color' ? _colOffset : this.getAttribute(attrName).offset;
        let colorPos = vertexID * _vertexSize + offset;
        let alpha, rgba;

        for (let i = 0; i < numVertices; ++i) {
            const color = _rawData.getUint32(colorPos);
            alpha = Color.getAlphaRgba(color) / 255.0 * factor;

            if (alpha > 1.0) alpha = 1.0;
            else if (alpha < 0.0) alpha = 0.0;

            if (alpha === 1.0 || !_premultipliedAlpha) {
                _rawData.setUint32(colorPos, Color.setAlphaRgba(color, alpha * 255.0));
            } else {
                rgba = unmultiplyAlpha(_rawData.getInt32(colorPos));
                rgba = (rgba & 0xffffff00) | ((alpha * 255.0) & 0xff);
                rgba = premultiplyAlpha(rgba);

                _rawData.setUint32(colorPos, rgba);
            }

            colorPos += _vertexSize;
        }
    }

    /** Writes the given RGB and alpha values to the specified vertices. */
    colorize(attrName = 'color', color = 0xffffff, alpha = 1.0, vertexID = 0, numVertices = -1) {
        const { _numVertices, _rawData, _premultipliedAlpha } = this;

        if (numVertices < 0 || vertexID + numVertices > _numVertices)
            numVertices = _numVertices - vertexID;

        const { _vertexSize, _colOffset } = this;
        const offset = attrName === 'color' ? _colOffset : this.getAttribute(attrName).offset;
        let pos = vertexID * _vertexSize + offset;
        const endPos = pos + (numVertices * _vertexSize);

        if (alpha > 1.0) alpha = 1.0;
        else if (alpha < 0.0) alpha = 0.0;

        let rgba = ((color << 8) & 0xffffff00) | (~~(alpha * 255.0) & 0xff);
        rgba >>>= 0; // to unsigned

        if (rgba === 0xffffffff && numVertices === this._numVertices) this._tinted = false;
        else if (rgba !== 0xffffffff) this._tinted = true;

        if (_premultipliedAlpha && alpha !== 1.0) rgba = premultiplyAlpha(rgba);

        const position = vertexID * _vertexSize + offset;
        _rawData.setUint32(position, rgba); // todo: endian?

        while (pos < endPos) {
            _rawData.setUint32(pos, rgba); // todo: endian
            pos += _vertexSize;
        }
    }

    // format helpers

    /** Returns the format of a certain vertex attribute, identified by its name.
     * Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
    getFormat(attrName) {
        return this.getAttribute(attrName).format;
    }

    /** Indicates if the VertexData instances contains an attribute with the specified name. */
    hasAttribute(attrName) {
        return !!this.getAttribute(attrName);
    }

    /** Returns the offset (in bytes) of an attribute within a vertex. */
    getOffset(attrName) {
        return this.getAttribute(attrName).offset;
    }

    /** Returns the offset (in 32 bit units) of an attribute within a vertex. */
    getOffsetIn32Bits(attrName) {
        return this.getAttribute(attrName).offset / 4;
    }

    // VertexBuffer helpers

    /** Creates a vertex buffer object with the right size to fit the complete data.
     *  Optionally, the current data is uploaded right away. */
    uploadToVertexBuffer(bufferUsage = STATIC_DRAW) {
        if (this._numVertices === 0) return;
        const gl = Starling.context;
        if (!gl) throw new Error('[MissingContextError]');
        const { _numAttributes, _rawData, _attributes } = this;

        for (let attributeIndex = 0; attributeIndex < _numAttributes; ++attributeIndex) {
            const attribute = _attributes[attributeIndex];
            const buffer = gl.createBuffer();

            //console.log(`SET attrib ${attribute.name} at index=${attributeIndex}, size ${attribute.size}`, _rawData[attribute.name]);

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

    getAttribute(attrName) {
        let i, attribute;

        for (i = 0; i < this._numAttributes; ++i) {
            attribute = this._attributes[i];
            if (attribute.name === attrName) return attribute;
        }

        return null;
    }

    // properties

    /** The total number of vertices. If you make the object bigger, it will be filled up with
     *  <code>1.0</code> for all alpha values and zero for everything else. */
    get numVertices() {
        return this._numVertices;
    }

    set numVertices(value) {
        const { _vertexSize, _attributes, _numAttributes } = this;

        if (value > this._numVertices) {
            const oldLength = this._numVertices * this.vertexSize;
            const newLength = value * _vertexSize;

            if (this._rawData.byteLength > oldLength) {
                let position = oldLength;

                // todo: fills with zeros, may go out of bounds tho (?)
                while (position < this._rawData.byteLength) {
                    this._rawData.setUint32(position, 0);
                    position += 4;
                }
            }

            if (this._rawData.byteLength < newLength) {
                //_rawData.length = newLength;
                const oldData = this._rawData;
                this._rawData = getDataViewOfLength(newLength);
                copyFromDataView(oldData, this._rawData);
            }

            for (let i = 0; i < _numAttributes; ++i) {
                const attribute = _attributes[i];

                if (attribute.isColor) { // initialize color values with "white" and full alpha
                    let pos = this._numVertices * _vertexSize + attribute.offset;
                    for (let j = this._numVertices; j < value; ++j) {
                        this._rawData.setUint32(pos, 0xffffffff);
                        pos += _vertexSize;
                    }
                }
            }
        }

        if (value === 0) this._tinted = false;
        this._numVertices = value;
    }

    /** The raw vertex data; not a copy! */
    get rawData() {
        return this._rawData;
    }

    /** The format that describes the attributes of each vertex.
     *  When you assign a different format, the raw data will be converted accordingly,
     *  i.e. attributes with the same name will still point to the same data.
     *  New properties will be filled up with zeros (except for colors, which will be
     *  initialized with an alpha value of 1.0). As a side-effect, the instance will also
     *  be trimmed. */
    get format() {
        return this._format;
    }

    set format(value) {
        const { _numVertices } = this;

        if (this._format === value) return;

        let a, i, pos;
        const srcVertexSize = this._format.vertexSize;
        const tgtVertexSize = value.vertexSize;
        const numAttributes = value.numAttributes;

        const newData = getDataViewOfLength(value.vertexSize * _numVertices);

        for (a = 0; a < numAttributes; ++a) {
            const tgtAttr = value.attributes[a];
            const srcAttr = this.getAttribute(tgtAttr.name);

            if (srcAttr) { // copy attributes that exist in both targets
                pos = tgtAttr.offset;

                for (i = 0; i < _numVertices; ++i) {
                    //newData.position = pos;
                    //newData.writeBytes(newData, srcVertexSize * i + srcAttr.offset, srcAttr.size);

                    copyFromDataView(
                        this._rawData,
                        newData,
                        srcVertexSize * i + srcAttr.offset,
                        srcAttr.size,
                        pos
                    );

                    pos += tgtVertexSize;
                }
            } else if (tgtAttr.isColor) { // initialize color values with "white" and full alpha
                pos = tgtAttr.offset;

                for (i = 0; i < _numVertices; ++i) {
                    newData.setUint32(pos, 0xffffffff);
                    pos += tgtVertexSize;
                }
            }
        }

        this._rawData = newData;
        this._format = value;
        this._attributes = this._format.attributes;
        this._numAttributes = this._attributes.length;
        this._vertexSize = this._format.vertexSize;
        this._posOffset = this._format.hasAttribute('position') ? this._format.getOffset('position') : 0;
        this._colOffset = this._format.hasAttribute('color') ? this._format.getOffset('color') : 0;
    }

    /** Indicates if the mesh contains any vertices that are not white or not fully opaque.
     *  If <code>false</code> (and the value wasn't modified manually), the result is 100%
     *  accurate; <code>true</code> represents just an educated guess. To be entirely sure,
     *  you may call <code>updateTinted()</code>.
     */
    get tinted() {
        return this._tinted;
    }

    set tinted(value) {
        this._tinted = value;
    }

    /** The format string that describes the attributes of each vertex. */
    get formatString() {
        return this._format.formatString;
    }

    /** The size (in bytes) of each vertex. */
    get vertexSize() {
        return this._vertexSize;
    }

    get vertexSizeIn32Bits() {
        return this._vertexSize / 4;
    }
}
