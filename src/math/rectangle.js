import Point from './point';

export default class Rectangle {
    _width;
    _height;

    constructor(x = 0.0, y = 0.0, width = 0.0, height = 0.0) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }

    static from(r) {
        return new Rectangle(r._x, r._y, r._width, r._height);
    }

    clone() {
        return new Rectangle(this._x, this._y, this._width, this._height);
    }

    toString() {
        return '(left=' + this.left + ', top=' + this.top + ', width=' + this.width + ', height=' + this.height + ')';
    }

    //get center()
    //{
    //    return new Point(this.left + this.width / 2, this.top + this.height / 2);
    //}

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    get left() {
        return this._x;
    }

    set left(value) {
        this._x = value;
    }

    get right() {
        return this._x + this._width;
    }

    set right(value) {
        this._width = value - this._x;
    }

    get top() {
        return this._y;
    }

    set top(value) {
        this._y = value;
    }

    get bottom() {
        return this._y + this._height;
    }

    set bottom(value) {
        this._height = value - this._y;
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }

    get size() {
        return new Point(this.width, this.height);
    }

    set size(value) {
        this.width = value.x;
        this.height = value.y;
    }

    setEmpty() {
        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
    }

    contains(px, py) {
        return this.left <= px && this.top <= py && this.right > px && this.bottom > py;
    }

    containsPoint(p) {
        return this.contains(p.x, p.y);
    }

    intersects(r) {
        return this.left < r.right && this.right > r.left && this.top < r.bottom && this.bottom > r.top;
    }

    boundingBox(other) {
        const rLeft = Math.min(this.left, other.left);
        const rTop = Math.min(this.top, other.top);
        const rRight = Math.max(this.right, other.right);
        const rBottom = Math.max(this.bottom, other.bottom);
        return new Rectangle(rLeft, rTop, rRight - rLeft, rBottom - rTop);
    }

    containsRectangle(r) {
        return this.left <= r.left && this.top <= r.top && this.right >= r.right && this.bottom >= r.bottom;
    }

    copyFrom(r) {
        this.setTo(r.left, r.top, r.width, r.height);
    }

    inflate(dx, dy) {
        this.width += dx;
        this.height += dy;
    }

    inflatePoint(p) {
        this.inflate(p.x, p.y);
    }

    offset(dx, dy) {
        this.left += dx;
        this.top += dy;
    }

    offsetPoint(p) {
        this.offset(p.x, p.y);
    }

    setTo(rx, ry, rw, rh) {
        this.left = rx;
        this.top = ry;
        this.width = rw;
        this.height = rh;
    }

    intersection(rect) {
        const rLeft = Math.max(this.left, rect.left);
        const rTop = Math.max(this.top, rect.top);
        const rRight = Math.min(this.right, rect.right);
        const rBottom = Math.min(this.bottom, rect.bottom);
        return new Rectangle(rLeft, rTop, rRight - rLeft, rBottom - rTop);
    }

    align() {
        const rLeft = Math.floor(this.left);
        const rTop = Math.floor(this.top);
        const rRight = Math.ceil(this.right);
        const rBottom = Math.ceil(this.bottom);
        return new Rectangle(rLeft, rTop, rRight - rLeft, rBottom - rTop);
    }

    equals(other) {
        return this.left === other.left &&
            this.top === other.top &&
            this.width === other.width &&
            this.height === other.height;
    }

    isEmpty() {
        return this.width <= 0 || this.height <= 0;
    }
}
