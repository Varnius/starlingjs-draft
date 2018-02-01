import { times } from 'ramda';

export function vertexDataToSomethingReadable(vertexData) {
    let i = 0;
    const result = [];
    const length = vertexData._rawData.byteLength;
    const vertexSize = vertexData._vertexSize;
    const rawData = vertexData._rawData;

    while (i < length) {
        let curr = [];
        let offset = 0;

        vertexData._attributes.forEach(attribute => {
            times(() => {
                curr.push(attribute.isColor ? '#' + rawData.getUint32(i + offset).toString(16) : rawData.getFloat32(i + offset));
                offset += 4; // bytes
            }, attribute.isColor ? 1 : attribute.numComponents);
        });

        result.push(curr);
        i += vertexSize;
    }

    return result;
}
