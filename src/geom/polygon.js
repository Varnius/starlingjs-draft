import Pool from '../utils/pool'
import MathUtil from '../utils/math-util'
import IndexData from '../rendering/index-data'
import Point from '../math/point'

/** A polygon describes a closed two-dimensional shape bounded by a number of straight
 *  line segments.
 *
 *  <p>The vertices of a polygon form a closed path (i.e. the last vertex will be connected
 *  to the first). It is recommended to provide the vertices in clockwise order.
 *  Self-intersecting paths are not supported and will give wrong results on triangulation,
 *  area calculation, etc.</p>
 */
export default class Polygon {
  _coords

  // Helper object
  static sRestIndices = []

  /** Creates a Polygon with the given coordinates.
   *  @param vertices an array that contains either 'Point' instances or
   *                  alternating 'x' and 'y' coordinates.
   */
  constructor(vertices = null) {
    this._coords = []
    this.addVertices(...vertices)
  }

  /** Creates a clone of this polygon. */
  clone() {
    const clone = new Polygon()
    const numCoords = this._coords.length

    for (let i = 0; i < numCoords; ++i) clone._coords[i] = this._coords[i]

    return clone
  }

  /** Reverses the order of the vertices. Note that some methods of the Polygon class
   *  require the vertices in clockwise order. */
  reverse() {
    const { _coords } = this
    const numCoords = _coords.length
    const numVertices = numCoords / 2
    let tmp

    for (let i = 0; i < numVertices; i += 2) {
      tmp = _coords[i]
      _coords[i] = _coords[numCoords - i - 2]
      _coords[numCoords - i - 2] = tmp

      tmp = _coords[i + 1]
      _coords[i + 1] = _coords[numCoords - i - 1]
      _coords[numCoords - i - 1] = tmp
    }
  }

  /** Adds vertices to the polygon. Pass either a list of 'Point' instances or alternating
   *  'x' and 'y' coordinates. */
  addVertices = (...args) => {
    const { _coords } = this
    let i
    const numArgs = args.length
    const numCoords = _coords.length

    if (numArgs > 0) {
      if (args[0] instanceof Point) {
        for (i = 0; i < numArgs; i++) {
          _coords[numCoords + i * 2] = args[i].x
          _coords[numCoords + i * 2 + 1] = args[i].y
        }
      } else {
        for (i = 0; i < numArgs; ++i) _coords[numCoords + i] = args[i]
      }
    }
    // todo: threw away some code here
  }

  /** Moves a given vertex to a certain position or adds a new vertex at the end. */
  setVertex(index, x, y) {
    const { _coords } = this
    if (index >= 0 && index <= this.numVertices) {
      _coords[index * 2] = x
      _coords[index * 2 + 1] = y
    } else throw new Error('[RangeError] Invalid index: ' + index)
  }

  /** Returns the coordinates of a certain vertex. */
  getVertex(index, out = null) {
    const { _coords } = this
    if (index >= 0 && index < this.numVertices) {
      out = out || new Point()
      out.setTo(_coords[index * 2], _coords[index * 2 + 1])
      return out
    } else throw new RangeError('[RangeError] Invalid index: ' + index)
  }

  /** Figures out if the given coordinates lie within the polygon. */
  contains(x, y) {
    const { _coords } = this
    // Algorithm & implementation thankfully taken from:
    // -> http://alienryderflex.com/polygon/

    let i,
      j = this.numVertices - 1
    let oddNodes = 0

    for (i = 0; i < this.numVertices; ++i) {
      const ix = _coords[i * 2]
      const iy = _coords[i * 2 + 1]
      const jx = _coords[j * 2]
      const jy = _coords[j * 2 + 1]

      if (((iy < y && jy >= y) || (jy < y && iy >= y)) && (ix <= x || jx <= x))
        oddNodes ^= Math.floor(ix + ((y - iy) / (jy - iy)) * (jx - ix) < x) //todo:

      j = i
    }

    return oddNodes !== 0
  }

  /** Figures out if the given point lies within the polygon. */
  containsPoint(point) {
    return this.contains(point.x, point.y)
  }

