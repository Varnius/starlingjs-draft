import VertexDataFormat from '../../src/rendering/vertex-data-format';

describe('VertexDataFormat', () => {
    const STD_FORMAT = 'position:float2, texCoords:float2, color:bytes4';

    it('should parse format', () => {
        const vdf = VertexDataFormat.fromString(STD_FORMAT);

        expect(vdf.getSizeIn32Bits('position')).to.equal(2);
        expect(vdf.getSize('position')).to.equal(8);
        expect(vdf.getSizeIn32Bits('texCoords')).to.equal(2);
        expect(vdf.getSize('texCoords')).to.equal(8);
        expect(vdf.getSizeIn32Bits('color')).to.equal(1);
        expect(vdf.getSize('color')).to.equal(4);
        expect(vdf.vertexSizeIn32Bits).to.equal(5);
        expect(vdf.vertexSize).to.equal(20);

        expect(vdf.getFormat('position')).to.equal('float2');
        expect(vdf.getFormat('texCoords')).to.equal('float2');
        expect(vdf.getFormat('color')).to.equal('bytes4');

        expect(vdf.getOffsetIn32Bits('position')).to.equal(0);
        expect(vdf.getOffset('position')).to.equal(0);
        expect(vdf.getOffsetIn32Bits('texCoords')).to.equal(2);
        expect(vdf.getOffset('texCoords')).to.equal(8);
        expect(vdf.getOffsetIn32Bits('color')).to.equal(4);
        expect(vdf.getOffset('color')).to.equal(16);

        expect(vdf.formatString).to.equal(STD_FORMAT);
    });

    it('should work while empty', () => {
        const vdf = VertexDataFormat.fromString(null);
        expect(vdf.formatString).to.equal('');
        expect(vdf.numAttributes).to.equal(0);
    });

    it('should cache', () => {
        const formatA = '  position :float2  ,color:  bytes4   ';
        const formatB = 'position:float2,color:bytes4';

        const vdfA = VertexDataFormat.fromString(formatA);
        const vdfB = VertexDataFormat.fromString(formatB);

        expect(vdfA).to.eql(vdfB);
    });

    it('should normalize', () => {
        const format = '   position :float2  ,color:  bytes4   ';
        const normalizedFormat = 'position:float2, color:bytes4';
        const vdf = VertexDataFormat.fromString(format);
        expect(normalizedFormat).to.equal(vdf.formatString);
    });

    it('should be extendable', () => {
        const formatString = 'position:float2';
        const baseFormat = VertexDataFormat.fromString(formatString);
        const exFormat = baseFormat.extend('color:float4');
        expect(exFormat.formatString).to.equal('position:float2, color:float4');
        expect(exFormat.numAttributes).to.equal(2);
        expect(exFormat.getFormat('position')).to.equal('float2');
        expect(exFormat.getFormat('color')).to.equal('float4');
    });

    it('should throw on invalid formats', () => {
        expect(() => VertexDataFormat.fromString('color:double2')).to.throw();
        expect(() => VertexDataFormat.fromString('color.float4')).to.throw();
    });
});
