/** Holds the properties of a single attribute in a VertexDataFormat instance.
 *  The member variables must never be changed; they are only <code>public</code>
 *  for performance reasons. */
export default class VertexDataAttribute {
    static FORMAT_SIZES = {
        bytes4: 1, // unsigned 32 bit int - used for colors, converted to vec4 of floats on upload
        float1: 1,
        float2: 2,
        float3: 3,
        float4: 4,
    };

    name;
    format;
    isColor;
    size;   // amount of vals per attribute

    /** Creates a new instance with the given properties. */
    constructor(name, format)
    {
        if (!(format in VertexDataAttribute.FORMAT_SIZES))
            throw new Error(
                `[ArgumentError] Invalid attribute format: ${format}.
                Use one of the following: 'float1'-'float4', 'bytes4'`);

        this.name = name;
        this.format = format;
        this.size = VertexDataAttribute.FORMAT_SIZES[format];
        this.isColor = name.indexOf('color') !== -1 || name.indexOf('Color') !== -1;
    }
}