  /** Calculates a possible representation of the polygon via triangles. The resulting
   *  IndexData instance will reference the polygon vertices as they are saved in this
   *  Polygon instance, optionally incremented by the given offset.
   *
   *  <p>If you pass an indexData object, the new indices will be appended to it.
   *  Otherwise, a new instance will be created.</p> */
  triangulate(indexData = null, offset = 0) {
    // Algorithm "Ear clipping method" described here:
    // -> https://en.wikipedia.org/wiki/Polygon_triangulation
    //
    // Implementation inspired by:
    // -> http://polyk.ivank.net

    const { _coords } = this
    const { sRestIndices } = Polygon

    const numVertices = this.numVertices
    const numTriangles = this.numTriangles
    let i, restIndexPos, numRestIndices

    if (!indexData) indexData = new IndexData(numTriangles * 3)
    if (numTriangles === 0) return indexData

    Polygon.sRestIndices.length = numVertices
    for (i = 0; i < numVertices; ++i) Polygon.sRestIndices[i] = i

    restIndexPos = 0
    numRestIndices = numVertices

    const a = Pool.getPoint()
    const b = Pool.getPoint()
    const c = Pool.getPoint()
    const p = Pool.getPoint()

    while (numRestIndices > 3) {
      // In each step, we look at 3 subsequent vertices. If those vertices spawn up
      // a triangle that is convex and does not contain any other vertices, it is an 'ear'.
      // We remove those ears until only one remains -> each ear is one of our wanted
      // triangles.

      let otherIndex
      let earFound = false
      const i0 = sRestIndices[restIndexPos % numRestIndices]
      const i1 = sRestIndices[(restIndexPos + 1) % numRestIndices]
      const i2 = sRestIndices[(restIndexPos + 2) % numRestIndices]

      a.setTo(_coords[2 * i0], _coords[2 * i0 + 1])
      b.setTo(_coords[2 * i1], _coords[2 * i1 + 1])
      c.setTo(_coords[2 * i2], _coords[2 * i2 + 1])

      if (this.isConvexTriangle(a.x, a.y, b.x, b.y, c.x, c.y)) {
        earFound = true
        for (i = 3; i < numRestIndices; ++i) {
          otherIndex = sRestIndices[(restIndexPos + i) % numRestIndices]
          p.setTo(_coords[2 * otherIndex], _coords[2 * otherIndex + 1])

          if (MathUtil.isPointInTriangle(p, a, b, c)) {
            earFound = false
            break
          }
        }
      }

      if (earFound) {
        indexData.addTriangle(i0 + offset, i1 + offset, i2 + offset)
        sRestIndices.removeAt((restIndexPos + 1) % numRestIndices)

        numRestIndices--
        restIndexPos = 0
      } else {
        restIndexPos++
        if (restIndexPos === numRestIndices) break // no more ears
      }
    }

    Pool.putPoint(a)
    Pool.putPoint(b)
    Pool.putPoint(c)
    Pool.putPoint(p)

    indexData.addTriangle(
      Polygon.sRestIndices[0] + offset,
      Polygon.sRestIndices[1] + offset,
      Polygon.sRestIndices[2] + offset
    )
    return indexData
  }

  /** Copies all vertices to a 'VertexData' instance, beginning at a certain target index. */
  copyToVertexData(target = null, targetVertexID = 0, attrName = 'position') {
    const { _coords } = this
    const requiredTargetLength = targetVertexID + this.numVertices

    if (target.numVertices < requiredTargetLength)
      target.numVertices = requiredTargetLength

    for (let i = 0; i < this.numVertices; ++i) {
      target.setPoint(
        targetVertexID + i,
        attrName,
        _coords[i * 2],
        _coords[i * 2 + 1]
      )
    }
  }

