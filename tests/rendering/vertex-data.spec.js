import VertexData from '../../src/rendering/vertex-data';
import Point from '../../src/math/point';
import Vector3D from '../../src/math/vector3d';
import Rectangle from '../../src/math/rectangle';
import Matrix from '../../src/math/matrix';
import Matrix3D from '../../src/math/matrix3d';
import Color from '../../src/utils/color';
import Helpers from '../helpers';
import VertexDataFormat from '../../src/rendering/vertex-data-format';

describe('VertexData', () => {
    const E = 0.001;
    const STD_FORMAT = 'position:float2, texCoords:float2, color:bytes4';

    it('should allow to set number of vertices', () => {
        const vd = new VertexData(STD_FORMAT);
        expect(vd.numVertices).to.equal(0);

        vd.setPoint(0, 'position', 1, 2);
        vd.setPoint(0, 'texCoords', 0.1, 0.2);

        expect(vd.numVertices).to.equal(1);
        expect(vd.getAlpha(0)).to.equal(1.0);
        expect(vd.getColor(0)).to.equal(0xffffff);

        Helpers.comparePoints(new Point(1, 2), vd.getPoint(0, 'position'));
        Helpers.comparePoints(new Point(0.1, 0.2), vd.getPoint(0, 'texCoords'));

        vd.setAlpha(2, 'color', 0.5);
        expect(vd.numVertices).to.equal(3);
        expect(vd.getAlpha(1)).to.equal(1.0);
        expect(vd.getColor(1)).to.equal(0xffffff);
        expect(vd.getAlpha(2)).to.be.closeTo(0.5, 0.003);

        vd.numVertices = 0;
        expect(vd.numVertices).to.equal(0);

        vd.numVertices = 10;
        expect(vd.numVertices).to.equal(10);

        for (let i = 0; i < 10; ++i) {
            expect(vd.getAlpha(i)).to.equal(1.0);
            expect(vd.getColor(i)).to.equal(0xffffff);
            Helpers.comparePoints(vd.getPoint(i, 'position'), new Point());
            Helpers.comparePoints(vd.getPoint(i, 'texCoords'), new Point());
        }
    });

    it('should respect the range of existing vertices - min val', () => {
        const vd = new VertexData(STD_FORMAT);
        vd.numVertices = 3;
        expect(() => vd.getColor(-1, 'color')).to.throw();
    });

    it('should respect the range of existing vertices - max val', () => {
        const vd = new VertexData(STD_FORMAT);
        vd.numVertices = 3;
        expect(() => vd.getColor(3, 'color')).to.throw();
    });

    it('should allow to read/write simple attributes', () => {
        const vd = new VertexData('pos1D:float1, pos2D:float2, pos3D:float3, pos4D:float4');
        vd.numVertices = 3;

        vd.setFloat(1, 'pos1D', 0.5);

        expect(vd.getFloat(0, 'pos1D')).to.be.closeTo(0.0, E);
        expect(vd.getFloat(1, 'pos1D')).to.be.closeTo(0.5, E);
        expect(vd.getFloat(2, 'pos1D')).to.be.closeTo(0.0, E);

        const origin = new Point();
        const point = new Point(20, 40);
        vd.setPoint(1, 'pos2D', point.x, point.y);
        Helpers.comparePoints(origin, vd.getPoint(0, 'pos2D'));
        Helpers.comparePoints(point, vd.getPoint(1, 'pos2D'));
        Helpers.comparePoints(origin, vd.getPoint(2, 'pos2D'));

        const origin3D = new Vector3D();
        const vector3D = new Vector3D(1.0, 2.0, 3.0);
        vd.setPoint3D(1, 'pos3D', vector3D.x, vector3D.y, vector3D.z);
        Helpers.compareVector3Ds(origin3D, vd.getPoint3D(0, 'pos3D'));
        Helpers.compareVector3Ds(vector3D, vd.getPoint3D(1, 'pos3D'));
        Helpers.compareVector3Ds(origin3D, vd.getPoint3D(2, 'pos3D'));

        const origin4D = new Vector3D();
        const vector4D = new Vector3D(1.0, 2.0, 3.0, 4.0);
        vd.setPoint4D(1, 'pos4D', vector4D.x, vector4D.y, vector4D.z, vector4D.w);
        Helpers.compareVector3Ds(origin4D, vd.getPoint4D(0, 'pos4D'));
        Helpers.compareVector3Ds(vector4D, vd.getPoint4D(1, 'pos4D'));
        Helpers.compareVector3Ds(origin4D, vd.getPoint4D(2, 'pos4D'));
    });

    it('should allow to set color', () => {
        const vd = new VertexData(STD_FORMAT);
        vd.numVertices = 3;
        vd.premultipliedAlpha = true;

        expect(vd.numVertices).to.equal(3);
        expect(vd.premultipliedAlpha).to.be.true;

        // per default, colors must be white with full alpha
        for (let i = 0; i < 3; ++i) {
            expect(vd.getAlpha(i)).to.equal(1.0);
            expect(vd.getColor(i)).to.equal(0xffffff);
        }

        vd.setColor(0, 'color', 0xffaabb);
        vd.setColor(1, 'color', 0x112233);

        expect(vd.getColor(0, 'color')).to.equal(0xffaabb);
        expect(vd.getColor(1, 'color')).to.equal(0x112233);
        expect(vd.getAlpha(0, 'color')).to.equal(1.0);

        // check premultiplied alpha

        const alpha = 0.8;
        const red = 80;
        const green = 60;
        const blue = 40;
        const rgb = Color.rgb(red, green, blue);

        vd.setColor(2, 'color', rgb);
        vd.setAlpha(2, 'color', alpha);
        expect(vd.getColor(2, 'color')).to.equal(rgb);
        expect(vd.getAlpha(1, 'color')).to.equal(1.0);
        expect(vd.getAlpha(2, 'color')).to.equal(alpha);

        //const data = vd.rawData.color;
        //expect(data[2]).to.equal(Color.rgba(red * alpha, green * alpha, blue * alpha, alpha));

        const data = vd.rawData;
        const offset = (vd.vertexSize * 2 + vd.getOffset('color'));

        let color = data.getUint32(offset);
        expect(color >>> 24).to.equal(red * alpha);
        expect((color >>> 16) & 0x00FF).to.equal(green * alpha);
        expect((color >>> 8) & 0x0000FF).to.equal(blue * alpha);

        // changing the pma setting should update contents

        vd.setPremultipliedAlpha(false, true);
        expect(vd.premultipliedAlpha).to.be.false;

        expect(vd.getColor(0, 'color')).to.equal(0xffaabb);
        expect(vd.getColor(1, 'color')).to.equal(0x112233);
        expect(vd.getAlpha(0, 'color')).to.equal(1.0);

        vd.setColor(2, 'color', rgb);
        vd.setAlpha(2, 'color', alpha);
        expect(vd.getColor(2, 'color')).to.equal(rgb);
        expect(vd.getAlpha(2, 'color')).to.equal(alpha);

        color = data.getUint32(offset);
        expect(color >>> 24).to.equal(red);
        expect((color >>> 16) & 0x00FF).to.equal(green);
        expect((color >>> 8) & 0x0000FF).to.equal(blue);
    });

    it('should allow to scale alpha', () => {
        makeTest(true);
        makeTest(false);

        function makeTest(pma) {
            let i;
            const vd = new VertexData(STD_FORMAT);
            vd.numVertices = 3;
            vd.premultipliedAlpha = pma;
            vd.colorize('color', 0xffffff, 0.9);
            vd.scaleAlphas('color', 0.9);

            for (i = 0; i < 3; ++i) {
                expect(vd.getAlpha(i)).to.be.closeTo(0.81, 0.005);
                expect(vd.getColor(i)).to.equal(0xffffff);
            }
        }
    });

    it('should allow to translate point', () => {
        const vd = new VertexData('pos:float2');
        vd.setPoint(0, 'pos', 10, 20);
        vd.setPoint(1, 'pos', 30, 40);
        vd.translatePoints('pos', 5, 6);
        Helpers.comparePoints(new Point(15, 26), vd.getPoint(0, 'pos'));
        Helpers.comparePoints(new Point(35, 46), vd.getPoint(1, 'pos'));
    });

    it('should return correct bounds', () => {
        const vd = new VertexData('position:float2');
        let bounds = vd.getBounds();
        let expectedBounds = new Rectangle();

        Helpers.compareRectangles(expectedBounds, bounds);

        vd.numVertices = 2;
        vd.setPoint(0, 'position', -10, -5);
        vd.setPoint(1, 'position', 10, 5);

        bounds = vd.getBounds();
        expectedBounds = new Rectangle(-10, -5, 20, 10);

        Helpers.compareRectangles(expectedBounds, bounds);

        const matrix = new Matrix();
        matrix.translate(10, 5);
        bounds = vd.getBounds('position', matrix);
        expectedBounds = new Rectangle(0, 0, 20, 10);

        Helpers.compareRectangles(expectedBounds, bounds);
    });

    it('should return projected bounds', () => {
        const camPos = new Vector3D(0, 0, 10);
        const vd = new VertexData('pos:float2');
        let bounds = vd.getBoundsProjected('pos', null, camPos);
        const expectedBounds = new Rectangle();

        Helpers.compareRectangles(expectedBounds, bounds);

        const matrix3D = new Matrix3D();
        matrix3D.appendTranslation(0, 0, 5);

        vd.numVertices = 3;
        vd.setPoint(0, 'pos', 0, 0);
        vd.setPoint(1, 'pos', 5, 0);
        vd.setPoint(2, 'pos', 0, 5);
        bounds = vd.getBoundsProjected('pos', matrix3D, camPos);
        expectedBounds.setTo(0, 0, 10, 10);

        Helpers.compareRectangles(expectedBounds, bounds);
    });

    it('should allow to clone', () => {
        const vd1 = new VertexData(STD_FORMAT, 2);
        vd1.setPoint(0, 'position', 1, 2);
        vd1.setColor(0, 'color', 0xaabbcc);
        vd1.setPoint(0, 'texCoords', 0.1, 0.2);
        vd1.setPoint(1, 'position', 3, 4);
        vd1.setColor(1, 'color', 0x334455);
        vd1.setPoint(1, 'texCoords', 0.3, 0.4);

        const clone = vd1.clone();
        expect(vd1.numVertices).to.equal(clone.numVertices);
        Helpers.compareDataViews(vd1.rawData, clone.rawData);
    });

    it('should allow to copyTo with same formats', () => {
        const vd1 = new VertexData(STD_FORMAT, 2);
        vd1.setPoint(0, 'position', 1, 2);
        vd1.setColor(0, 'color', 0xaabbcc);
        vd1.setPoint(0, 'texCoords', 0.1, 0.2);
        vd1.setPoint(1, 'position', 3, 4);
        vd1.setColor(1, 'color', 0x334455);
        vd1.setPoint(1, 'texCoords', 0.3, 0.4);

        const vd2 = new VertexData(STD_FORMAT, 2);
        vd1.copyTo(vd2);

        Helpers.compareDataViews(vd1.rawData, vd2.rawData);
        expect(vd1.numVertices).to.equal(vd2.numVertices);

        vd1.copyTo(vd2, 2);
        expect(vd2.numVertices).to.equal(4);

        // Expected:
        // vd1 = [x y u v c x y u v c]
        // vd1 = [x y u v c x y u v c x y u v c x y u v c]

        for (let j = 0; j < 10; ++j) {
            expect(vd1.rawData.getUint32(j)).to.equal(vd2.rawData.getUint32(j));
            expect(vd1.rawData.getUint32(j)).to.equal(vd2.rawData.getUint32(j + 40));
        }
    });

    it('should allow to copyTo with different formats', () => {
        const vd1 = new VertexData(STD_FORMAT);
        vd1.setPoint(0, 'position', 1, 2);
        vd1.setColor(0, 'color', 0xaabbcc);
        vd1.setPoint(0, 'texCoords', 0.1, 0.2);
        vd1.setPoint(1, 'position', 3, 4);
        vd1.setColor(1, 'color', 0x334455);
        vd1.setPoint(1, 'texCoords', 0.3, 0.4);

        const vd2 = new VertexData('texCoords:float2');
        vd1.copyTo(vd2);

        expect(vd2.numVertices).to.equal(2);

        Helpers.comparePoints(vd1.getPoint(0, 'texCoords'), vd2.getPoint(0, 'texCoords'));
        Helpers.comparePoints(vd1.getPoint(1, 'texCoords'), vd2.getPoint(1, 'texCoords'));

        const origin = new Point();
        const vd3 = new VertexData(STD_FORMAT);
        vd2.copyTo(vd3);

        expect(vd3.numVertices).to.equal(2);
        Helpers.comparePoints(vd1.getPoint(0, 'texCoords'), vd3.getPoint(0, 'texCoords'));
        Helpers.comparePoints(vd1.getPoint(1, 'texCoords'), vd3.getPoint(1, 'texCoords'));
        Helpers.comparePoints(origin, vd3.getPoint(0, 'position'));
        Helpers.comparePoints(origin, vd3.getPoint(1, 'position'));
        expect(vd3.getColor(0, 'color')).to.equal(0xffffff);
        expect(vd3.getColor(1, 'color')).to.equal(0xffffff);
        expect(vd3.getAlpha(0, 'color')).to.equal(1.0);
        expect(vd3.getAlpha(1, 'color')).to.equal(1.0);
    });

    it('should allow to copyTo transformed with identical formats', () => {
        const format = 'pos:float2, color:bytes4';
        const vd1 = new VertexData(format);
        vd1.setPoint(0, 'pos', 10, 20);
        vd1.setColor(0, 'color', 0xaabbcc);
        vd1.setPoint(1, 'pos', 30, 40);
        vd1.setColor(1, 'color', 0x334455);

        const matrix = new Matrix();
        matrix.translate(5, 6);

        const vd2 = new VertexData(format);
        vd1.copyTo(vd2, 0, matrix);

        expect(vd2.getColor(0, 'color')).to.equal(0xaabbcc);
        expect(vd2.getColor(1, 'color')).to.equal(0x334455);

        const p1 = new Point(15, 26);
        const p2 = new Point(35, 46);

        Helpers.comparePoints(p1, vd2.getPoint(0, 'pos'));
        Helpers.comparePoints(p2, vd2.getPoint(1, 'pos'));
    });

    it('should allow to copyTo transformed with different formats', () => {
        const format = 'color:bytes4, position:float2';
        const vd1 = new VertexData(format);
        vd1.setPoint(0, 'position', 10, 20);
        vd1.setColor(0, 'color', 0xaabbcc);
        vd1.setPoint(1, 'position', 30, 40);
        vd1.setColor(1, 'color', 0x334455);

        const matrix = new Matrix();
        matrix.translate(5, 6);

        const vd2 = new VertexData('position:float2, flavor:float1');
        vd1.copyTo(vd2, 0, matrix);

        expect(vd2.getFloat(0, 'flavor')).to.equal(0.0);
        expect(vd2.getFloat(1, 'flavor')).to.equal(0.0);

        const p1 = new Point(15, 26);
        const p2 = new Point(35, 46);

        Helpers.comparePoints(p1, vd2.getPoint(0, 'position'));
        Helpers.comparePoints(p2, vd2.getPoint(1, 'position'));
    });

    it('should allow to copyTo a subset to an end of another vertex data', () => {
        const format = 'position:float2';
        const vd1 = new VertexData(format);
        vd1.setPoint(0, 'position', 10, 20);
        vd1.setPoint(1, 'position', 30, 40);
        vd1.setPoint(2, 'position', 40, 50);
        vd1.setPoint(3, 'position', 50, 60);

        const vd2 = new VertexData('position:float2');
        vd2.setPoint(0, 'position', 1, 2);
        vd2.setPoint(1, 'position', 3, 4);

        vd1.copyTo(vd2, 2, null, 2, 2);

        Helpers.comparePoints(new Point(40, 50), vd2.getPoint(2, 'position'));
        Helpers.comparePoints(new Point(50, 60), vd2.getPoint(3, 'position'));
    });

    it('should allow to transform points', () => {
        const vd = new VertexData(STD_FORMAT);
        vd.setPoint(0, 'position', 10, 20);
        vd.setPoint(1, 'position', 30, 40);

        const matrix = new Matrix();
        matrix.translate(5, 6);

        const position = new Point();
        vd.transformPoints('position', matrix, 0, 1);
        vd.getPoint(0, 'position', position);
        Helpers.comparePoints(position, new Point(15, 26));
        vd.getPoint(1, 'position', position);
        Helpers.comparePoints(position, new Point(30, 40));

        matrix.identity();
        matrix.scale(0.5, 0.25);
        vd.transformPoints('position', matrix, 1, 1);
        vd.getPoint(0, 'position', position);
        Helpers.comparePoints(position, new Point(15, 26));
        vd.getPoint(1, 'position', position);
        Helpers.comparePoints(position, new Point(15, 10));
    });

    it('should allow to tint it', () => {
        const vd = new VertexData(STD_FORMAT);
        expect(vd.tinted).to.be.false;

        vd.numVertices = 1;
        expect(vd.getAlpha(0)).to.equal(1.0);
        expect(vd.getColor(0)).to.equal(0xffffff);
        expect(vd.tinted).to.be.false;

        vd.setColor(0, 'color', 0xff0000);
        expect(vd.tinted).to.be.true;

        vd.colorize();
        expect(vd.tinted).to.be.false;

        vd.setAlpha(0, 'color', 0.5);
        expect(vd.tinted).to.be.true;

        vd.colorize();
        expect(vd.tinted).to.be.false;

        const vd2 = new VertexData(STD_FORMAT);
        vd2.numVertices = 1;
        vd2.colorize('color', 0xff00ff, 0.8);
        expect(vd2.tinted).to.be.true;

        vd2.copyTo(vd, 1);
        expect(vd.numVertices).to.equal(2);
        expect(vd.tinted).to.be.true;

        vd.colorize();
        expect(vd.tinted).to.be.false;

        vd.scaleAlphas('color', 0.5);
        expect(vd.tinted).to.be.true;
    });

    it('should allow to changer format', () => {
        const vd = new VertexData(STD_FORMAT);
        const p0 = new Point(10, 20);
        const p1 = new Point(30, 40);
        vd.setPoint(0, 'position', p0.x, p0.y);
        vd.setPoint(1, 'position', p1.x, p1.y);

        vd.format = VertexDataFormat.fromString('newCoords:float2, position:float2, newColor:bytes4');

        Helpers.comparePoints(p0, vd.getPoint(0, 'position'));
        Helpers.comparePoints(p1, vd.getPoint(1, 'position'));
        Helpers.comparePoints(new Point(), vd.getPoint(0, 'newCoords'));
        Helpers.comparePoints(new Point(), vd.getPoint(1, 'newCoords'));
        expect(vd.getColor(0, 'newColor')).to.equal(0xffffff);
        expect(vd.getColor(1, 'newColor')).to.equal(0xffffff);
        expect(vd.getAlpha(0, 'newColor')).to.equal(1.0);
        expect(vd.getAlpha(1, 'newColor')).to.equal(1.0);
    });
});
