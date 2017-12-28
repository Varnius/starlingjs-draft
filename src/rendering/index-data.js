import { STATIC_DRAW } from 'gl-constants';
import Starling from '../core/starling';

/** The IndexData class manages a raw list of vertex indices, allowing direct upload
 *  to Stage3D index buffers. <em>You only have to work with this class if you're writing
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
 *  a simple way to do just that. The data is stored in a ByteArray (one index or vertex after
 *  the other) that can easily be uploaded to a buffer.</p>
 *
 *  <strong>Basic Quad Layout</strong>
 *
 *  <p>In many cases, the indices we are working with will reference just quads, i.e.
 *  triangles composing rectangles. That means that many IndexData instances will contain
 *  similar or identical data — a great opportunity for optimization!</p>
 *
 *  <p>If an IndexData instance follows a specific layout, it will be recognized
 *  automatically and many operations can be executed much faster. In Starling, that
 *  layout is called "basic quad layout". In order to recognize this specific sequence,
 *  the indices of each quad have to use the following order:</p>
 *
 *  <pre>n, n+1, n+2, n+1, n+3, n+2</pre>
 *
 *  <p>The subsequent quad has to use <code>n+4</code> as starting value, the next one
 *  <code>n+8</code>, etc. Here is an example with 3 quads / 6 triangles:</p>
 *
 *  <pre>0, 1, 2, 1, 3, 2,   4, 5, 6, 5, 7, 6,   8, 9, 10, 9, 11, 10</pre>
 *
 *  <p>If you are describing quad-like meshes, make sure to always use this layout.</p>
 *
 *  @see VertexData
 */
export default class IndexData {
    _rawData;
    _numIndices;
    _initialCapacity;
    _useQuadLayout;

    // basic quad layout
    static sQuadData = new Uint16Array();
    static sQuadDataNumIndices = 0;

    /** Creates an empty IndexData instance with the given capacity (in indices).
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
     *  usage of your IndexData instances.</p>
     */
    constructor(initialCapacity = 48) {
        this._numIndices = 0;
        this._initialCapacity = initialCapacity;
        this._useQuadLayout = true;
        this._rawData = new Uint16Array(initialCapacity);
    }

    /** Explicitly frees up the memory used by the ByteArray, thus removing all indices.
     *  Quad layout will be restored (until adding data violating that layout). */
    clear() {
        if (this._rawData)
            this._rawData = new Uint16Array(this._initialCapacity);

        this._numIndices = 0;
        this._useQuadLayout = true;
    }

    /** Creates a duplicate of the IndexData object. */
    clone() {
        const { _numIndices, _useQuadLayout } = this;
        const clone = new IndexData(_numIndices);

        if (!_useQuadLayout) {
            clone.switchToGenericData();
            clone._rawData = new Uint16Array(this._rawData);
        }

        clone._numIndices = _numIndices;
        return clone;
    }

    /** Copies the index data (or a range of it, defined by 'indexID' and 'numIndices')
     *  of this instance to another IndexData object, starting at a certain target index.
     *  If the target is not big enough, it will grow to fit all the new indices.
     *
     *  <p>By passing a non-zero <code>offset</code>, you can raise all copied indices
     *  by that value in the target object.</p>
     */
    copyTo(target, targetIndexID = 0, offset = 0, indexID = 0, numIndices = -1) {
        if (numIndices < 0 || indexID + numIndices > this._numIndices)
            numIndices = this._numIndices - indexID;

        let sourceData, targetData;
        const newNumIndices = targetIndexID + numIndices;

        if (target._numIndices < newNumIndices) {
            target._numIndices = newNumIndices;

            if (IndexData.sQuadDataNumIndices < newNumIndices)
                IndexData.ensureQuadDataCapacity(newNumIndices);
        }

        if (this._useQuadLayout) {
            if (target._useQuadLayout) {
                let keepsQuadLayout = true;
                const distance = targetIndexID - indexID;
                const distanceInQuads = distance / 6;
                const offsetInQuads = offset / 4;

                // This code is executed very often. If it turns out that both IndexData
                // instances use a quad layout, we don't need to do anything here.
                //
                // When "distance / 6 == offset / 4 && distance % 6 == 0 && offset % 4 == 0",
                // the copy operation preserves the quad layout. In that case, we can exit
                // right away. The code below is a little more complex, though, to avoid the
                // (surprisingly costly) mod-operations.

                if (distanceInQuads === offsetInQuads && (offset & 3) === 0 &&
                    distanceInQuads * 6 === distance) {
                    keepsQuadLayout = true;
                } else if (numIndices > 2) {
                    keepsQuadLayout = false;
                } else {
                    for (let i = 0; i < numIndices; ++i)
                        keepsQuadLayout = keepsQuadLayout && IndexData.getBasicQuadIndexAt(indexID + i) + offset === IndexData.getBasicQuadIndexAt(targetIndexID + i);
                }

                if (keepsQuadLayout) return;
                else target.switchToGenericData();
            }

            sourceData = IndexData.sQuadData;
            targetData = target._rawData;

            if ((offset % 4) === 0) {
                indexID += 6 * offset / 4;
                offset = 0;
                IndexData.ensureQuadDataCapacity(indexID + numIndices);
            }
        } else {
            if (target._useQuadLayout)
                target.switchToGenericData();

            sourceData = this._rawData;
            targetData = target._rawData;
        }

        const slice = sourceData.slice(indexID, indexID + numIndices);

        for (let i = targetIndexID; i < targetIndexID + slice.length; ++i) {
            targetData[i] = slice[i - targetIndexID] + offset;
        }
    }

