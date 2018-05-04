import VertexData from '../rendering/vertex-data';
import IndexData from '../rendering/index-data';
import DisplayObjectContainer from './display-object-container';
import Mesh from './mesh';
import Polygon from '../geom/polygon';

/** A display object supporting basic vector drawing functionality. In its current state,
 *  the main use of this class is to provide a range of forms that can be used as masks.
 */
export default class Canvas extends DisplayObjectContainer {
    _polygons;
    _fillColor;
    _fillAlpha;

    /** Creates a new (empty) Canvas. Call one or more of the 'draw' methods to add content. */
    constructor() {
        super();
        this._polygons = [];
        this._fillColor = 0xffffff;
        this._fillAlpha = 1.0;
        this.touchGroup = true;
    }

    /** @inheritDoc */
    dispose() {
        this._polygons.length = 0;
        super.dispose();
    }

    /** @inheritDoc */
    hitTest(localPoint) {
        if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;

        // we could also use the standard hit test implementation, but the polygon class can
        // do that much more efficiently (it contains custom implementations for circles, etc).

        for (let i = 0, len = this._polygons.length; i < len; ++i)
            if (this._polygons[i].containsPoint(localPoint)) return this;

        return null;
    }

    /** Draws a circle. */
    drawCircle(x, y, radius) {
        this.appendPolygon(Polygon.createCircle(x, y, radius));
    }

    /** Draws an ellipse. */
    drawEllipse(x, y, width, height) {
        const radiusX = width / 2.0;
        const radiusY = height / 2.0;

        this.appendPolygon(Polygon.createEllipse(x + radiusX, y + radiusY, radiusX, radiusY));
    }

    /** Draws a rectangle. */
    drawRectangle(x, y, width, height) {
        this.appendPolygon(Polygon.createRectangle(x, y, width, height));
    }

    /** Draws an arbitrary polygon. */
    drawPolygon(polygon) {
        this.appendPolygon(polygon);
    }

    /** Specifies a simple one-color fill that subsequent calls to drawing methods
     *  (such as <code>drawCircle()</code>) will use. */
    beginFill(color = 0xffffff, alpha = 1.0) {
        this._fillColor = color;
        this._fillAlpha = alpha;
    }

    /** Resets the color to 'white' and alpha to '1'. */
    endFill() {
        this._fillColor = 0xffffff;
        this._fillAlpha = 1.0;
    }

    /** Removes all existing vertices. */
    clear() {
        this.removeChildren(0, -1, true);
        this._polygons.length = 0;
    }

    appendPolygon(polygon) {
        const vertexData = new VertexData();
        const indexData = new IndexData(polygon.numTriangles * 3);

        polygon.triangulate(indexData);
        polygon.copyToVertexData(vertexData);

        vertexData.colorize('color', this._fillColor, this._fillAlpha);

        this.addChild(new Mesh(vertexData, indexData));
        this._polygons[this._polygons.length] = polygon;
    }
}