  /** Creates a string that contains the values of all included points. */
  toString() {
    const { _coords } = this
    let result = '[Polygon'
    const numPoints = this.numVertices

    if (numPoints > 0) result += '\n'

    for (let i = 0; i < numPoints; ++i) {
      result +=
        '  [Vertex ' +
        i +
        ': ' +
        'x=' +
        _coords[i * 2].toFixed(1) +
        ', ' +
        'y=' +
        _coords[i * 2 + 1].toFixed(1) +
        ']' +
        (i === numPoints - 1 ? '\n' : ',\n')
    }

    return result + ']'
  }

  // factory methods

  /** Creates an ellipse with optimized implementations of triangulation, hitTest, etc. */
  static createEllipse(x, y, radiusX, radiusY, numSides = -1) {
    return new Ellipse(x, y, radiusX, radiusY, numSides)
  }

  /** Creates a circle with optimized implementations of triangulation, hitTest, etc. */
  static createCircle(x, y, radius, numSides = -1) {
    return new Ellipse(x, y, radius, radius, numSides)
  }

  /** Creates a rectangle with optimized implementations of triangulation, hitTest, etc. */
  static createRectangle(x, y, width, height) {
    return new Rectangle(x, y, width, height)
  }

  // helpers

  /** Calculates if the area of the triangle a->b->c is to on the right-hand side of a->b. */
  static isConvexTriangle(ax, ay, bx, by, cx, cy) {
    // dot product of [the normal of (a->b)] and (b->c) must be positive
    return (ay - by) * (cx - bx) + (bx - ax) * (cy - by) >= 0
  }

  /** Finds out if the vector a->b intersects c->d. */
  static areVectorsIntersecting(ax, ay, bx, by, cx, cy, dx, dy) {
    if ((ax === bx && ay === by) || (cx === dx && cy === dy)) return false // length = 0

    const abx = bx - ax
    const aby = by - ay
    const cdx = dx - cx
    const cdy = dy - cy
    const tDen = cdy * abx - cdx * aby

    if (tDen === 0.0) return false // parallel or identical

    const t = (aby * (cx - ax) - abx * (cy - ay)) / tDen

    if (t < 0 || t > 1) return false // outside c->d

    const s = aby ? (cy - ay + t * cdy) / aby : (cx - ax + t * cdx) / abx

    return s >= 0.0 && s <= 1.0 // inside a->b
  }

  // properties

  /** Indicates if the polygon's line segments are not self-intersecting.
   *  Beware: this is a brute-force implementation with <code>O(n^2)</code>. */
  get isSimple() {
    const { _coords } = this
    const numCoords = _coords.length
    if (numCoords <= 6) return true

    for (let i = 0; i < numCoords; i += 2) {
      const ax = _coords[i]
      const ay = _coords[i + 1]
      const bx = _coords[(i + 2) % numCoords]
      const by = _coords[(i + 3) % numCoords]
      const endJ = i + numCoords - 2

      for (let j = i + 4; j < endJ; j += 2) {
        const cx = _coords[j % numCoords]
        const cy = _coords[(j + 1) % numCoords]
        const dx = _coords[(j + 2) % numCoords]
        const dy = _coords[(j + 3) % numCoords]

        if (this.areVectorsIntersecting(ax, ay, bx, by, cx, cy, dx, dy))
          return false
      }
    }

    return true
  }

  /** Indicates if the polygon is convex. In a convex polygon, the vector between any two
   *  points inside the polygon lies inside it, as well. */
  get isConvex() {
    const { _coords } = this
    const numCoords = _coords.length

    if (numCoords < 6) return true
    else {
      for (let i = 0; i < numCoords; i += 2) {
        if (
          !this.isConvexTriangle(
            _coords[i],
            _coords[i + 1],
            _coords[(i + 2) % numCoords],
            _coords[(i + 3) % numCoords],
            _coords[(i + 4) % numCoords],
            _coords[(i + 5) % numCoords]
          )
        ) {
          return false
        }
      }
    }

    return true
  }

  /** Calculates the total area of the polygon. */
  get area() {
    let area = 0
    const numCoords = this._coords.length

    if (numCoords >= 6) {
      for (let i = 0; i < numCoords; i += 2) {
        area += this._coords[i] * this._coords[(i + 3) % numCoords]
        area -= this._coords[i + 1] * this._coords[(i + 2) % numCoords]
      }
    }

    return area / 2.0
  }

