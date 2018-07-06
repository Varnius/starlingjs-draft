export default class Helpers {
  static compareRectangles(rect1, rect2, e = 0.0001) {
    expect(rect1.x).to.be.closeTo(rect2.x, e)
    expect(rect1.y).to.be.closeTo(rect2.y, e)
    expect(rect1.width).to.be.closeTo(rect2.width, e)
    expect(rect1.height).to.be.closeTo(rect2.height, e)
  }

  static comparePoints(point1, point2, e = 0.0001) {
    expect(point1.x).to.be.closeTo(point2.x, e)
    expect(point1.y).to.be.closeTo(point2.y, e)
  }

  static compareVector3Ds(v1, v2, e = 0.0001) {
    expect(v1.x).to.be.closeTo(v2.x, e)
    expect(v1.y).to.be.closeTo(v2.y, e)
    expect(v1.z).to.be.closeTo(v2.z, e)
    expect(v1.w).to.be.closeTo(v2.w, e)
  }

  static compareDataViews(viewA, viewB) {
    expect(viewA.byteLength, viewB.byteLength)

    let pos = 0

    while (pos < viewA.byteLength) {
      expect(viewA.getUint32(pos)).to.equal(viewB.getUint32(pos))
      pos += 4
    }
  }

  //public static function compareVectorsOfNumbers(vector1:Vector.<Number>, vector2:Vector.<Number>,
  //                                               e:Number=0.0001):void
  //{
  //    assertEquals(vector1.length, vector2.length);
  //
  //    for (var i:int=0; i<vector1.length; ++i)
  //        assertThat(vector1[i], closeTo(vector2[i], e));
  //}
  //
  //public static function compareVectorsOfUints(vector1:Vector.<uint>, vector2:Vector.<uint>):void
  //{
  //    assertEquals(vector1.length, vector2.length);
  //
  //    for (var i:int=0; i<vector1.length; ++i)
  //        assertEquals(vector1[i], vector2[i]);
  //}

  //static compareTypedArrays(array1, array2) {
  //    expect(array1.length).to.equal(array2.length);
  //    let pos = array1.length;
  //
  //    while (pos--) {
  //        expect(array1[pos]).to.equal(array2[pos]);
  //    }
  //}

  //public static function compareByteArraysOfFloats(b1:ByteArray, b2:ByteArray, e:Number=0.0001):void
  //{
  //    assertEquals(b1.endian, b2.endian);
  //    assertEquals(b1.length, b2.length);
  //    b1.position = b2.position = 0;
  //
  //    while (b1.bytesAvailable)
  //        assertThat(b1.readFloat(), closeTo(b2.readFloat(), e));
  //}

  static compareMatrices(matrix1, matrix2, e = 0.0001) {
    expect(matrix1.a).to.be.closeTo(matrix2.a, e)
    expect(matrix1.b).to.be.closeTo(matrix2.b, e)
    expect(matrix1.c).to.be.closeTo(matrix2.c, e)
    expect(matrix1.d).to.be.closeTo(matrix2.d, e)
    expect(matrix1.tx).to.be.closeTo(matrix2.tx, e)
    expect(matrix1.ty).to.be.closeTo(matrix2.ty, e)
  }
}
