import VertexDataAttribute from './vertex-data-attribute';

/** Describes the memory layout of VertexData instances, as used for every single vertex.
 *
 *  <p>The format is set up via a simple String. Here is an example:</p>
 *
 *  <listing>
 *  format = VertexDataFormat.fromString("position:float2, color:bytes4");</listing>
 *
 *  <p>This String describes two attributes: "position" and "color". The keywords after
 *  the colons depict the format and size of the data that each attribute uses; in this
 *  case, we store two floats for the position (taking up the x- and y-coordinates) and four
 *  bytes for the color. (The available formats are the same as those defined in the
 *  <code>Context3DVertexBufferFormat</code> class:
 *  <code>float1, float2, float3, float4, bytes4</code>.)</p>
 *
 *  <p>You cannot create a VertexData instance with its constructor; instead, you must use the
 *  static <code>fromString</code>-method. The reason for this behavior: the class maintains
 *  a cache, and a call to <code>fromString</code> will return an existing instance if an
 *  equivalent format has already been created in the past. That saves processing time and
 *  memory.</p>
 *
 *  <p>VertexDataFormat instances are immutable, i.e. they are solely defined by their format
 *  string and cannot be changed later.</p>
 *
 *  @see VertexData
 */
export default class VertexDataFormat {
    _format;
    _vertexSize;
    _attributes;

    // format cache
    static sFormats = {};

    /** Don't use the constructor, but call <code>VertexDataFormat.fromString</code> instead.
     *  This allows for efficient format caching. */
    constructor() {
        this._attributes = [];
    }

    /** Creates a new VertexDataFormat instance from the given String, or returns one from
     *  the cache (if an equivalent String has already been used before).
     *
     *  @param format
     *
     *  Describes the attributes of each vertex, consisting of a comma-separated
     *  list of attribute names and their format, e.g.:
     *
     *  <pre>"position:float2, texCoords:float2, color:bytes4"</pre>
     *
     *  <p>This set of attributes will be allocated for each vertex, and they will be
     *  stored in exactly the given order.</p>
     *
     *  <ul>
     *    <li>Names are used to access the specific attributes of a vertex. They are
     *        completely arbitrary.</li>
     *    <li>The available formats can be found in the <code>Context3DVertexBufferFormat</code>
     *        class in the <code>flash.display3D</code> package.</li>
     *    <li>Both names and format strings are case-sensitive.</li>
     *    <li>Always use <code>bytes4</code> for color data that you want to access with the
     *        respective methods.</li>
     *    <li>Furthermore, the attribute names of colors should include the string "color"
     *        (or the uppercase variant). If that's the case, the "alpha" channel of the color
     *        will automatically be initialized with "1.0" when the VertexData object is
     *        created or resized.</li>
     *  </ul>
     */
    static fromString(format) {
        const { sFormats } = VertexDataFormat;

        // todo: works same as with as3?
        if (format in sFormats) return sFormats[format];
        else {
            let instance = new VertexDataFormat();
            instance.parseFormat(format);

            const normalizedFormat = instance._format;

            if (normalizedFormat in sFormats)
                instance = sFormats[normalizedFormat];

            sFormats[format] = instance;
            sFormats[normalizedFormat] = instance;

            return instance;
        }
    }

    /** Creates a new VertexDataFormat instance by appending the given format string
     *  to the current instance's format. */
    extend(format) {
        return VertexDataFormat.fromString(this._format + ', ' + format);
    }

    // query methods

    /** Returns the size of a certain vertex attribute in bytes. */
    getSize(attrName) {
        return this.getAttribute(attrName).size;
    }

    getSizeIn32Bits(attrName) {
        return this.getAttribute(attrName).size / 4;
    }

    /** Returns the offset (in bytes) of an attribute within a vertex. */
    getOffset(attrName) {
        return this.getAttribute(attrName).offset;
    }

    /** Returns the offset (in 32 bit units) of an attribute within a vertex. */
    getOffsetIn32Bits(attrName) {
        return this.getAttribute(attrName).offset / 4;
    }

    /** Returns the format of a certain vertex attribute, identified by its name.
     *  Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
    getFormat(attrName) {
        return this.getAttribute(attrName).format;
    }

    /** Returns the name of the attribute at the given position within the vertex format. */
    getName(attrIndex) {
        return this._attributes[attrIndex].name;
    }

    /** Indicates if the format contains an attribute with the given name. */
    hasAttribute(attrName) {
        const numAttributes = this._attributes.length;

        for (let i = 0; i < numAttributes; ++i)
            if (this._attributes[i].name === attrName) return true;

        return false;
    }

    // context methods

    /** Specifies which vertex data attribute corresponds to a single vertex shader
     *  program input. This wraps the <code>Context3D</code>-method with the same name,
     *  automatically replacing <code>attrName</code> with the corresponding values for
     *  <code>bufferOffset</code> and <code>format</code>. */
    setVertexBufferAt(index, buffer, attrName) {
        const attribute = this.getAttribute(attrName);
        window.StarlingContextManager.current.context.setVertexBufferAt(index, buffer, attribute.offset / 4, attribute.format);
    }

    // parsing

    parseFormat(format) {
        const { _attributes } = this;

        if (!!format && format !== '') {
            _attributes.length = 0;
            this._format = '';

            const parts = format.split(',');
            const numParts = parts.length;
            let offset = 0;

            for (let i = 0; i < numParts; ++i) {
                const attrDesc = parts[i];
                const attrParts = attrDesc.split(':');

                if (attrParts.length !== 2)
                    throw new Error('[ArgumentError] Missing colon: ' + attrDesc);

                const attrName = attrParts[0].trim();
                const attrFormat = attrParts[1].trim();

                if (attrName.length === 0 || attrFormat.length === 0)
                    throw new Error(('[ArgumentError] Invalid format string: ' + attrDesc));

                const attribute = new VertexDataAttribute(attrName, attrFormat, offset);

                offset += attribute.size;

                this._format += (i === 0 ? '' : ', ') + attribute.name + ':' + attribute.format;
                _attributes[_attributes.length] = attribute; // avoid 'push'
            }

            this._vertexSize = offset;
        } else {
            this._format = '';
        }
    }

    /** Returns the normalized format string. */
    toString() {
        return this._format;
    }

    // internal methods

    /** @private */
    getAttribute(attrName) {
        let i, attribute;
        const numAttributes = this._attributes.length;

        for (i = 0; i < numAttributes; ++i) {
            attribute = this._attributes[i];
            if (attribute.name === attrName) return attribute;
        }

        return null;
    }

    /** @private */
    get attributes() {
        return this._attributes;
    }

    // properties

    /** Returns the normalized format string. */
    get formatString() {
        return this._format;
    }

    /** The size (in bytes) of each vertex. */
    get vertexSize() {
        return this._vertexSize;
    }

    /** The size (in 32 bit units) of each vertex. */
    get vertexSizeIn32Bits() {
        return this._vertexSize / 4;
    }

    /** The number of attributes per vertex. */
    get numAttributes() {
        return this._attributes.length;
    }
}
