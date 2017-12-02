import MathUtil from './math-util';
import Pool from './pool';

import Vector3D from '../math/vector3d';
import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';
import Rectangle from '../math/rectangle';

/** A utility class that helps with tasks that are common when working with meshes. */
export default class MeshUtil {
    // helper objects
    static sPoint3D = new Vector3D();
    static sMatrix = new Matrix();
    static sMatrix3D = new Matrix3D();

    /** Determines if a point is inside a mesh that is spawned up by the given
     *  vertex- and index-data. */
    static containsPoint(vertexData, indexData, point)
    {
        let i;
        let result = false;
        const numIndices = indexData.numIndices;
        const p0 = Pool.getPoint();
        const p1 = Pool.getPoint();
        const p2 = Pool.getPoint();

        for (i = 0; i < numIndices; i += 3)
        {
            vertexData.getPoint(indexData.getIndex(i), 'position', p0);
            vertexData.getPoint(indexData.getIndex(i + 1), 'position', p1);
            vertexData.getPoint(indexData.getIndex(i + 2), 'position', p2);

            if (MathUtil.isPointInTriangle(point, p0, p1, p2))
            {
                result = true;
                break;
            }
        }

        Pool.putPoint(p0);
        Pool.putPoint(p1);
        Pool.putPoint(p2);

        return result;
    }

    /** Calculates the bounds of the given vertices in the target coordinate system. */
    static calculateBounds(vertexData, sourceSpace, targetSpace, out = null)
    {
        if (!out) out = new Rectangle();

        const { sPoint3D, sMatrix3D, sMatrix } = MeshUtil;
        const stage = sourceSpace.stage;

        if (sourceSpace.is3D && stage)
        {
            stage.getCameraPosition(targetSpace, sPoint3D);
            sourceSpace.getTransformationMatrix3D(targetSpace, sMatrix3D);
            vertexData.getBoundsProjected('position', sMatrix3D, sPoint3D, 0, -1, out);
        }
        else
        {
            sourceSpace.getTransformationMatrix(targetSpace, sMatrix);
            vertexData.getBounds('position', sMatrix, 0, -1, out);
        }

        return out;
    }
}
