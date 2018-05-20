import Matrix from '../math/matrix';
import Matrix3D from '../math/matrix3d';
import Point from '../math/point';
import Vector3D from '../math/vector3d';

/** A utility class containing methods related to the Matrix class. */
export default class MatrixUtil {
    // helper objects
    static sRawData = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    static sRawData2 = []; // fixed length of 16
    static sPoint3D = new Vector3D();
    static sMatrixData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    /** Converts a 2D matrix to a 3D matrix. If you pass an <code>out</code>-matrix,
     *  the result will be stored in this matrix instead of creating a new object. */
    static convertTo3D(matrix, out = null) {
        if (!out) out = new Matrix3D();
        const { sRawData } = MatrixUtil;

        sRawData[0] = matrix.a;
        sRawData[1] = matrix.b;
        sRawData[4] = matrix.c;
        sRawData[5] = matrix.d;
        sRawData[12] = matrix.tx;
        sRawData[13] = matrix.ty;

        out.copyRawDataFrom(sRawData);
        return out;
    }

    /** Converts a 3D matrix to a 2D matrix. Beware that this will work only for a 3D matrix
     *  describing a pure 2D transformation. */
    static convertTo2D(matrix3D, out = null) {
        if (!out) out = new Matrix();
        const { sRawData2 } = MatrixUtil;

        matrix3D.copyRawDataTo(sRawData2);
        out.a = sRawData2[0];
        out.b = sRawData2[1];
        out.c = sRawData2[4];
        out.d = sRawData2[5];
        out.tx = sRawData2[12];
        out.ty = sRawData2[13];

        return out;
    }

    /** Determines if the matrix is an identity matrix. */
    static isIdentity(matrix) {
        return matrix.a === 1.0 && matrix.b === 0.0 && matrix.c === 0.0 && matrix.d === 1.0 &&
            matrix.tx === 0.0 && matrix.ty === 0.0;
    }

    /** Determines if the 3D matrix is an identity matrix. */
    static isIdentity3D(matrix) {
        const data = MatrixUtil.sRawData2;
        matrix.copyRawDataTo(data);

        return data[0] === 1.0 && data[1] === 0.0 && data[2] === 0.0 && data[3] === 0.0 &&
            data[4] === 0.0 && data[5] === 1.0 && data[6] === 0.0 && data[7] === 0.0 &&
            data[8] === 0.0 && data[9] === 0.0 && data[10] === 1.0 && data[11] === 0.0 &&
            data[12] === 0.0 && data[13] === 0.0 && data[14] === 0.0 && data[15] === 1.0;
    }

    /** Transform a point with the given matrix. */
    static transformPoint(matrix, point,
                          out = null) {
        return MatrixUtil.transformCoords(matrix, point.x, point.y, out);
    }

    /** Transforms a 3D point with the given matrix. */
    static transformPoint3D(matrix, point,
                            out = null) {
        return MatrixUtil.transformCoords3D(matrix, point.x, point.y, point.z, out);
    }

    /** Uses a matrix to transform 2D coordinates into a different space. If you pass an
     *  <code>out</code>-point, the result will be stored in this point instead of creating
     *  a new object. */
    static transformCoords(matrix, x, y, out = null) {
        if (!out) out = new Point();

        out.x = matrix.a * x + matrix.c * y + matrix.tx;
        out.y = matrix.d * y + matrix.b * x + matrix.ty;

        return out;
    }

    /** Uses a matrix to transform 3D coordinates into a different space. If you pass a
     *  'resultVector', the result will be stored in this vector3D instead of creating a
     *  new object. */
    static transformCoords3D(matrix, x, y, z, out = null) {
        if (!out) out = new Vector3D();
        const { sRawData2 } = MatrixUtil;

        matrix.copyRawDataTo(sRawData2);

        out.x = x * sRawData2[0] + y * sRawData2[4] + z * sRawData2[8] + sRawData2[12];
        out.y = x * sRawData2[1] + y * sRawData2[5] + z * sRawData2[9] + sRawData2[13];
        out.z = x * sRawData2[2] + y * sRawData2[6] + z * sRawData2[10] + sRawData2[14];
        out.w = x * sRawData2[3] + y * sRawData2[7] + z * sRawData2[11] + sRawData2[15];

        return out;
    }

