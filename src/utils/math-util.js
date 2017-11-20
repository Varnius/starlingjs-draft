import Point from '../math/point';

/** A utility class containing methods you might need for math problems. */
export default class MathUtil {
    static TWO_PI = Math.PI * 2.0;

    /** Calculates the intersection point between the xy-plane and an infinite line
     *  that is defined by two 3D points in the same coordinate system. */
    static intersectLineWithXYPlane(pointA, pointB, out = null)
    {
        if (!out) out = new Point();

        const vectorX = pointB.x - pointA.x;
        const vectorY = pointB.y - pointA.y;
        const vectorZ = pointB.z - pointA.z;
        const lambda = -pointA.z / vectorZ;

        out.x = pointA.x + lambda * vectorX;
        out.y = pointA.y + lambda * vectorY;

        return out;
    }

    /** Calculates if the point <code>p</code> is inside the triangle <code>a-b-c</code>. */
    static isPointInTriangle(p, a, b, c)
    {
        // This algorithm is described well in this article:
        // http://www.blackpawn.com/texts/pointinpoly/default.html

        const v0x = c.x - a.x;
        const v0y = c.y - a.y;
        const v1x = b.x - a.x;
        const v1y = b.y - a.y;
        const v2x = p.x - a.x;
        const v2y = p.y - a.y;

        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        const invDen = 1.0 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDen;
        const v = (dot00 * dot12 - dot01 * dot02) * invDen;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    /** Moves a radian angle into the range [-PI, +PI], while keeping the direction intact. */
    static normalizeAngle(angle)
    {
        // move to equivalent value in range [0 deg, 360 deg] without a loop
        angle %= MathUtil.TWO_PI;

        // move to [-180 deg, +180 deg]
        if (angle < -Math.PI) angle += MathUtil.TWO_PI;
        if (angle > Math.PI) angle -= MathUtil.TWO_PI;

        return angle;
    }

    /** Returns the next power of two that is equal to or bigger than the specified number. */
    static getNextPowerOfTwo(number)
    {
        // if (number is int && number > 0 && (number & (number - 1)) == 0) todo: original line, is type check necessary?
        if (number > 0 && (number & (number - 1)) === 0) // see: http://goo.gl/D9kPj
            return number;

        let result = 1;
        number -= 0.000000001; // avoid floating point rounding errors

        while (result < number) result <<= 1;
        return result;
    }

    /** Indicates if two float (Number) values are equal, give or take <code>epsilon</code>. */
    static isEquivalent(a, b, epsilon = 0.0001)
    {
        return (a - epsilon < b) && (a + epsilon > b);
    }

    /** Returns the larger of the two values. Different to the native <code>Math.max</code>,
     *  this doesn't create any temporary objects when using the AOT compiler. */
    static max(a, b)
    {
        return a > b ? a : b;
    }

    /** Returns the smaller of the two values. Different to the native <code>Math.min</code>,
     *  this doesn't create any temporary objects when using the AOT compiler. */
    static min(a, b)
    {
        return a < b ? a : b;
    }

    /** Moves <code>value</code> into the range between <code>min</code> and <code>max</code>. */
    static clamp(value, min, max)
    {
        return value < min ? min : (value > max ? max : value);
    }
}
