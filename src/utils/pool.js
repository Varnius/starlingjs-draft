import Point from '../math/point';
import Rectangle from '../math/rectangle';
import Vector3D from '../math/vector3d';
import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';

/** A simple object pool supporting the most basic utility objects.
 *
 *  <p>If you want to retrieve an object, but the pool does not contain any more instances,
 *  it will silently create a new one.</p>
 *
 *  <p>It's important that you use the pool in a balanced way, i.e. don't just "get" or "put"
 *  alone! Always make the calls in pairs; whenever you get an object, be sure to put it back
 *  later, and the other way round. Otherwise, the pool will empty or (even worse) grow
 *  in size uncontrolled.</p>
 */
export default class Pool {
    static sPoints = [];
    static sPoints3D = [];
    static sMatrices = [];
    static sMatrices3D = [];
    static sRectangles = [];

    /** Retrieves a Point instance from the pool. */
    static getPoint(x = 0, y = 0)
    {
        if (Pool.sPoints.length === 0) return new Point(x, y);
        else
        {
            const point = Pool.sPoints.pop();
            point.x = x;
            point.y = y;
            return point;
        }
    }

    /** Stores a Point instance in the pool.
     *  Don't keep any references to the object after moving it to the pool! */
    static putPoint(point)
    {
        if (point) Pool.sPoints[Pool.sPoints.length] = point;
    }

    /** Retrieves a Vector3D instance from the pool. */
    static getPoint3D(x = 0, y = 0, z = 0)
    {
        if (Pool.sPoints3D.length === 0) return new Vector3D(x, y, z);
        else
        {
            const point = Pool.sPoints3D.pop();
            point.x = x;
            point.y = y;
            point.z = z;
            return point;
        }
    }

    /** Stores a Vector3D instance in the pool.
     *  Don't keep any references to the object after moving it to the pool! */
    static putPoint3D(point)
    {
        if (point) Pool.sPoints3D[Pool.sPoints3D.length] = point;
    }

    /** Retrieves a Matrix instance from the pool. */
    static getMatrix(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0)
    {
        if (Pool.sMatrices.length === 0) return new Matrix(a, b, c, d, tx, ty);
        else
        {
            const matrix = Pool.sMatrices.pop();
            matrix.setTo(a, b, c, d, tx, ty);
            return matrix;
        }
    }

    /** Stores a Matrix instance in the pool.
     *  Don't keep any references to the object after moving it to the pool! */
    static putMatrix(matrix)
    {
        if (matrix) Pool.sMatrices[Pool.sMatrices.length] = matrix;
    }

    /** Retrieves a Matrix3D instance from the pool.
     *
     *  @param identity   If enabled, the matrix will be reset to the identity.
     *                    Otherwise, its contents is undefined.
     */
    static getMatrix3D(identity = true)
    {
        if (Pool.sMatrices3D.length === 0) return new Matrix3D();
        else
        {
            const matrix = Pool.sMatrices3D.pop();
            if (identity) matrix.identity();
            return matrix;
        }
    }

    /** Stores a Matrix3D instance in the pool.
     *  Don't keep any references to the object after moving it to the pool! */
    static putMatrix3D(matrix)
    {
        if (matrix) Pool.sMatrices3D[Pool.sMatrices3D.length] = matrix;
    }

    /** Retrieves a Rectangle instance from the pool. */
    static getRectangle(x = 0, y = 0, width = 0, height = 0)
    {
        if (Pool.sRectangles.length === 0) return new Rectangle(x, y, width, height);
        else
        {
            const rectangle = Pool.sRectangles.pop();
            rectangle.setTo(x, y, width, height);
            return rectangle;
        }
    }

    /** Stores a Rectangle instance in the pool.
     *  Don't keep any references to the object after moving it to the pool! */
    static putRectangle(rectangle)
    {
        if (rectangle) Pool.sRectangles[Pool.sRectangles.length] = rectangle;
    }
}