    /** Sets an index at the specified position. */
    setIndex(indexID, index) {
        if (this._numIndices < indexID + 1)
            this.numIndices = indexID + 1;

        if (this._useQuadLayout) {
            if (IndexData.getBasicQuadIndexAt(indexID) === index) return;
            else this.switchToGenericData();
        }

        this._rawData[indexID] = index;
    }

    /** Reads the index from the specified position. */
    getIndex(indexID) {
        if (this._useQuadLayout) {
            if (indexID < this._numIndices)
                return IndexData.getBasicQuadIndexAt(indexID);
            else
                throw new Error('[EOFError]');
        } else {
            return this._rawData[indexID];
        }
    }

    /** Adds an offset to all indices in the specified range. */
    offsetIndices(offset, indexID = 0, numIndices = -1) {
        if (numIndices < 0 || indexID + numIndices > this._numIndices)
            numIndices = this._numIndices - indexID;

        const endIndex = indexID + numIndices;

        for (let i = indexID; i < endIndex; ++i)
            this.setIndex(i, this.getIndex(i) + offset);
    }

    /** Appends three indices representing a triangle. Reference the vertices clockwise,
     *  as this defines the front side of the triangle. */
    addTriangle(a, b, c) {
        const { _rawData } = this;

        if (this._useQuadLayout) {
            if (a === IndexData.getBasicQuadIndexAt(this._numIndices)) {
                const oddTriangleID = (this._numIndices & 1) !== 0;
                const evenTriangleID = !oddTriangleID;

                if ((evenTriangleID && b === a + 1 && c === b + 1) ||
                    (oddTriangleID && c === a + 1 && b === c + 1)) {
                    this._numIndices += 3;
                    IndexData.ensureQuadDataCapacity(this._numIndices);
                    return;
                }
            }

            this.switchToGenericData();
        }

        _rawData[this._numIndices] = a;
        _rawData[this._numIndices + 1] = b;
        _rawData[this._numIndices + 2] = c;

        this._numIndices += 3;
    }

    /** Appends two triangles spawning up the quad with the given indices.
     *  The indices of the vertices are arranged like this:
     *
     *  <pre>
     *  a - b
     *  | / |
     *  c - d
     *  </pre>
     *
     *  <p>To make sure the indices will follow the basic quad layout, make sure each
     *  parameter increments the one before it (e.g. <code>0, 1, 2, 3</code>).</p>
     */
    addQuad(a, b, c, d) {
        const { _rawData, _numIndices } = this;

        if (this._useQuadLayout) {
            if (a === IndexData.getBasicQuadIndexAt(_numIndices)
                && b === a + 1
                && c === b + 1
                && d === c + 1) {
                this._numIndices += 6;
                IndexData.ensureQuadDataCapacity(_numIndices);
                return;
            } else this.switchToGenericData();
        }

        const position = _numIndices;

        _rawData[position] = a;
        _rawData[position + 1] = b;
        _rawData[position + 2] = c;
        _rawData[position + 3] = b;
        _rawData[position + 4] = d;
        _rawData[position + 5] = c;

        this._numIndices += 6;
    }

    /** Creates a vector containing all indices. If you pass an existing vector to the method,
     *  its contents will be overwritten. */
//    toVector(out:Vector.<uint>=null):Vector.<uint>
//{
//    if (out == null) out = new Vector.<uint>(_numIndices);
//    else out.length = _numIndices;
//
//    var rawData:ByteArray = _useQuadLayout ? sQuadData : _rawData;
//    rawData.position = 0;
//
//    for (var i:int=0; i<_numIndices; ++i)
//    out[i] = rawData.readUnsignedShort();
//
//    return out;
//}

    /** Returns a string representation of the IndexData object,
     *  including a comma-separated list of all indices. */
//    toString():String
//{
//    var string:String = StringUtil.format("[IndexData numIndices={0} indices=\"{1}\"]",
//        _numIndices, toVector(sVector).join());
//
//    sVector.length = 0;
//    return string;
//}

    // private helpers