    /** Appends a skew transformation to a matrix (angles in radians). The skew matrix
     *  has the following form:
     *  <pre>
     *  | cos(skewY)  -sin(skewX)  0 |
     *  | sin(skewY)   cos(skewX)  0 |
     *  |     0            0       1 |
     *  </pre>
     */
    static skew(matrix, skewX, skewY) {
        const sinX = Math.sin(skewX);
        const cosX = Math.cos(skewX);
        const sinY = Math.sin(skewY);
        const cosY = Math.cos(skewY);

        matrix.setTo(matrix.a * cosY - matrix.b * sinX,
            matrix.a * sinY + matrix.b * cosX,
            matrix.c * cosY - matrix.d * sinX,
            matrix.c * sinY + matrix.d * cosX,
            matrix.tx * cosY - matrix.ty * sinX,
            matrix.tx * sinY + matrix.ty * cosX);
    }

    /** Prepends a matrix to 'base' by multiplying it with another matrix. */
    static prependMatrix(base, prep) {
        base.setTo(
            base.a * prep.a + base.c * prep.b,
            base.b * prep.a + base.d * prep.b,
            base.a * prep.c + base.c * prep.d,
            base.b * prep.c + base.d * prep.d,
            base.tx + base.a * prep.tx + base.c * prep.ty,
            base.ty + base.b * prep.tx + base.d * prep.ty
        );
    }

    /** Prepends an incremental translation to a Matrix object. */
    static prependTranslation(matrix, tx, ty) {
        matrix.tx += matrix.a * tx + matrix.c * ty;
        matrix.ty += matrix.b * tx + matrix.d * ty;
    }

    /** Prepends an incremental scale change to a Matrix object. */
    static prependScale(matrix, sx, sy) {
        matrix.setTo(matrix.a * sx, matrix.b * sx,
            matrix.c * sy, matrix.d * sy,
            matrix.tx, matrix.ty);
    }

    /** Prepends an incremental rotation to a Matrix object (angle in radians). */
    static prependRotation(matrix, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        matrix.setTo(matrix.a * cos + matrix.c * sin, matrix.b * cos + matrix.d * sin,
            matrix.c * cos - matrix.a * sin, matrix.d * cos - matrix.b * sin,
            matrix.tx, matrix.ty);
    }

    /** Prepends a skew transformation to a Matrix object (angles in radians). The skew matrix
     *  has the following form:
     *  <pre>
     *  | cos(skewY)  -sin(skewX)  0 |
     *  | sin(skewY)   cos(skewX)  0 |
     *  |     0            0       1 |
     *  </pre>
     */
    static prependSkew(matrix, skewX, skewY) {
        const sinX = Math.sin(skewX);
        const cosX = Math.cos(skewX);
        const sinY = Math.sin(skewY);
        const cosY = Math.cos(skewY);

        matrix.setTo(matrix.a * cosY + matrix.c * sinY,
            matrix.b * cosY + matrix.d * sinY,
            matrix.c * cosX - matrix.a * sinX,
            matrix.d * cosX - matrix.b * sinX,
            matrix.tx, matrix.ty);
    }

    /** Converts a Matrix3D instance to a String, which is useful when debugging. Per default,
     *  the raw data is displayed transposed, so that the columns are displayed vertically. */
    static toString3D(matrix, transpose = true, precision = 3) {
        if (transpose) matrix.transpose();
        matrix.copyRawDataTo(MatrixUtil.sRawData2);
        if (transpose) matrix.transpose();

        return '[Matrix3D rawData=\n' + MatrixUtil.formatRawData(MatrixUtil.sRawData2, 4, 4, precision) + '\n]';
    }

    /** Converts a Matrix instance to a String, which is useful when debugging. */
    static toString(matrix, precision = 3) {
        const { sRawData2 } = MatrixUtil;
        sRawData2[0] = matrix.a;
        sRawData2[1] = matrix.c;
        sRawData2[2] = matrix.tx;
        sRawData2[3] = matrix.b;
        sRawData2[4] = matrix.d;
        sRawData2[5] = matrix.ty;

        return '[Matrix rawData=\n' + this.formatRawData(sRawData2, 3, 2, precision) + '\n]';
    }

    static formatRawData(data, numCols, numRows, precision, indent = '  ') {
        let result = indent;
        const numValues = numCols * numRows;
        let highestValue = 0.0;
        let valueString;
        let value;

        for (let i = 0; i < numValues; ++i) {
            value = Math.abs(data[i]);
            if (value > highestValue) highestValue = value;
        }

        const numChars = highestValue.toFixed(precision).length + 1;

        for (let y = 0; y < numRows; ++y) {
            for (let x = 0; x < numCols; ++x) {
                value = data[numCols * y + x];
                valueString = value.toFixed(precision);

                while (valueString.length < numChars) valueString = ' ' + valueString;

                result += valueString;
                if (x !== numCols - 1) result += ', ';
            }

            if (y !== numRows - 1) result += '\n' + indent;
        }

        return result;
    }

