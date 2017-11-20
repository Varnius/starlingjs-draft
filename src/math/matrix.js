import Rectangle from './rectangle';
import Point from './point';

export default class Matrix {

    _data = [];

    constructor(a = 1.0, b = 0.0, c = 0.0, d = 1.0, tx = 0.0, ty = 0.0)
    {
        const { _data } = this;
        _data[0] = a;
        _data[1] = b;
        _data[2] = c;
        _data[3] = d;
        _data[4] = tx;
        _data[5] = ty;
    }

    toString()
    {
        const { a, b, c, d, tx, ty } = this;
        return `Matrix(a=${a}, b=${b}, c=${c}, d=${d}, tx=${tx}, ty=${ty})`;
    }

    clone()
    {
        const { a, b, c, d, tx, ty } = this;
        return new Matrix(a, b, c, d, tx, ty);
    }

    cloneInvert()
    {
        const det = this.det;
        const a = this.d / det;
        const b = -this.b / det;
        const c = -this.c / det;
        const d = this.a / det;
        const tx = -this.tx * a - this.ty * c;
        const ty = -this.tx * b - this.ty * d;

        return new Matrix(a, b, c, d, tx, ty);
    }

    get a()
    {
        return this._data[0];
    }

    set a(n)
    {
        this._data[0] = n;
    }

    get b()
    {
        return this._data[1];
    }

    set b(n)
    {
        this._data[1] = n;
    }

    get c()
    {
        return this._data[2];
    }

    set c(n)
    {
        this._data[2] = n;
    }

    get d()
    {
        return this._data[3];
    }

    set d(n)
    {
        this._data[3] = n;
    }

    get tx()
    {
        return this._data[4];
    }

    set tx(n)
    {
        this._data[4] = n;
    }

    get ty()
    {
        return this._data[5];
    }

    set ty(n)
    {
        this._data[5] = n;
    }

    get det()
    {
        return this.a * this.d - this.b * this.c;
    }

    deltaTransformPoint(point, returnPoint = null)
    {
        const px = point.x;
        const py = point.y;
        const tx = px * this.a + py * this.c;
        const ty = px * this.b + py * this.d;

        if (returnPoint)
        {
            returnPoint.setTo(tx, ty);
            return returnPoint;
        }

        return new Point(tx, ty);
    }

    transformPoint(point, returnPoint = null)
    {
        const px = point.x;
        const py = point.y;
        const tx = px * this.a + py * this.c + this.tx;
        const ty = px * this.b + py * this.d + this.ty;

        if (returnPoint)
        {
            returnPoint.setTo(tx, ty);
            return returnPoint;
        }

        return new Point(tx, ty);
    }

    transformPointInverse(point, returnPoint = null)
    {

        const px = point.x;
        const py = point.y;
        const tx = (this.d * (px - this.tx) - this.c * (py - this.ty)) / this.det;
        const ty = (this.a * (py - this.ty) - this.b * (px - this.tx)) / this.det;

        if (returnPoint)
        {
            returnPoint.setTo(tx, ty);
            return returnPoint;
        }

        return new Point(tx, ty);
    }

    transformRectangle(rectangle, returnRectangle = null)
    {
        const rl = rectangle.left;
        const rr = rectangle.right;
        const rt = rectangle.top;
        const rb = rectangle.bottom;

        // transform rectangle corners

        const { a, b, c, d, tx, ty } = this;
        const x1 = rl * a + rt * c;
        const y1 = rl * b + rt * d;
        const x2 = rr * a + rt * c;
        const y2 = rr * b + rt * d;
        const x3 = rr * a + rb * c;
        const y3 = rr * b + rb * d;
        const x4 = rl * a + rb * c;
        const y4 = rl * b + rb * d;

        // find minima and maxima

        const left = x1;
        if (left > x2) this.left = x2;
        if (left > x3) this.left = x3;
        if (left > x4) this.left = x4;

        const top = y1;
        if (top > y2) this.top = y2;
        if (top > y3) this.top = y3;
        if (top > y4) this.top = y4;

        const right = x1;
        if (right < x2) this.right = x2;
        if (right < x3) this.right = x3;
        if (right < x4) this.right = x4;

        const bottom = y1;
        if (bottom < y2) this.bottom = y2;
        if (bottom < y3) this.bottom = y3;
        if (bottom < y4) this.bottom = y4;

        const width = right - left;
        const heigth = bottom - top;

        if (returnRectangle)
        {
            returnRectangle.setTo(tx + left, ty + top, width, heigth);
            return returnRectangle;
        }

        return new Rectangle(tx + left, ty + top, width, heigth);
    }


    createBox(scaleX, scaleY, rotation = 0.0, translationX = 0.0, translationY = 0.0)
    {
        this.identity();
        this.scale(scaleX, scaleY);
        this.rotate(rotation);
        this.translate(translationX, translationY);
    }

    identity()
    {
        this._data[0] = 1.0;
        this._data[1] = 0.0;
        this._data[2] = 0.0;
        this._data[3] = 1.0;
        this._data[4] = 0.0;
        this._data[5] = 0.0;
    }

