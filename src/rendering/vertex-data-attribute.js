/** Holds the properties of a single attribute in a VertexDataFormat instance.
 *  The member variables must never be changed; they are only <code>public</code>
 *  for performance reasons. */
export default class VertexDataAttribute {
    static FORMAT_SIZES = {
        bytes4: 4,
        float1: 4,
        float2: 8,
        float3: 12,
        float4: 16,
    };

    name;
    format;
    isColor;
    offset; // in bytes
    size; // in bytes
    normalized;
    numComponents;

    /** Creates a new instance with the given properties. */
    constructor(name, format, offset, normalized) {
        if (!(format in VertexDataAttribute.FORMAT_SIZES))
            throw new Error(
                `[ArgumentError] Invalid attribute format: ${format}.
                Use one of the following: 'float1'-'float4', 'bytes4'`);

        this.name = name;
        this.format = format;
        this.offset = offset;
        this.size = VertexDataAttribute.FORMAT_SIZES[format];
        this.isColor = name.indexOf('color') !== -1 || name.indexOf('Color') !== -1;

        if (normalized) {
            this.normalized = normalized;
        } else {
            this.normalized = this.isColor;
        }

        this.numComponents = this.isColor ? 4 : this.size / 4;
    }
}