    /** Updates the given matrix so that it points exactly to pixel boundaries. This works
     *  only if the object is unscaled and rotated by a multiple of 90 degrees.
     *
     *  @param matrix    The matrix to manipulate in place (normally the modelview matrix).
     *  @param pixelSize The size (in points) that represents one pixel in the back buffer.
     */
    static snapToPixels(matrix, pixelSize) {
        // Snapping only makes sense if the object is unscaled and rotated only by
        // multiples of 90 degrees. If that's the case can be found out by looking
        // at the modelview matrix.

        const E = 0.0001;

        let doSnap = false;
        let aSq, bSq, cSq, dSq;

        if (matrix.b + E > 0 && matrix.b - E < 0 && matrix.c + E > 0 && matrix.c - E < 0) {
            // what we actually want is 'Math.abs(matrix.a)', but squaring
            // the value works just as well for our needs & is faster.

            aSq = matrix.a * matrix.a;
            dSq = matrix.d * matrix.d;
            doSnap = aSq + E > 1 && aSq - E < 1 && dSq + E > 1 && dSq - E < 1;
        }
        else if (matrix.a + E > 0 && matrix.a - E < 0 && matrix.d + E > 0 && matrix.d - E < 0) {
            bSq = matrix.b * matrix.b;
            cSq = matrix.c * matrix.c;
            doSnap = bSq + E > 1 && bSq - E < 1 && cSq + E > 1 && cSq - E < 1;
        }

        if (doSnap) {
            matrix.tx = Math.round(matrix.tx / pixelSize) * pixelSize;
            matrix.ty = Math.round(matrix.ty / pixelSize) * pixelSize;
        }
    }

    /** Creates a perspective projection matrix suitable for 2D and 3D rendering.
     *
     *  <p>The first 4 parameters define which area of the stage you want to view (the camera
     *  will 'zoom' to exactly this region). The final 3 parameters determine the perspective
     *  in which you're looking at the stage.</p>
     *
     *  <p>The stage is always on the rectangle that is spawned up between x- and y-axis (with
     *  the given size). All objects that are exactly on that rectangle (z equals zero) will be
     *  rendered in their true size, without any distortion.</p>
     *
     *  <p>If you pass only the first 4 parameters, the camera will be set up above the center
     *  of the stage, with a field of view of 1.0 rad.</p>
     */
    static createPerspectiveProjectionMatrix(x, y, width, height, stageWidth = 0, stageHeight = 0, cameraPos = null, out = null) {
        const { sPoint3D, sMatrixData } = MatrixUtil;
        if (!out) out = new Matrix3D();
        if (stageWidth <= 0) stageWidth = width;
        if (stageHeight <= 0) stageHeight = height;

        if (!cameraPos) {
            cameraPos = sPoint3D;
            cameraPos.setTo(
                stageWidth / 2,
                stageHeight / 2,   // -> center of stage
                stageWidth / Math.tan(0.5) * 0.5); // -> fieldOfView = 1.0 rad
        }

        const focalLength = Math.abs(cameraPos.z / (width / height)); // camera distance from drawing plane with correction for aspect ratio
        const offsetX = cameraPos.x - stageWidth / 2;
        const offsetY = cameraPos.y - stageHeight / 2;
        const far = focalLength * 20;
        const near = 1;

        // todo ???
        //const scaleX = stageWidth / width;
        //const scaleY = stageHeight / height;

        const f = 1 / Math.tan(0.5);
        const aspect = width / height;
        const r = (x + width) / stageWidth * 2 - 1;
        const l = x / stageWidth * 2 - 1;
        const t = -(y / stageHeight * 2 - 1);
        const b = -((y + height) / stageHeight * 2 - 1);

        sMatrixData[0] = f / aspect;
        sMatrixData[5] = -f;
        sMatrixData[10] = -(far + near) / (near - far);

        sMatrixData[14] = -2 * far * near / (near - far);
        sMatrixData[11] = -1;

        sMatrixData[8] = (r + l) / (r - l);
        sMatrixData[9] = (t + b) / (t - b);

        out.copyRawDataFrom(sMatrixData);
        out.prependTranslation(
            -stageWidth / 2.0 - offsetX,
            -stageHeight / 2.0 - offsetY,
            -focalLength * (width / stageWidth)); // Stage3D z = [0, 1], WebGL z = [-1, 1] todo - added * (width / stageWidth)

        return out;
    }

    /** Creates a orthographic projection matrix suitable for 2D rendering. */
    static createOrthographicProjectionMatrix(x, y, width, height, out = null) {
        if (!out) out = new Matrix();

        out.setTo(2.0 / width, 0, 0, -2.0 / height, -(2 * x + width) / width, (2 * y + height) / height);

        return out;
    }
}
