export default class Vector3D {
  x
  y
  z
  w

  static X_AXIS = new Vector3D(1, 0, 0)
  static Y_AXIS = new Vector3D(0, 1, 0)
  static Z_AXIS = new Vector3D(0, 0, 1)

  constructor(x = 0.0, y = 0.0, z = 0.0, w = 0.0) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  get length() {
    const x = this.x
    const y = this.y
    const z = this.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  get lengthSquared() {
    const x = this.x
    const y = this.y
    const z = this.z
    return x * x + y * y + z * z
  }

  add(a) {
    return new Vector3D(this.x + a.x, this.y + a.y, this.z + a.z)
  }

  subtract(a) {
    return new Vector3D(this.x - a.x, this.y - a.y, this.z - a.z)
  }

  equals(toCompare, allFour) {
    allFour = allFour || false
    if (allFour) {
      return (
        this.x === toCompare.x &&
        this.y === toCompare.y &&
        this.z === toCompare.z &&
        this.w === toCompare.w
      )
    }

    return (
      this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z
    )
  }

  nearEquals(toCompare, tolerance, allFour) {
    allFour = allFour || false
    const dx = Math.abs(toCompare.x - this.x)
    const dy = Math.abs(toCompare.y - this.y)
    const dz = Math.abs(toCompare.z - this.z)
    if (allFour) {
      const dw = Math.abs(toCompare.w - this.w)
      return (
        dx < tolerance && dy < tolerance && dz < tolerance && dw < tolerance
      )
    }

    return dx < tolerance && dy < tolerance && dz < tolerance
  }

  negate() {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
  }

  incrementByn(a) {
    this.x += a.x
    this.y += a.y
    this.z += a.z
  }

  decrementBy(a) {
    this.x -= a.x
    this.y -= a.y
    this.z -= a.z
  }

  scaleBy(s) {
    this.x *= s
    this.y *= s
    this.z *= s
  }

  project() {
    const w = this.w
    this.x /= w
    this.y /= w
    this.z /= w
  }

  normalize() {
    const length = this.length
    if (length !== 0) {
      this.x /= length
      this.y /= length
      this.z /= length
    }
    return length
  }

  dotProduct(a) {
    return this.x * a.x + this.y * a.y + this.z * a.z
  }

  crossProduct(a) {
    const x = this.x
    const y = this.y
    const z = this.z
    const ax = a.x
    const ay = a.y
    const az = a.z
    return new Vector3D(y * az - z * ay, z * ax - x * az, x * ay - y * ax, 1)
  }

  setTo(xa, ya, za) {
    this.x = xa
    this.y = ya
    this.z = za
  }

  copyFrom(sourceVector3D) {
    this.x = sourceVector3D.x
    this.y = sourceVector3D.y
    this.z = sourceVector3D.z
  }

  clone() {
    return new Vector3D(this.x, this.y, this.z, this.w)
  }

  toString() {
    return '[Vector3D (x=' + this.x + ' y=' + this.y + ' z=' + this.z + ')]'
  }

  static distance(pt1, pt2) {
    return Math.sqrt(
      (pt2.x - pt1.x) ** 2 + (pt2.y - pt1.y) ** 2 + (pt2.z - pt1.z) ** 2
    )
  }

  static angleBetween(a, b) {
    const cos = a.dotProduct(b) / (a.length * b.length)
    if (cos > 1) return 0
    if (cos < -1) return Math.PI
    return Math.acos(cos)
  }
}
