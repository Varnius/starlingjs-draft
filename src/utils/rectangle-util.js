import Rectangle from '../math/rectangle';
import Point from '../math/point';
import MathUtil from './math-util';
import Vector3D from '../math/vector3d';

import MatrixUtil from './matrix-util';
import ScaleMode from './scale-mode';

/** A utility class containing methods related to the Rectangle class. */
export default class RectangleUtil {
    // helper objects
    static sPoint = new Point();
    static sPoint3D = new Vector3D();
    static sPositions = [new Point(), new Point(), new Point(), new Point()];

    /** Calculates the intersection between two Rectangles. If the rectangles do not intersect,
     *  this method returns an empty Rectangle object with its properties set to 0. */
    static intersect(rect1, rect2, out = null)
    {
        if (out === null) out = new Rectangle();

        const left = rect1.x > rect2.x ? rect1.x : rect2.x;
        const right = rect1.right < rect2.right ? rect1.right : rect2.right;
        const top = rect1.y > rect2.y ? rect1.y : rect2.y;
        const bottom = rect1.bottom < rect2.bottom ? rect1.bottom : rect2.bottom;

        if (left > right || top > bottom)
            out.setEmpty();
        else
            out.setTo(left, top, right - left, bottom - top);

        return out;
    }

    /** Calculates a rectangle with the same aspect ratio as the given 'rectangle',
     *  centered within 'into'.
     *
     *  <p>This method is useful for calculating the optimal viewPort for a certain display
     *  size. You can use different scale modes to specify how the result should be calculated;
     *  furthermore, you can avoid pixel alignment errors by only allowing whole-number
     *  multipliers/divisors (e.g. 3, 2, 1, 1/2, 1/3).</p>
     *
     *  @see starling.utils.ScaleMode
     */
    static fit(rectangle, into, scaleMode = 'showAll', pixelPerfect = false, out = null)
    {
        if (!ScaleMode.isValid(scaleMode)) throw new Error('[ArgumentError] Invalid scaleMode: ' + scaleMode);
        if (out === null) out = new Rectangle();

        let width = rectangle.width;
        let height = rectangle.height;
        const factorX = into.width / width;
        const factorY = into.height / height;
        let factor = 1.0;

        if (scaleMode === ScaleMode.SHOW_ALL)
        {
            factor = factorX < factorY ? factorX : factorY;
            if (pixelPerfect) factor = RectangleUtil.nextSuitableScaleFactor(factor, false);
        }
        else if (scaleMode === ScaleMode.NO_BORDER)
        {
            factor = factorX > factorY ? factorX : factorY;
            if (pixelPerfect) factor = RectangleUtil.nextSuitableScaleFactor(factor, true);
        }

        width *= factor;
        height *= factor;

        out.setTo(
            into.x + (into.width - width) / 2,
            into.y + (into.height - height) / 2,
            width, height);

        return out;
    }

    /** Calculates the next whole-number multiplier or divisor, moving either up or down. */
    static nextSuitableScaleFactor(factor, up)
    {
        let divisor = 1.0;

        if (up)
        {
            if (factor >= 0.5) return Math.ceil(factor);

            while (1.0 / (divisor + 1) > factor)
                ++divisor;
        }
        else
        {
            if (factor >= 1.0) return Math.floor(factor);

            while (1.0 / divisor > factor)
                ++divisor;
        }

        return 1.0 / divisor;
    }

    /** If the rectangle contains negative values for width or height, all coordinates
     *  are adjusted so that the rectangle describes the same region with positive values. */
    static normalize(rect)
    {
        if (rect.width < 0)
        {
            rect.width = -rect.width;
            rect.x -= rect.width;
        }

        if (rect.height < 0)
        {
            rect.height = -rect.height;
            rect.y -= rect.height;
        }
    }

    /** Extends the bounds of the rectangle in all four directions. */
    static extend(rect, left = 0, right = 0,
                  top = 0, bottom = 0)
    {
        rect.x -= left;
        rect.y -= top;
        rect.width += left + right;
        rect.height += top + bottom;
    }

