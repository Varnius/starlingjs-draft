import Mesh from '../../src/display/mesh';
import IndexData from '../../src/rendering/index-data';
import VertexData from '../../src/rendering/vertex-data';

import Rectangle from '../../src/math/rectangle';
import Point from '../../src/math/point';
import MeshStyle from '../../src/styles/mesh-style';
import { fromTexture } from '../../src/textures/texture-factories';

import MockTexture from '../utils/mock-texture';
import Helpers from '../helpers';

describe('Mesh', () =>
{
    it('should return correct bounds', () =>
    {
        const vertexData = new VertexData('position:float2');
        vertexData.setPoint(0, 'position', 10, 10);
        vertexData.setPoint(1, 'position', 20, 10);
        vertexData.setPoint(2, 'position', 10, 20);

        const indexData = new IndexData();
        indexData.addTriangle(0, 1, 2);

        const mesh = new Mesh(vertexData, indexData);
        const expected = new Rectangle(10, 10, 10, 10);
        Helpers.compareRectangles(expected, mesh.bounds);
        Helpers.compareRectangles(expected, mesh.getBounds(mesh));

        mesh.rotation = Math.PI / 2.0;
        expected.setTo(-20, 10, 10, 10);
        Helpers.compareRectangles(expected, mesh.bounds);
    });

    it('should have correct colors', () =>
    {
        const vertexData = new VertexData();
        vertexData.numVertices = 3;

        const indexData = new IndexData();
        indexData.addTriangle(0, 1, 2);

        const mesh = new Mesh(vertexData, indexData);
        mesh.setVertexColor(0, 0xff0000);
        mesh.setVertexColor(1, 0x00ff00);
        mesh.setVertexColor(2, 0x0000ff);

        expect(mesh.getVertexColor(0)).to.equal(0xff0000);
        expect(mesh.getVertexColor(1)).to.equal(0x00ff00);
        expect(mesh.getVertexColor(2)).to.equal(0x0000ff);

        mesh.color = 0xf0f0f0;

        for (let i = 0; i < 3; ++i)
        {
            expect(mesh.getVertexColor(i)).to.equal(0xf0f0f0);
        }
    });

    it('should have correct alpha', () =>
    {
        const vertexData = new VertexData();
        vertexData.numVertices = 3;

        const indexData = new IndexData();
        indexData.addTriangle(0, 1, 2);

        const mesh = new Mesh(vertexData, indexData);
        mesh.setVertexAlpha(0, 0.2);
        mesh.setVertexAlpha(1, 0.5);
        mesh.setVertexAlpha(2, 0.8);

        const E = 0.02;
        expect(mesh.getVertexAlpha(0)).to.be.closeTo(0.2, E);
        expect(mesh.getVertexAlpha(1)).to.be.closeTo(0.5, E);
        expect(mesh.getVertexAlpha(2)).to.be.closeTo(0.8, E);
    });

    it('should have correct texCoords', () =>
    {
        const rootTexture = new MockTexture(100, 100);
        const subTexture = fromTexture(rootTexture, new Rectangle(50, 50, 50, 50));

        const vertexData = new VertexData();
        vertexData.setPoint(0, 'position', 0, 0);
        vertexData.setPoint(1, 'position', 1, 0);
        vertexData.setPoint(2, 'position', 0, 1);
        vertexData.setPoint(3, 'position', 1, 1);
        vertexData.setPoint(0, 'texCoords', 0, 0);
        vertexData.setPoint(1, 'texCoords', 1, 0);
        vertexData.setPoint(2, 'texCoords', 0, 1);
        vertexData.setPoint(3, 'texCoords', 1, 1);

        const indexData = new IndexData();
        indexData.addQuad(0, 1, 2, 3);

        const mesh = new Mesh(vertexData, indexData);

        Helpers.comparePoints(new Point(0, 0), mesh.getTexCoords(0));
        Helpers.comparePoints(new Point(1, 1), mesh.getTexCoords(3));

        mesh.texture = subTexture; // should change internal texture coordinates

        Helpers.comparePoints(new Point(0, 0), mesh.getTexCoords(0));
        Helpers.comparePoints(new Point(1, 1), mesh.getTexCoords(3));

        Helpers.comparePoints(new Point(0.5, 0.5), vertexData.getPoint(0, 'texCoords'));
        Helpers.comparePoints(new Point(1.0, 1.0), vertexData.getPoint(3, 'texCoords'));

        mesh.setTexCoords(2, 0.25, 0.75);

        Helpers.comparePoints(new Point(0.25, 0.75), mesh.getTexCoords(2));
        Helpers.comparePoints(new Point(0.625, 0.875), vertexData.getPoint(2, 'texCoords'));

        mesh.texture = rootTexture;

        Helpers.comparePoints(new Point(0, 0), mesh.getTexCoords(0));
        Helpers.comparePoints(new Point(1, 1), mesh.getTexCoords(3));

        Helpers.comparePoints(new Point(0, 0), vertexData.getPoint(0, 'texCoords'));
        Helpers.comparePoints(new Point(1, 1), vertexData.getPoint(3, 'texCoords'));
        Helpers.comparePoints(new Point(0.25, 0.75), vertexData.getPoint(2, 'texCoords'));
    });

    it('should have correct vertex position', () =>
    {
        const vertexData = new VertexData();
        vertexData.numVertices = 3;

        const indexData = new IndexData();
        indexData.addTriangle(0, 1, 2);

        const mesh = new Mesh(vertexData, indexData);
        mesh.setVertexPosition(1, 1, 0);
        mesh.setVertexPosition(2, 1, 1);

        Helpers.comparePoints(mesh.getVertexPosition(0), new Point());
        Helpers.comparePoints(mesh.getVertexPosition(1), new Point(1, 0));
        Helpers.comparePoints(mesh.getVertexPosition(2), new Point(1, 1));
    });

    it('should have correct hit test', () =>
    {
        // +  0
        //   /|
        //  / |
        // 1--2--3
        //    | /
        //    |/
        //    4

        const vertexData = new VertexData(MeshStyle.VERTEX_FORMAT, 5);
        vertexData.setPoint(0, 'position', 1, 0);
        vertexData.setPoint(1, 'position', 0, 1);
        vertexData.setPoint(2, 'position', 1, 1);
        vertexData.setPoint(3, 'position', 2, 1);
        vertexData.setPoint(4, 'position', 1, 2);

        const indexData = new IndexData(6);
        indexData.addTriangle(0, 2, 1);
        indexData.addTriangle(2, 3, 4);

        const mesh = new Mesh(vertexData, indexData);
        expect(mesh.hitTest(new Point(0.49, 0.49))).to.be.null;
        expect(mesh.hitTest(new Point(1.01, 0.99))).to.be.null;
        expect(mesh.hitTest(new Point(0.99, 1.01))).to.be.null;
        expect(mesh.hitTest(new Point(1.51, 1.51))).to.be.null;

        expect(mesh).to.equal(mesh.hitTest(new Point(0.51, 0.51)));
        expect(mesh).to.equal(mesh.hitTest(new Point(0.99, 0.99)));
        expect(mesh).to.equal(mesh.hitTest(new Point(1.01, 1.01)));
        expect(mesh).to.equal(mesh.hitTest(new Point(1.49, 1.49)));

        mesh.visible = false;
        expect(mesh.hitTest(new Point(0.75, 0.75))).to.be.null;

        mesh.visible = true;
        mesh.touchable = false;
        expect(mesh.hitTest(new Point(0.75, 0.75))).to.be.null;
    });
});
