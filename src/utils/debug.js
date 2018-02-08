import { times } from 'ramda';

export function vertexDataToSomethingReadable(vertexData) {
    let i = 0;
    const result = [];
    const length = vertexData._rawData.byteLength;
    const vertexSize = vertexData._vertexSize;
    const rawData = vertexData._rawData;

    while (i < length) {
        const curr = [];
        let offset = 0;

        vertexData._attributes.forEach(attribute => {
            times(() => {
                curr.push(attribute.isColor ? '#' + rawData.getUint32(i + offset, true).toString(16) : rawData.getFloat32(i + offset, true).toFixed(2));
                offset += 4; // bytes
            }, attribute.isColor ? 1 : attribute.numComponents);
        });

        result.push(curr);
        i += vertexSize;
    }

    return result;
}