  /** Returns the total number of vertices spawning up the polygon. Assigning a value
   *  that's smaller than the current number of vertices will crop the path; a bigger
   *  value will fill up the path with zeros. */
  get numVertices() {
    return this._coords.length / 2
  }

  getNumVertices = () => this._coords.length / 2

  set numVertices(value) {
    const oldLength = this.numVertices
    this._coords.length = value * 2

    if (oldLength < value) {
      for (let i = oldLength; i < value; ++i)
        this._coords[i * 2] = this._coords[i * 2 + 1] = 0.0
    }
  }

  /** Returns the number of triangles that will be required when triangulating the polygon. */
  get numTriangles() {
    const numVertices = this.numVertices
    return numVertices >= 3 ? numVertices - 2 : 0
  }
}

class ImmutablePolygon extends Polygon {
  _frozen

  constructor(vertices) {
    super(vertices)
    this._frozen = true
  }

  addVertices(...args) {
    if (this._frozen) throw this.getImmutableError()
    else super.addVertices.apply(this, args)
  }

  setVertex(index, x, y) {
    if (this._frozen) throw this.getImmutableError()
    else super.setVertex(index, x, y)
  }

  reverse() {
    if (this._frozen) throw this.getImmutableError()
    else super.reverse()
  }

  get numVertices() {
    return super.numVertices
  }

  set numVertices(value) {
    if (this._frozen) throw this.getImmutableError()
    else super.reverse()
  }

  getImmutableError() {
    const className = 'Instance' // getQualifiedClassName(this).split("::").pop(); todo:
    const msg =
      className + " cannot be modified. Call 'clone' to create a mutable copy."
    return new Error(msg)
  }
}

class Ellipse extends ImmutablePolygon {
  _x
  _y
  _radiusX
  _radiusY

  constructor(x, y, radiusX, radiusY, numSides = -1) {
    if (numSides < 0) numSides = (Math.PI * (radiusX + radiusY)) / 4.0
    if (numSides < 6) numSides = 6

    const vertices = []
    const angleDelta = (2 * Math.PI) / numSides
    let angle = 0

    for (let i = 0; i < numSides; ++i) {
      vertices[i * 2] = Math.cos(angle) * radiusX + x
      vertices[i * 2 + 1] = Math.sin(angle) * radiusY + y
      angle += angleDelta
    }

    super(vertices)

    this._x = x
    this._y = y
    this._radiusX = radiusX
    this._radiusY = radiusY
  }

  triangulate(indexData = null, offset = 0) {
    if (!indexData) indexData = new IndexData((this.numVertices - 2) * 3)

    const from = 1
    const to = this.numVertices - 1

    for (let i = from; i < to; ++i) {
      indexData.addTriangle(offset, offset + i, offset + i + 1)
    }

    return indexData
  }

  contains(x, y) {
    const vx = x - this._x
    const vy = y - this._y

    const a = vx / this._radiusX
    const b = vy / this._radiusY

    return a * a + b * b <= 1
  }

  get area() {
    return Math.PI * this._radiusX * this._radiusY
  }

  get isSimple() {
    return true
  }

  get isConvex() {
    return true
  }
}

class Rectangle extends ImmutablePolygon {
  _x
  _y
  _width
  _height

  constructor(x, y, width, height) {
    super([x, y, x + width, y, x + width, y + height, x, y + height])
    this._x = x
    this._y = y
    this._width = width
    this._height = height
  }

  triangulate(indexData = null, offset = 0) {
    if (!indexData) indexData = new IndexData(6)

    indexData.addTriangle(offset, offset + 1, offset + 3)
    indexData.addTriangle(offset + 1, offset + 2, offset + 3)

    return indexData
  }

  contains(x, y) {
    return (
      x >= this._x &&
      x <= this._x + this._width &&
      y >= this._y &&
      y <= this._y + this._height
    )
  }

  get area() {
    return this._width * this._height
  }

  get isSimple() {
    return true
  }

  get isConvex() {
    return true
  }
}
