export default class Point {
    x;
    y;

    constructor(x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Point(this.x + v.x, this.y + v.y);
    }

    clone() {
        return new Point(this.x, this.y);
    }

    degreesTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const angle = Math.atan2(dy, dx); // radians
        return angle * (180 / Math.PI); // degrees
    }

    distance(v) {
        const x = this.x - v.x;
        const y = this.y - v.y;
        return Math.sqrt(x * x + y * y);
    }

    equals(toCompare) {
        return this.x === toCompare.x && this.y === toCompare.y;
    }

    interpolate(v, f) {
        return new Point(v.x + (this.x - v.x) * f, v.y + (this.y - v.y) * f);
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(thickness) {
        const l = this.length();
        this.x = this.x / l * thickness;
        this.y = this.y / l * thickness;
    }

    orbit(origin, arcWidth, arcHeight, degrees) {
        const radians = degrees * (Math.PI / 180);
        this.x = origin.x + arcWidth * Math.cos(radians);
        this.y = origin.y + arcHeight * Math.sin(radians);
    }

    offset(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    subtract(v) {
        return new Point(this.x - v.x, this.y - v.y);
    }

    setTo(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '(x=' + this.x + ', y=' + this.y + ')';
    }

    static interpolate(pt1, pt2, f) {
        return pt1.interpolate(pt2, f);
    }

    static polar(len, angle) {
        return new Point(len * Math.cos(angle), len * Math.sin(angle));
    }

    static distance(pt1, pt2) {
        const x = pt1.x - pt2.x;
        const y = pt1.y - pt2.y;
        return Math.sqrt(x * x + y * y);
    }
}
