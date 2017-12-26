import SubTexture from '../../src/textures/subtexture';
import VertexData from '../../src/rendering/vertex-data';
import Point from '../../src/math/point';
import Rectangle from '../../src/math/rectangle';
import MockTexture from '../test-utils/mock-texture';
import Helpers from '../helpers';

describe('Texture', () =>
{
    const E = 0.0001;

    // todo: add error to constructor
    //it('should not allow to be created by constructor', () =>
    //{
    //    expect(() => new Texture()).to.throw();
    //});

    it('should have correct coordinates', () =>
    {
        const rootWidth = 256;
        const rootHeight = 128;
        let subTexture;
        const texCoords = new Point();
        const expected = new Point();
        const texture = new MockTexture(rootWidth, rootHeight);

        // test sub texture filling the whole base texture
        subTexture = new SubTexture(texture, new Rectangle(0, 0, rootWidth, rootHeight));
        subTexture.localToGlobal(1, 1, texCoords);
        expected.setTo(1, 1);
        Helpers.comparePoints(expected, texCoords);

        // test subtexture with 50% of the size of the base texture
        subTexture = new SubTexture(texture, new Rectangle(rootWidth / 4, rootHeight / 4, rootWidth / 2, rootHeight / 2));
        subTexture.localToGlobal(1, 0.5, texCoords);
        expected.setTo(0.75, 0.5);
        Helpers.comparePoints(expected, texCoords);

        // test subtexture of subtexture
        const subSubTexture = new SubTexture(
            subTexture,
            new Rectangle(subTexture.width / 4, subTexture.height / 4, subTexture.width / 2, subTexture.height / 2)
        );
        subSubTexture.localToGlobal(1, 0.5, texCoords);
        expected.setTo(0.625, 0.5);
        Helpers.comparePoints(expected, texCoords);
    });

    it('should produce correct results when rotated', () =>
    {
        const rootWidth = 256;
        const rootHeight = 128;
        const texCoords = new Point();
        const expected = new Point();
        const texture = new MockTexture(rootWidth, rootHeight);

        // rotate full region once
        let subTexture = new SubTexture(texture, null, false, null, true);
        subTexture.localToGlobal(1, 1, texCoords);
        expected.setTo(0, 1);
        Helpers.comparePoints(expected, texCoords);

        // rotate again
        const subSubTexture = new SubTexture(subTexture, null, false, null, true);
        subSubTexture.localToGlobal(1, 1, texCoords);
        expected.setTo(0, 0);
        Helpers.comparePoints(expected, texCoords);

        // now get rotated region
        subTexture = new SubTexture(texture,
            new Rectangle(rootWidth / 4, rootHeight / 2, rootWidth / 2, rootHeight / 4),
            false, null, true);
        subTexture.localToGlobal(1, 1, texCoords);
        expected.setTo(0.25, 0.75);
        Helpers.comparePoints(expected, texCoords);
    });

    it('should have good vertex positions', () =>
    {
        const size = new Rectangle(0, 0, 60, 40);
        const frame = new Rectangle(-20, -30, 100, 100);
        const texture = new MockTexture(size.width, size.height);
        const subTexture = new SubTexture(texture, null, false, frame);
        const vertexData = new VertexData('pos:float2');
        const expected = new Rectangle();
        let result;

        expect(subTexture.frameWidth).to.equal(100);
        expect(subTexture.frameHeight).to.equal(100);

        subTexture.setupVertexPositions(vertexData, 0, 'pos');
        expect(vertexData.numVertices).to.equal(4);

        result = vertexData.getBounds('pos');
        expected.setTo(20, 30, 60, 40);
        Helpers.compareRectangles(expected, result);

        const bounds = new Rectangle(1, 2, 200, 50);
        subTexture.setupVertexPositions(vertexData, 0, 'pos', bounds);
        result = vertexData.getBounds('pos');
        expected.setTo(41, 17, 120, 20);
        Helpers.compareRectangles(expected, result);
    });

    it('should have correct root', () =>
    {
        const texture = new MockTexture(32, 32);
        const subTexture = new SubTexture(texture, new Rectangle(0, 0, 16, 16));
        const subSubTexture = new SubTexture(texture, new Rectangle(0, 0, 8, 8));

        expect(texture.root).to.equal(texture);
        expect(subTexture.root).to.equal(texture);
        expect(subSubTexture.root).to.equal(texture);
        expect(subSubTexture.base).to.equal(texture.base);
    });

    it('should return correct size', () =>
    {
        const texture = new MockTexture(32, 16, 2);
        const subTexture = new SubTexture(texture, new Rectangle(0, 0, 12, 8));

        expect(texture.width).to.be.closeTo(16, E);
        expect(texture.height).to.be.closeTo(8, E);
        expect(texture.nativeWidth).to.be.closeTo(32, E);
        expect(texture.nativeHeight).to.be.closeTo(16, E);

        expect(subTexture.width).to.be.closeTo(12, E);
        expect(subTexture.height).to.be.closeTo(8, E);
        expect(subTexture.nativeWidth).to.be.closeTo(24, E);
        expect(subTexture.nativeHeight).to.be.closeTo(16, E);
    });

    it('should scale', () =>
    {
        let texCoords;
        const texture = new MockTexture(32, 16, 2);
        let subTexture = new SubTexture(texture, null, false, null, false, 0.5);

        // construct texture with scale factor 1
        expect(subTexture.scale).to.be.closeTo(1.0, E);
        expect(subTexture.width).to.be.closeTo(texture.nativeWidth, E);
        expect(subTexture.height).to.be.closeTo(texture.nativeHeight, E);
        expect(subTexture.nativeWidth).to.be.closeTo(texture.nativeWidth, E);
        expect(subTexture.nativeHeight).to.be.closeTo(texture.nativeHeight, E);

        // and from the one above, back to the original factor of 2
        const subSubTexture = new SubTexture(subTexture, null, false, null, false, 2.0);
        expect(subSubTexture.scale).to.be.closeTo(2.0, E);
        expect(subSubTexture.width).to.be.closeTo(texture.width, E);
        expect(subSubTexture.height).to.be.closeTo(texture.height, E);
        expect(subSubTexture.nativeWidth).to.be.closeTo(texture.nativeWidth, E);
        expect(subSubTexture.nativeHeight).to.be.closeTo(texture.nativeHeight, E);

        // now make the resolution of the original texture even higher
        subTexture = new SubTexture(texture, null, false, null, false, 2);
        expect(subTexture.scale).to.be.closeTo(4.0, E);
        expect(subTexture.width).to.be.closeTo(texture.width / 2, E);
        expect(subTexture.height).to.be.closeTo(texture.height / 2, E);
        expect(subTexture.nativeWidth).to.be.closeTo(texture.nativeWidth, E);
        expect(subTexture.nativeHeight).to.be.closeTo(texture.nativeHeight, E);

        // test region
        const region = new Rectangle(8, 4, 8, 4);
        subTexture = new SubTexture(texture, region, false, null, false, 0.5);
        expect(subTexture.width).to.be.closeTo(region.width * 2, E);
        expect(subTexture.height).to.be.closeTo(region.height * 2, E);
        expect(subTexture.nativeWidth).to.be.closeTo(texture.nativeWidth / 2, E);
        expect(subTexture.nativeHeight).to.be.closeTo(texture.nativeHeight / 2, E);

        texCoords = subTexture.localToGlobal(0, 0);
        Helpers.comparePoints(new Point(0.5, 0.5), texCoords);

        texCoords = subTexture.localToGlobal(1, 1);
        Helpers.comparePoints(new Point(1, 1), texCoords);
    });
});
