import IndexData from '../../src/rendering/index-data';

describe('IndexData', () =>
{
    it('should work', () =>
    {
        const indexData = new IndexData();
        expect(indexData.numIndices).to.equal(0);
        expect(indexData.useQuadLayout).to.be.true;
    });

    it('should be clearable', () =>
    {
        const indexData = new IndexData();
        indexData.addTriangle(1, 2, 4);
        indexData.clear();

        expect(indexData.numIndices).to.equal(0);
        expect(indexData.useQuadLayout).to.be.true;
    });

    it('should allow to set indices', () =>
    {
        const indexData = new IndexData();

        // basic quad data

        indexData.setIndex(0, 0);
        indexData.setIndex(1, 1);
        indexData.setIndex(2, 2);

        expect(indexData.useQuadLayout).to.be.true;
        expect(indexData.getIndex(0)).to.equal(0);
        expect(indexData.getIndex(1)).to.equal(1);
        expect(indexData.getIndex(2)).to.equal(2);

        expect(indexData.numIndices).to.equal(3);

        // setting outside the bounds while keeping quad index rules -> fill up with quad data

        indexData.setIndex(5, 2);
        expect(indexData.useQuadLayout).to.be.true;
        expect(indexData.numTriangles).to.equal(2);
        expect(indexData.getIndex(3)).to.equal(1);
        expect(indexData.getIndex(4)).to.equal(3);
        expect(indexData.getIndex(5)).to.equal(2);

        // arbitrary data

        indexData.setIndex(6, 5);
        expect(indexData.useQuadLayout).to.be.false;
        expect(indexData.numIndices).to.equal(7);
        expect(indexData.getIndex(6)).to.equal(5);

        // settings outside the bounds -> fill up with zeroes

        indexData.setIndex(9, 1);
        expect(indexData.numIndices).to.equal(10);
        expect(indexData.getIndex(7)).to.equal(0);
        expect(indexData.getIndex(8)).to.equal(0);
        expect(indexData.getIndex(9)).to.equal(1);
    });

    it('should allow to append triangle', () =>
    {
        const indexData = new IndexData();

        // basic quad data

        indexData.addTriangle(0, 1, 2);
        indexData.addTriangle(1, 3, 2);

        expect(indexData.useQuadLayout).to.be.true;
        expect(indexData.numQuads).to.equal(1);
        expect(indexData.numTriangles).to.equal(2);
        expect(indexData.numIndices).to.equal(6);

        expect(indexData.getIndex(0)).to.equal(0);
        expect(indexData.getIndex(1)).to.equal(1);
        expect(indexData.getIndex(2)).to.equal(2);
        expect(indexData.getIndex(3)).to.equal(1);
        expect(indexData.getIndex(4)).to.equal(3);
        expect(indexData.getIndex(5)).to.equal(2);

        indexData.numTriangles = 0;
        expect(indexData.numIndices).to.equal(0);
        expect(indexData.numTriangles).to.equal(0);

        // arbitrary data

        indexData.addTriangle(1, 3, 2);
        expect(indexData.useQuadLayout).to.be.false;
        expect(indexData.numTriangles).to.equal(1);
        expect(indexData.numIndices).to.equal(3);

        expect(indexData.getIndex(0)).to.equal(1);
        expect(indexData.getIndex(1)).to.equal(3);
        expect(indexData.getIndex(2)).to.equal(2);
    });

    it('should allow to append quad', () =>
    {
        const indexData = new IndexData();

        // basic quad data

        indexData.addQuad(0, 1, 2, 3);
        indexData.addQuad(4, 5, 6, 7);

        expect(indexData.useQuadLayout).to.be.true;
        expect(indexData.numQuads).to.equal(2);
        expect(indexData.numTriangles).to.equal(4);
        expect(indexData.numIndices).to.equal(12);

        expect(indexData.getIndex(0)).to.equal(0);
        expect(indexData.getIndex(1)).to.equal(1);
        expect(indexData.getIndex(2)).to.equal(2);
        expect(indexData.getIndex(3)).to.equal(1);
        expect(indexData.getIndex(4)).to.equal(3);
        expect(indexData.getIndex(5)).to.equal(2);
        expect(indexData.getIndex(6)).to.equal(4);
        expect(indexData.getIndex(7)).to.equal(5);
        expect(indexData.getIndex(8)).to.equal(6);
        expect(indexData.getIndex(9)).to.equal(5);
        expect(indexData.getIndex(10)).to.equal(7);
        expect(indexData.getIndex(11)).to.equal(6);

        indexData.numTriangles = 0;
        expect(indexData.numIndices).to.equal(0);
        expect(indexData.numQuads).to.equal(0);

        // arbitrary data

        indexData.addQuad(0, 1, 3, 2);
        expect(indexData.useQuadLayout).to.be.false;
        expect(indexData.numQuads).to.equal(1);
        expect(indexData.numTriangles).to.equal(2);
        expect(indexData.numIndices).to.equal(6);

        expect(indexData.getIndex(0)).to.equal(0);
        expect(indexData.getIndex(1)).to.equal(1);
        expect(indexData.getIndex(2)).to.equal(3);
        expect(indexData.getIndex(3)).to.equal(1);
        expect(indexData.getIndex(4)).to.equal(2);
        expect(indexData.getIndex(5)).to.equal(3);
    });

    it('should allow to clone', () =>
    {
        let indexData;
        let clone;

        // with basic quad data

        indexData = new IndexData();
        indexData.addTriangle(1, 2, 3);
        indexData.addTriangle(4, 5, 6);

        clone = indexData.clone();
        expect(clone.numTriangles).to.equal(2);
        expect(clone.getIndex(0)).to.equal(1);
        expect(clone.getIndex(2)).to.equal(3);
        expect(clone.getIndex(4)).to.equal(5);

        // with arbitrary data

        indexData = new IndexData();
        indexData.addTriangle(0, 1, 2);
        indexData.addTriangle(1, 3, 2);

        clone = indexData.clone();
        expect(clone.numTriangles).to.equal(2);
        expect(clone.getIndex(1)).to.equal(1);
        expect(clone.getIndex(2)).to.equal(2);
        expect(clone.getIndex(4)).to.equal(3);
    });

    it('should allow to set number of indices', () =>
    {
        const indexData = new IndexData();
        indexData.numIndices = 6;

        expect(indexData.getIndex(0)).to.equal(0);
        expect(indexData.getIndex(1)).to.equal(1);
        expect(indexData.getIndex(2)).to.equal(2);
        expect(indexData.getIndex(3)).to.equal(1);
        expect(indexData.getIndex(4)).to.equal(3);
        expect(indexData.getIndex(5)).to.equal(2);

        indexData.numIndices = 0;
        expect(indexData.numIndices).to.equal(0);

        indexData.setIndex(0, 1);
        expect(indexData.useQuadLayout).to.be.false;

        indexData.numIndices = 3;
        expect(indexData.getIndex(0)).to.equal(1);
        expect(indexData.getIndex(1)).to.equal(0);
        expect(indexData.getIndex(2)).to.equal(0);

        indexData.numIndices = 0;
        expect(indexData.numIndices).to.equal(0);
        expect(indexData.useQuadLayout).to.be.true;
    });

    it('should have working copyTo', () =>
    {
        // arbitrary data -> arbitrary data
        const source = new IndexData();

        source.addTriangle(1, 2, 3);
        source.addTriangle(4, 5, 6);

        const target = new IndexData();
        target.addTriangle(7, 8, 9);
        source.copyTo(target, 0, 0, 3, 3);

        expect(target.numIndices).to.equal(3);

        expect(target.getIndex(0)).to.equal(4);
        expect(target.getIndex(1)).to.equal(5);
        expect(target.getIndex(2)).to.equal(6);

        source.copyTo(target, 3);
        expect(target.numIndices).to.equal(9);

        // quad data -> quad data

        source.clear();
        target.clear();

        source.addTriangle(0, 1, 2);
        target.addQuad(0, 1, 2, 3);
        source.copyTo(target, 6, 4);

        expect(target.useQuadLayout).to.be.true;
        expect(target.numIndices).to.equal(9);
        expect(target.getIndex(5)).to.equal(2);
        expect(target.getIndex(6)).to.equal(4);
        expect(target.getIndex(7)).to.equal(5);
        expect(target.getIndex(8)).to.equal(6);

        // quad data -> arbitrary data

        target.clear();
        target.addQuad(1, 2, 3, 4);

        // 1 2 3 2 4 3

        source.copyTo(target, 6, 4);

        expect(source.useQuadLayout).to.be.true;
        expect(target.useQuadLayout).to.be.false;
        expect(target.numIndices).to.equal(9);
        expect(target.getIndex(5)).to.equal(3);
        expect(target.getIndex(6)).to.equal(4);
        expect(target.getIndex(7)).to.equal(5);
        expect(target.getIndex(8)).to.equal(6);

        // arbitrary data -> quad data

        source.clear();
        source.addTriangle(1, 2, 3);
        target.clear();
        target.addQuad(0, 1, 2, 3);
        source.copyTo(target, 6, 4);

        expect(source.useQuadLayout).to.be.false;
        expect(target.useQuadLayout).to.be.false;
        expect(target.numIndices).to.equal(9);
        expect(target.getIndex(5)).to.equal(2);
        expect(target.getIndex(6)).to.equal(5);
        expect(target.getIndex(7)).to.equal(6);
        expect(target.getIndex(8)).to.equal(7);
    });

    it('should have working copyTo - edge cases', () =>
    {
        const source = new IndexData();
        source.numIndices = 6;

        const target = new IndexData();
        target.numIndices = 6;

        source.copyTo(target, 1, 1, 0, 1);
        expect(target.useQuadLayout).to.be.true;

        source.copyTo(target, 3, 0, 1, 1);
        expect(target.useQuadLayout).to.be.true;

        source.copyTo(target, 1, 1, 0, 2);
        expect(target.useQuadLayout).to.be.true;

        source.copyTo(target, 10, 5, 2, 2);
        expect(target.useQuadLayout).to.be.true;

        source.copyTo(target, 13, 8, 1, 4);
        expect(target.useQuadLayout).to.be.true;

        source.copyTo(target, 10, 3, 4, 1);

        expect(target.useQuadLayout).to.be.false;
        expect(target.getIndex(10)).to.equal(6);
    });

    it('should allow to use offset with copyTo', () =>
    {
        const source = new IndexData();
        source.addTriangle(1, 2, 3);
        source.addTriangle(4, 5, 6);

        const target = new IndexData();
        target.addTriangle(7, 8, 9);
        source.copyTo(target, 1, 10, 3, 3);

        expect(target.numIndices).to.equal(4);
        expect(target.getIndex(0)).to.equal(7);
        expect(target.getIndex(1)).to.equal(14);
        expect(target.getIndex(2)).to.equal(15);
        expect(target.getIndex(3)).to.equal(16);
    });

    it('should allow to offset indices', () =>
    {
        const indexData = new IndexData();
        indexData.addTriangle(1, 2, 3);
        indexData.addTriangle(4, 5, 6);

        indexData.offsetIndices(10, 1, 3);
        expect(indexData.getIndex(0)).to.equal( 1);
        expect(indexData.getIndex(1)).to.equal(12);
        expect(indexData.getIndex(2)).to.equal(13);
        expect(indexData.getIndex(3)).to.equal(14);
        expect(indexData.getIndex(4)).to.equal( 5);
    });

    // todo: is this needed?
    //it('test toVector', () =>
    //{
    //    var source:IndexData = new IndexData();
    //    source.addTriangle(1, 2, 3);
    //    source.addTriangle(4, 5, 6);
    //
    //    var expected:Vector.<uint> = new <uint>[1, 2, 3, 4, 5, 6];
    //    Helpers.compareVectorsOfUints(source.toVector(), expected);
    //});

    it('should allow to set layout', () =>
    {
        const indexData = new IndexData();
        indexData.numIndices = 6;
        expect(indexData.useQuadLayout).to.be.true;
        expect(indexData.getIndex(3)).to.equal(1);

        indexData.setIndex(3, 10);
        expect(indexData.useQuadLayout).to.be.false;

        indexData.useQuadLayout = true;
        expect(indexData.getIndex(3)).to.equal(1);

        // basic quad data must be sized correctly
        indexData.useQuadLayout = false;
        indexData.numIndices = 12;
        indexData.useQuadLayout = true;
        indexData.useQuadLayout = false;
        expect(indexData.getIndex(11)).to.equal(6);
    });
});