    /** Calculates the bounds of a rectangle after transforming it by a matrix.
     *  If you pass an <code>out</code>-rectangle, the result will be stored in this rectangle
     *  instead of creating a new object. */
    static getBounds(rectangle, matrix, out = null)
    {
        if (out === null) out = new Rectangle();

        let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
        const positions = RectangleUtil.getPositions(rectangle, RectangleUtil.sPositions);

        for (let i = 0; i < 4; ++i)
        {
            MatrixUtil.transformCoords(matrix, positions[i].x, positions[i].y, RectangleUtil.sPoint);

            if (minX > RectangleUtil.sPoint.x) minX = RectangleUtil.sPoint.x;
            if (maxX < RectangleUtil.sPoint.x) maxX = RectangleUtil.sPoint.x;
            if (minY > RectangleUtil.sPoint.y) minY = RectangleUtil.sPoint.y;
            if (maxY < RectangleUtil.sPoint.y) maxY = RectangleUtil.sPoint.y;
        }

        out.setTo(minX, minY, maxX - minX, maxY - minY);
        return out;
    }

    /** Calculates the bounds of a rectangle projected into the XY-plane of a certain 3D space
     *  as they appear from the given camera position. Note that 'camPos' is expected in the
     *  target coordinate system (the same that the XY-plane lies in).
     *
     *  <p>If you pass an 'out' Rectangle, the result will be stored in this rectangle
     *  instead of creating a new object.</p> */
    static getBoundsProjected(rectangle, matrix, camPos, out = null)
    {
        if (out === null) out = new Rectangle();
        if (camPos === null) throw new Error('[ArgumentError] camPos must not be null');

        let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
        const positions = RectangleUtil.getPositions(rectangle, RectangleUtil.sPositions);

        for (let i = 0; i < 4; ++i)
        {
            const position = positions[i];

            if (matrix)
                MatrixUtil.transformCoords3D(matrix, position.x, position.y, 0, RectangleUtil.RectangleUtil.sPoint3D);
            else
                RectangleUtil.RectangleUtil.sPoint3D.setTo(position.x, position.y, 0);

            MathUtil.intersectLineWithXYPlane(camPos, RectangleUtil.RectangleUtil.sPoint3D, RectangleUtil.sPoint);

            if (minX > RectangleUtil.sPoint.x) minX = RectangleUtil.sPoint.x;
            if (maxX < RectangleUtil.sPoint.x) maxX = RectangleUtil.sPoint.x;
            if (minY > RectangleUtil.sPoint.y) minY = RectangleUtil.sPoint.y;
            if (maxY < RectangleUtil.sPoint.y) maxY = RectangleUtil.sPoint.y;
        }

        out.setTo(minX, minY, maxX - minX, maxY - minY);
        return out;
    }

    /** Returns a vector containing the positions of the four edges of the given rectangle. */
    static getPositions(rectangle, out = null)
    {
        if (out === null) out = []; // length 4

        for (let i = 0; i < 4; ++i)
            if (out[i] === null) out[i] = new Point();

        out[0].x = rectangle.left;
        out[0].y = rectangle.top;
        out[1].x = rectangle.right;
        out[1].y = rectangle.top;
        out[2].x = rectangle.left;
        out[2].y = rectangle.bottom;
        out[3].x = rectangle.right;
        out[3].y = rectangle.bottom;
        return out;
    }

    /** Compares all properties of the given rectangle, returning true only if
     *  they are equal (with the given accuracy 'e'). */
    static compare(r1, r2, e = 0.0001)
    {
        if (r1 === null) return r2 === null;
        else if (r2 === null) return false;

        return r1.x > r2.x - e && r1.x < r2.x + e &&
            r1.y > r2.y - e && r1.y < r2.y + e &&
            r1.width > r2.width - e && r1.width < r2.width + e &&
            r1.height > r2.height - e && r1.height < r2.height + e;
    }
}