    invert()
    {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const tx = this.tx;
        const ty = this.ty;
        const det = this.det;

        this._data[0] = d / det;
        this._data[1] = -b / det;
        this._data[2] = -c / det;
        this._data[3] = a / det;
        this._data[4] = -tx * this._data[0] - ty * this._data[2];
        this._data[5] = -tx * this._data[1] - ty * this._data[3];
    }

    rotate(rotation)
    {
        const { _data, a, b, c, d, tx, ty } = this;
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);

        console.log(_data);

        _data[0] = a * cosR - b * sinR;
        _data[1] = a * sinR + b * cosR;
        _data[2] = c * cosR - d * sinR;
        _data[3] = c * sinR + d * cosR;
        _data[4] = tx * cosR - ty * sinR;
        _data[5] = tx * sinR + ty * cosR;

        console.log(_data);

        //_data[0] = cosR;
        //_data[1] = sinR;
        //_data[2] = -sinR;
        //_data[3] = cosR;

        console.log(_data);
    }

    skew(skewX, skewY)
    {
        const { _data } = this;
        const sinX = Math.sin(skewX);
        const cosX = Math.cos(skewX);
        const sinY = Math.sin(skewY);
        const cosY = Math.cos(skewY);

        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const tx = this.tx;
        const ty = this.ty;

        _data[0] = a * cosY - b * sinX;
        _data[1] = a * sinY + b * cosX;
        _data[2] = c * cosY - d * sinX;
        _data[3] = c * sinY + d * cosX;
        _data[4] = tx * cosY - ty * sinX;
        _data[5] = tx * sinY + ty * cosX;
    }

    scale(scaleX, scaleY)
    {
        const { _data } = this;

        _data[0] = this.a * scaleX;
        _data[1] = this.b * scaleY;
        _data[2] = this.c * scaleX;
        _data[3] = this.d * scaleY;
        _data[4] = this.tx * scaleX;
        _data[5] = this.ty * scaleY;
    }

    translate(translationX, translationY)
    {
        this._data[4] = this.tx + translationX;
        this._data[5] = this.ty + translationY;
    }

    prependTranslation(translationX, translationY)
    {
        this._data[4] = translationX * this.a + translationY * this.c + this.tx;
        this._data[5] = translationX * this.b + translationY * this.d + this.ty;
    }

    setTo(a, b, c, d, tx, ty)
    {
        const { _data } = this;
        _data[0] = a;
        _data[1] = b;
        _data[2] = c;
        _data[3] = d;
        _data[4] = tx;
        _data[5] = ty;
    }

    copyFrom(matrix)
    {
        const { _data } = this;
        _data[0] = matrix.a;
        _data[1] = matrix.b;
        _data[2] = matrix.c;
        _data[3] = matrix.d;
        _data[4] = matrix.tx;
        _data[5] = matrix.ty;
    }

    concat(matrix)
    {
        this.copyFromAndConcat(this, matrix);
    }

    prepend(matrix)
    {
        this.copyFromAndConcat(matrix, this);
    }

    copyFromAndConcat(copyMatrix, concatMatrix)
    {
        const { _data } = this;
        const a1 = copyMatrix.a;
        const b1 = copyMatrix.b;
        const c1 = copyMatrix.c;
        const d1 = copyMatrix.d;
        const tx1 = copyMatrix.tx;
        const ty1 = copyMatrix.ty;

        const a2 = concatMatrix.a;
        const b2 = concatMatrix.b;
        const c2 = concatMatrix.c;
        const d2 = concatMatrix.d;
        const tx2 = concatMatrix.tx;
        const ty2 = concatMatrix.ty;

        _data[0] = a1 * a2 + b1 * c2;
        _data[1] = a1 * b2 + b1 * d2;
        _data[2] = c1 * a2 + d1 * c2;
        _data[3] = c1 * b2 + d1 * d2;
        _data[4] = tx1 * a2 + ty1 * c2 + tx2;
        _data[5] = tx1 * b2 + ty1 * d2 + ty2;
    }

    invertAndConcat(concatMatrix)
    {
        const { _data } = this;
        const det = this.det;
        const a1 = this.d / det;
        const b1 = -this.b / det;
        const c1 = -this.c / det;
        const d1 = this.a / det;
        const tx1 = -this.tx * a1 - this.ty * c1;
        const ty1 = -this.tx * b1 - this.ty * d1;
        const a2 = concatMatrix.a;
        const b2 = concatMatrix.b;
        const c2 = concatMatrix.c;
        const d2 = concatMatrix.d;
        const tx2 = concatMatrix.tx;
        const ty2 = concatMatrix.ty;

        _data[0] = a1 * a2 + b1 * c2;
        _data[1] = a1 * b2 + b1 * d2;
        _data[2] = c1 * a2 + d1 * c2;
        _data[3] = c1 * b2 + d1 * d2;
        _data[4] = tx1 * a2 + ty1 * c2 + tx2;
        _data[5] = tx1 * b2 + ty1 * d2 + ty2;
    }

    copyFromAndInvert(matrix)
    {
        const { _data } = this;
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;
        const det = matrix.det;

        _data[0] = d / det;
        _data[1] = -b / det;
        _data[2] = -c / det;
        _data[3] = a / det;
        _data[4] = -tx * _data[0] - ty * _data[2];
        _data[5] = -tx * _data[1] - ty * _data[3];
    }
}
