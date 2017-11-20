import Point from './point';
import Rectangle from './rectangle';

export default class Matrix3D {

    _data = [];

    constructor(v = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]) // todo: is gut?
    {
        const le = v.length;
        for (let i = 0; i < le; ++i)
        {
            this._data[i] = v[i];
        }
    }

    clone()
    {
        const data = [];
        const le = this._data.length;

        for (let i = 0; i < le; ++i)
        {
            data[i] = this._data[i];
        }

        return new Matrix3D(data);
    }

    get data()
    {
        return this._data;
    }

    get m00()
    {
        return this._data[0];
    }

    get m10()
    {
        return this._data[1];
    }

    get m20()
    {
        return this._data[2];
    }

    get m30()
    {
        return this._data[3];
    }

    get m01()
    {
        return this._data[4];
    }

    get m11()
    {
        return this._data[5];
    }

    get m21()
    {
        return this._data[6];
    }

    get m31()
    {
        return this._data[7];
    }

    get m02()
    {
        return this._data[8];
    }

    get m12()
    {
        return this._data[9];
    }

    get m22()
    {
        return this._data[10];
    }

    get m32()
    {
        return this._data[11];
    }

    get m03()
    {
        return this._data[12];
    }

    get m13()
    {
        return this._data[13];
    }

    get m23()
    {
        return this._data[14];
    }

    get m33()
    {
        return this._data[15];
    }

    transformPoint(point, returnPoint = null)
    {
        const { m00, m01, m03, m10, m11, m13, m30, m31, m33 } = this;
        const px = point.x;
        const py = point.y;

        const td = m03 * px + m13 * py + m33;
        const tx = m00 * px + m10 * py + m30;
        const ty = m01 * px + m11 * py + m31;

        if (returnPoint)
        {
            returnPoint.setTo(tx / td, ty / td);
            return returnPoint;
        }

        return new Point(tx / td, ty / td);
    }

    transformPointInverse(point, returnPoint = null)
    {
        const { m00, m01, m03, m10, m11, m13, m30, m31, m33 } = this;
        const px = point.x;
        const py = point.y;

        const td = px * (m01 * m13 - m03 * m11) + py * (m10 * m03 - m00 * m13) + m00 * m11 - m10 * m01;
        const tx = px * (m11 * m33 - m13 * m31) + py * (m30 * m13 - m10 * m33) + m10 * m31 - m30 * m11;
        const ty = px * (m03 * m31 - m01 * m33) + py * (m00 * m33 - m30 * m03) + m30 * m01 - m00 * m31;

        if (returnPoint)
        {
            returnPoint.setTo(tx / td, ty / td);
            return returnPoint;
        }

        return new Point(tx / td, ty / td);
    }

    transformRectangle(rectangle, returnRectangle = null)
    {

        const { m00, m01, m03, m10, m11, m13, m30, m31, m33 } = this;
        const rl = rectangle.left;
        const rr = rectangle.right;
        const rt = rectangle.top;
        const rb = rectangle.bottom;

        // transform rectangle corners

        const d1 = (m03 * rl + m13 * rt + m33);
        const x1 = (m00 * rl + m10 * rt + m30) / d1;
        const y1 = (m01 * rl + m11 * rt + m31) / d1;
        const d2 = (m03 * rr + m13 * rt + m33);
        const x2 = (m00 * rr + m10 * rt + m30) / d2;
        const y2 = (m01 * rr + m11 * rt + m31) / d2;
        const d3 = (m03 * rr + m13 * rb + m33);
        const x3 = (m00 * rr + m10 * rb + m30) / d3;
        const y3 = (m01 * rr + m11 * rb + m31) / d3;
        const d4 = (m03 * rl + m13 * rb + m33);
        const x4 = (m00 * rl + m10 * rb + m30) / d4;
        const y4 = (m01 * rl + m11 * rb + m31) / d4;

        // find minima and maxima

        let left = x1;
        if (left > x2) left = x2;
        if (left > x3) left = x3;
        if (left > x4) left = x4;

        let top = y1;
        if (top > y2) top = y2;
        if (top > y3) top = y3;
        if (top > y4) top = y4;

        let right = x1;
        if (right < x2) right = x2;
        if (right < x3) right = x3;
        if (right < x4) right = x4;

        let bottom = y1;
        if (bottom < y2) bottom = y2;
        if (bottom < y3) bottom = y3;
        if (bottom < y4) bottom = y4;

        const width = right - left;
        const heigth = bottom - top;

        if (returnRectangle)
        {
            returnRectangle.setTo(left, top, width, heigth);
            return returnRectangle;
        }

        return new Rectangle(left, top, width, heigth);
    }

    setIdentity()
    {
        const { _data } = this;
        _data[0] = 1.0;
        _data[1] = 0.0;
        _data[2] = 0.0;
        _data[3] = 0.0;
        _data[4] = 0.0;
        _data[5] = 1.0;
        _data[6] = 0.0;
        _data[7] = 0.0;
        _data[8] = 0.0;
        _data[9] = 0.0;
        _data[10] = 1.0;
        _data[11] = 0.0;
        _data[12] = 0.0;
        _data[13] = 0.0;
        _data[14] = 0.0;
        _data[15] = 1.0;
    }

    setZero()
    {
        const { _data } = this;
        _data[0] = 0.0;
        _data[1] = 0.0;
        _data[2] = 0.0;
        _data[3] = 0.0;
        _data[4] = 0.0;
        _data[5] = 0.0;
        _data[6] = 0.0;
        _data[7] = 0.0;
        _data[8] = 0.0;
        _data[9] = 0.0;
        _data[10] = 0.0;
        _data[11] = 0.0;
        _data[12] = 0.0;
        _data[13] = 0.0;
        _data[14] = 0.0;
        _data[15] = 0.0;
    }

    scale(scaleX, scaleY, scaleZ)
    {
        const { _data } = this;
        _data[0] *= scaleX;
        _data[1] *= scaleX;
        _data[2] *= scaleX;
        _data[3] *= scaleX;

        _data[4] *= scaleY;
        _data[5] *= scaleY;
        _data[6] *= scaleY;
        _data[7] *= scaleY;

        _data[8] *= scaleZ;
        _data[9] *= scaleZ;
        _data[10] *= scaleZ;
        _data[11] *= scaleZ;
    }


    appendTranslation(translationX, translationY, translationZ)
    {
        this._data[3] += translationX;
        this._data[7] += translationY;
        this._data[11] += translationZ;
    }

    prependTranslation(translationX, translationY, translationZ)
    {

        const { m00, m01, m02, m03, m10, m11, m12, m20, m21, m22, m23, m13 } = this;

        this._data[3] += m00 * translationX + m10 * translationY + m20 * translationZ;
        this._data[7] += m01 * translationX + m11 * translationY + m21 * translationZ;
        this._data[11] += m02 * translationX + m12 * translationY + m22 * translationZ;
        this._data[15] += m03 * translationX + m13 * translationY + m23 * translationZ;
    }

    rotateX(angle)
    {

        const { _data } = this;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const m01 = this.m01;
        const m11 = this.m11;
        const m21 = this.m21;
        const m31 = this.m31;
        const m02 = this.m02;
        const m12 = this.m12;
        const m22 = this.m22;
        const m32 = this.m32;

        _data[4] = m01 * cos + m02 * sin;
        _data[5] = m11 * cos + m12 * sin;
        _data[6] = m21 * cos + m22 * sin;
        _data[7] = m31 * cos + m32 * sin;
        _data[8] = m02 * cos - m01 * sin;
        _data[9] = m12 * cos - m11 * sin;
        _data[10] = m22 * cos - m21 * sin;
        _data[11] = m32 * cos - m31 * sin;
    }

    rotateY(angle)
    {
        const { _data } = this;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const m00 = this.m00;
        const m10 = this.m10;
        const m20 = this.m20;
        const m30 = this.m30;
        const m02 = this.m02;
        const m12 = this.m12;
        const m22 = this.m22;
        const m32 = this.m32;

        _data[0] = m00 * cos + m02 * sin;
        _data[1] = m10 * cos + m12 * sin;
        _data[2] = m20 * cos + m22 * sin;
        _data[3] = m30 * cos + m32 * sin;
        _data[8] = m02 * cos - m00 * sin;
        _data[9] = m12 * cos - m10 * sin;
        _data[10] = m22 * cos - m20 * sin;
        _data[11] = m32 * cos - m30 * sin;
    }

    rotateZ(angle)
    {
        const { _data } = this;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const m00 = this.m00;
        const m10 = this.m10;
        const m20 = this.m20;
        const m30 = this.m30;
        const m01 = this.m01;
        const m11 = this.m11;
        const m21 = this.m21;
        const m31 = this.m31;

        _data[0] = m00 * cos + m01 * sin;
        _data[1] = m10 * cos + m11 * sin;
        _data[2] = m20 * cos + m21 * sin;
        _data[3] = m30 * cos + m31 * sin;
        _data[4] = m01 * cos - m00 * sin;
        _data[5] = m11 * cos - m10 * sin;
        _data[6] = m21 * cos - m20 * sin;
        _data[7] = m31 * cos - m30 * sin;
    }

    copyFrom2D(matrix)
    {
        const { _data } = this;
        _data[0] = matrix.a;
        _data[1] = matrix.c;
        _data[2] = 0.0;
        _data[3] = matrix.tx;
        _data[4] = matrix.b;
        _data[5] = matrix.d;
        _data[6] = 0.0;
        _data[7] = matrix.ty;
        _data[8] = 0.0;
        _data[9] = 0.0;
        _data[10] = 1.0;
        _data[11] = 0.0;
        _data[12] = 0.0;
        _data[13] = 0.0;
        _data[14] = 0.0;
        _data[15] = 1.0;
    }

    copyFrom(matrix)
    {
        const { _data } = this;
        _data[0] = matrix.m00;
        _data[1] = matrix.m10;
        _data[2] = matrix.m20;
        _data[3] = matrix.m30;
        _data[4] = matrix.m01;
        _data[5] = matrix.m11;
        _data[6] = matrix.m21;
        _data[7] = matrix.m31;
        _data[8] = matrix.m02;
        _data[9] = matrix.m12;
        _data[10] = matrix.m22;
        _data[11] = matrix.m32;
        _data[12] = matrix.m03;
        _data[13] = matrix.m13;
        _data[14] = matrix.m23;
        _data[15] = matrix.m33;
    }

    invert()
    {
        const { _data } = this;
        const a00 = _data[0];
        const a10 = _data[1];
        const a20 = _data[2];
        const a30 = _data[3];
        const a01 = _data[4];
        const a11 = _data[5];
        const a21 = _data[6];
        const a31 = _data[7];
        const a02 = _data[8];
        const a12 = _data[9];
        const a22 = _data[10];
        const a32 = _data[11];
        const a03 = _data[12];
        const a13 = _data[13];
        const a23 = _data[14];
        const a33 = _data[15];

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        const det = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

        if (det !== 0.0)
        {
            const invDet = 1.0 / det;
            _data[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
            _data[1] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
            _data[2] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
            _data[3] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
            _data[4] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
            _data[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
            _data[6] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
            _data[7] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
            _data[8] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
            _data[9] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
            _data[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
            _data[11] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
            _data[12] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
            _data[13] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
            _data[14] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
            _data[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
        }
    }

    concat(matrix)
    {
        this.copyFromAndConcat(this, matrix);
    }

    prepend(matrix)
    {
        this.copyFromAndConcat(matrix, this);
    }

    concat2D(matrix)
    {
        const { _data } = this;
        const m00 = this.m00;
        const m10 = this.m10;
        const m20 = this.m20;
        const m30 = this.m30;
        const m01 = this.m01;
        const m11 = this.m11;
        const m21 = this.m21;
        const m31 = this.m31;
        const m03 = this.m03;
        const m13 = this.m13;
        const m23 = this.m23;
        const m33 = this.m33;

        const n00 = matrix.a;
        const n10 = matrix.c;
        const n30 = matrix.tx;
        const n01 = matrix.b;
        const n11 = matrix.d;
        const n31 = matrix.ty;

        _data[0] = m00 * n00 + m01 * n10 + m03 * n30;
        _data[1] = m10 * n00 + m11 * n10 + m13 * n30;
        _data[2] = m20 * n00 + m21 * n10 + m23 * n30;
        _data[3] = m30 * n00 + m31 * n10 + m33 * n30;
        _data[4] = m00 * n01 + m01 * n11 + m03 * n31;
        _data[5] = m10 * n01 + m11 * n11 + m13 * n31;
        _data[6] = m20 * n01 + m21 * n11 + m23 * n31;
        _data[7] = m30 * n01 + m31 * n11 + m33 * n31;
    }

    concatInverse2D(matrix)
    {
        const { _data } = this;
        const m00 = this.m00;
        const m10 = this.m10;
        const m20 = this.m20;
        const m30 = this.m30;
        const m01 = this.m01;
        const m11 = this.m11;
        const m21 = this.m21;
        const m31 = this.m31;
        const m03 = this.m03;
        const m13 = this.m13;
        const m23 = this.m23;
        const m33 = this.m33;

        const n00 = matrix.d / matrix.det;
        const n10 = 0.0 - matrix.c / matrix.det;
        const n30 = 0.0 - matrix.tx * n00 - matrix.ty * n10;
        const n01 = 0.0 - matrix.b / matrix.det;
        const n11 = matrix.a / matrix.det;
        const n31 = 0.0 - matrix.tx * n01 - matrix.ty * n11;

        _data[0] = m00 * n00 + m01 * n10 + m03 * n30;
        _data[1] = m10 * n00 + m11 * n10 + m13 * n30;
        _data[2] = m20 * n00 + m21 * n10 + m23 * n30;
        _data[3] = m30 * n00 + m31 * n10 + m33 * n30;
        _data[4] = m00 * n01 + m01 * n11 + m03 * n31;
        _data[5] = m10 * n01 + m11 * n11 + m13 * n31;
        _data[6] = m20 * n01 + m21 * n11 + m23 * n31;
        _data[7] = m30 * n01 + m31 * n11 + m33 * n31;
    }

    prepend2D(matrix)
    {
        const { _data } = this;
        const m00 = matrix.a;
        const m10 = matrix.c;
        const m30 = matrix.tx;
        const m01 = matrix.b;
        const m11 = matrix.d;
        const m31 = matrix.ty;

        const n00 = this.m00;
        const n10 = this.m10;
        const n30 = this.m30;
        const n01 = this.m01;
        const n11 = this.m11;
        const n31 = this.m31;
        const n02 = this.m02;
        const n12 = this.m12;
        const n32 = this.m32;
        const n03 = this.m03;
        const n13 = this.m13;
        const n33 = this.m33;

        _data[0] = m00 * n00 + m01 * n10;
        _data[1] = m10 * n00 + m11 * n10;
        _data[3] = m30 * n00 + m31 * n10 + n30;
        _data[4] = m00 * n01 + m01 * n11;
        _data[5] = m10 * n01 + m11 * n11;
        _data[7] = m30 * n01 + m31 * n11 + n31;
        _data[8] = m00 * n02 + m01 * n12;
        _data[9] = m10 * n02 + m11 * n12;
        _data[11] = m30 * n02 + m31 * n12 + n32;
        _data[12] = m00 * n03 + m01 * n13;
        _data[13] = m10 * n03 + m11 * n13;
        _data[15] = m30 * n03 + m31 * n13 + n33;
    }

    prependInverse2D(matrix)
    {
        const { _data } = this;
        const m00 = matrix.d / matrix.det;
        const m10 = 0.0 - matrix.c / matrix.det;
        const m30 = 0.0 - matrix.tx * m00 - matrix.ty * m10;
        const m01 = 0.0 - matrix.b / matrix.det;
        const m11 = matrix.a / matrix.det;
        const m31 = 0.0 - matrix.tx * m01 - matrix.ty * m11;

        const n00 = this.m00;
        const n10 = this.m10;
        const n30 = this.m30;
        const n01 = this.m01;
        const n11 = this.m11;
        const n31 = this.m31;
        const n02 = this.m02;
        const n12 = this.m12;
        const n32 = this.m32;
        const n03 = this.m03;
        const n13 = this.m13;
        const n33 = this.m33;

        _data[0] = m00 * n00 + m01 * n10;
        _data[1] = m10 * n00 + m11 * n10;
        _data[3] = m30 * n00 + m31 * n10 + n30;
        _data[4] = m00 * n01 + m01 * n11;
        _data[5] = m10 * n01 + m11 * n11;
        _data[7] = m30 * n01 + m31 * n11 + n31;
        _data[8] = m00 * n02 + m01 * n12;
        _data[9] = m10 * n02 + m11 * n12;
        _data[11] = m30 * n02 + m31 * n12 + n32;
        _data[12] = m00 * n03 + m01 * n13;
        _data[13] = m10 * n03 + m11 * n13;
        _data[15] = m30 * n03 + m31 * n13 + n33;
    }

    copyFromAndConcat2D(copyMatrix, concatMatrix)
    {
        const { _data } = this;
        const m00 = copyMatrix.m00;
        const m10 = copyMatrix.m10;
        const m20 = copyMatrix.m20;
        const m30 = copyMatrix.m30;
        const m01 = copyMatrix.m01;
        const m11 = copyMatrix.m11;
        const m21 = copyMatrix.m21;
        const m31 = copyMatrix.m31;
        const m02 = copyMatrix.m02;
        const m12 = copyMatrix.m12;
        const m22 = copyMatrix.m22;
        const m32 = copyMatrix.m32;
        const m03 = copyMatrix.m03;
        const m13 = copyMatrix.m13;
        const m23 = copyMatrix.m23;
        const m33 = copyMatrix.m33;

        const n00 = concatMatrix.a;
        const n10 = concatMatrix.c;
        const n30 = concatMatrix.tx;
        const n01 = concatMatrix.b;
        const n11 = concatMatrix.d;
        const n31 = concatMatrix.ty;

        _data[0] = m00 * n00 + m01 * n10 + m03 * n30;
        _data[1] = m10 * n00 + m11 * n10 + m13 * n30;
        _data[2] = m20 * n00 + m21 * n10 + m23 * n30;
        _data[3] = m30 * n00 + m31 * n10 + m33 * n30;
        _data[4] = m00 * n01 + m01 * n11 + m03 * n31;
        _data[5] = m10 * n01 + m11 * n11 + m13 * n31;
        _data[6] = m20 * n01 + m21 * n11 + m23 * n31;
        _data[7] = m30 * n01 + m31 * n11 + m33 * n31;
        _data[8] = m02;
        _data[9] = m12;
        _data[0] = m22;
        _data[11] = m32;
        _data[12] = m03;
        _data[13] = m13;
        _data[14] = m23;
        _data[15] = m33;
    }

    copyFrom2DAndConcat(copyMatrix, concatMatrix)
    {
        const { _data } = this;
        const m00 = copyMatrix.a;
        const m10 = copyMatrix.c;
        const m30 = copyMatrix.tx;
        const m01 = copyMatrix.b;
        const m11 = copyMatrix.d;
        const m31 = copyMatrix.ty;

        const n00 = concatMatrix.m00;
        const n10 = concatMatrix.m10;
        const n20 = concatMatrix.m20;
        const n30 = concatMatrix.m30;
        const n01 = concatMatrix.m01;
        const n11 = concatMatrix.m11;
        const n21 = concatMatrix.m21;
        const n31 = concatMatrix.m31;
        const n02 = concatMatrix.m02;
        const n12 = concatMatrix.m12;
        const n22 = concatMatrix.m22;
        const n32 = concatMatrix.m32;
        const n03 = concatMatrix.m03;
        const n13 = concatMatrix.m13;
        const n23 = concatMatrix.m23;
        const n33 = concatMatrix.m33;

        _data[0] = m00 * n00 + m01 * n10;
        _data[1] = m10 * n00 + m11 * n10;
        _data[2] = n20;
        _data[3] = m30 * n00 + m31 * n10 + n30;
        _data[4] = m00 * n01 + m01 * n11;
        _data[5] = m10 * n01 + m11 * n11;
        _data[6] = n21;
        _data[7] = m30 * n01 + m31 * n11 + n31;
        _data[8] = m00 * n02 + m01 * n12;
        _data[9] = m10 * n02 + m11 * n12;
        _data[10] = n22;
        _data[11] = m30 * n02 + m31 * n12 + n32;
        _data[12] = m00 * n03 + m01 * n13;
        _data[13] = m10 * n03 + m11 * n13;
        _data[14] = n23;
        _data[15] = m30 * n03 + m31 * n13 + n33;
    }

    copyFromAndConcat(copyMatrix, concatMatrix)
    {
        const { _data } = this;
        const m00 = copyMatrix.m00;
        const m10 = copyMatrix.m10;
        const m20 = copyMatrix.m20;
        const m30 = copyMatrix.m30;
        const m01 = copyMatrix.m01;
        const m11 = copyMatrix.m11;
        const m21 = copyMatrix.m21;
        const m31 = copyMatrix.m31;
        const m02 = copyMatrix.m02;
        const m12 = copyMatrix.m12;
        const m22 = copyMatrix.m22;
        const m32 = copyMatrix.m32;
        const m03 = copyMatrix.m03;
        const m13 = copyMatrix.m13;
        const m23 = copyMatrix.m23;
        const m33 = copyMatrix.m33;

        const n00 = concatMatrix.m00;
        const n10 = concatMatrix.m10;
        const n20 = concatMatrix.m20;
        const n30 = concatMatrix.m30;
        const n01 = concatMatrix.m01;
        const n11 = concatMatrix.m11;
        const n21 = concatMatrix.m21;
        const n31 = concatMatrix.m31;
        const n02 = concatMatrix.m02;
        const n12 = concatMatrix.m12;
        const n22 = concatMatrix.m22;
        const n32 = concatMatrix.m32;
        const n03 = concatMatrix.m03;
        const n13 = concatMatrix.m13;
        const n23 = concatMatrix.m23;
        const n33 = concatMatrix.m33;

        _data[0] = m00 * n00 + m01 * n10 + m02 * n20 + m03 * n30;
        _data[1] = m10 * n00 + m11 * n10 + m12 * n20 + m13 * n30;
        _data[2] = m20 * n00 + m21 * n10 + m22 * n20 + m23 * n30;
        _data[3] = m30 * n00 + m31 * n10 + m32 * n20 + m33 * n30;
        _data[4] = m00 * n01 + m01 * n11 + m02 * n21 + m03 * n31;
        _data[5] = m10 * n01 + m11 * n11 + m12 * n21 + m13 * n31;
        _data[6] = m20 * n01 + m21 * n11 + m22 * n21 + m23 * n31;
        _data[7] = m30 * n01 + m31 * n11 + m32 * n21 + m33 * n31;
        _data[8] = m00 * n02 + m01 * n12 + m02 * n22 + m03 * n32;
        _data[9] = m10 * n02 + m11 * n12 + m12 * n22 + m13 * n32;
        _data[10] = m20 * n02 + m21 * n12 + m22 * n22 + m23 * n32;
        _data[11] = m30 * n02 + m31 * n12 + m32 * n22 + m33 * n32;
        _data[12] = m00 * n03 + m01 * n13 + m02 * n23 + m03 * n33;
        _data[13] = m10 * n03 + m11 * n13 + m12 * n23 + m13 * n33;
        _data[14] = m20 * n03 + m21 * n13 + m22 * n23 + m23 * n33;
        _data[15] = m30 * n03 + m31 * n13 + m32 * n23 + m33 * n33;
    }

    copyRawDataTo(target)
    {
        target[0] = this.m00;
        target[1] = this.m01;
        target[2] = this.m02;
        target[3] = this.m03;
        target[4] = this.m10;
        target[5] = this.m11;
        target[6] = this.m12;
        target[7] = this.m13;

        target[8] = this.m20;
        target[9] = this.m21;
        target[10] = this.m22;
        target[11] = this.m23;
        target[12] = this.m30;
        target[13] = this.m31;
        target[14] = this.m32;
        target[15] = this.m33;
    }
}