    switchToGenericData() {
        if (this._useQuadLayout) {
            this._useQuadLayout = false;

            if (!this._rawData) {
                this._rawData = new Uint16Array(this._initialCapacity);
            }

            if (this._numIndices) {
                this._rawData = new Uint16Array(this._numIndices);

                for (let i = 0; i < this._numIndices; ++i) {
                    this._rawData[i] = IndexData.sQuadData[i];
                }
            }
        }
    }

    /** Makes sure that the ByteArray containing the normalized, basic quad data contains at
     *  least <code>numIndices</code> indices. The array might grow, but it will never be
     *  made smaller. */
    static ensureQuadDataCapacity(numIndices) {
        if (IndexData.sQuadDataNumIndices >= numIndices) return;

        let i, currentIndex = 0;
        const newNumQuads = Math.ceil(numIndices / 6);

        IndexData.sQuadData = new Uint16Array(newNumQuads * 6);
        IndexData.sQuadDataNumIndices = newNumQuads * 6;

        for (i = 0; i < newNumQuads; ++i) {
            IndexData.sQuadData[currentIndex] = 4 * i;
            IndexData.sQuadData[currentIndex + 1] = 4 * i + 1;
            IndexData.sQuadData[currentIndex + 2] = 4 * i + 2;
            IndexData.sQuadData[currentIndex + 3] = 4 * i + 1;
            IndexData.sQuadData[currentIndex + 4] = 4 * i + 3;
            IndexData.sQuadData[currentIndex + 5] = 4 * i + 2;

            currentIndex += 6;
        }
    }

    /** Returns the index that's expected at this position if following basic quad layout. */
    static getBasicQuadIndexAt(indexID) {
        const quadID = Math.floor(indexID / 6);
        const posInQuad = indexID - quadID * 6; // => indexID % 6
        let offset;

        if (posInQuad === 0) offset = 0;
        else if (posInQuad === 1 || posInQuad === 3) offset = 1;
        else if (posInQuad === 2 || posInQuad === 5) offset = 2;
        else offset = 3;

        return quadID * 4 + offset;
    }

    // IndexBuffer helpers


    /** Uploads the complete data (or a section of it) to the given index buffer. */
    uploadToIndexBuffer(bufferUsage = STATIC_DRAW) {
        if (this._numIndices === 0) return null;
        const gl = Starling.context;

        const indexBuffer = gl.createBuffer();

        //console.log('indices', this.rawData)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.rawData, bufferUsage);
    }

    // properties

    /** The total number of indices.
     *
     *  <p>If this instance contains only standardized, basic quad indices, resizing
     *  will automatically fill up with appropriate quad indices. Otherwise, it will fill
     *  up with zeroes.</p>
     *
     *  <p>If you set the number of indices to zero, quad layout will be restored.</p> */
    get numIndices() {
        return this._numIndices;
    }

    set numIndices(value) {
        if (value !== this._numIndices) {
            if (this._useQuadLayout) IndexData.ensureQuadDataCapacity(value);
            else {
                const oldData = this._rawData;
                this._rawData = new Uint16Array(value);

                for (let i = 0; i < value; ++i) {
                    this._rawData[i] = oldData[i];
                }
            }
            if (value === 0) this._useQuadLayout = true;

            this._numIndices = value;
        }
    }

    /** The number of triangles that can be spawned up with the contained indices.
     *  (In other words: the number of indices divided by three.) */
    get numTriangles() {
        return this._numIndices / 3;
    }

    set numTriangles(value) {
        this.numIndices = value * 3;
    }

    /** The number of quads that can be spawned up with the contained indices.
     *  (In other words: the number of triangles divided by two.) */
    get numQuads() {
        return this._numIndices / 6;
    }

    set numQuads(value) {
        this.numIndices = value * 6;
    }

    /** Indicates if all indices are following the basic quad layout.
     *
     *  <p>This property is automatically updated if an index is set to a value that violates
     *  basic quad layout. Once the layout was violated, the instance will always stay that
     *  way, even if you fix that violating value later. Only calling <code>clear</code> or
     *  manually enabling the property will restore quad layout.</p>
     *
     *  <p>If you enable this property on an instance, all indices will immediately be
     *  replaced with indices following standard quad layout.</p>
     *
     *  <p>Please look at the class documentation for more information about that kind
     *  of layout, and why it is important.</p>
     *
     *  @default true
     */
    get useQuadLayout() {
        return this._useQuadLayout;
    }

    set useQuadLayout(value) {
        if (value !== this._useQuadLayout) {
            if (value) {
                IndexData.ensureQuadDataCapacity(this._numIndices);
                this._rawData = null; // todo: was previously _rawData.length = 0
                this._useQuadLayout = true;
            }
            else this.switchToGenericData();
        }
    }

    get rawData() {
        if (this._useQuadLayout) return IndexData.sQuadData;
        else return this._rawData;
    }
}
