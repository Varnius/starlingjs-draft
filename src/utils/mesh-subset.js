/** A class describing a range of vertices and indices, thus referencing a subset of a Mesh. */
export default class MeshSubset {
  /** The ID of the first vertex. */
  vertexID

  /** The total number of vertices. */
  numVertices

  /** The ID of the first index. */
  indexID

  /** The total number of indices. */
  numIndices

  /** Creates a new MeshSubset. */
  constructor(vertexID = 0, numVertices = -1, indexID = 0, numIndices = -1) {
    this.setTo(vertexID, numVertices, indexID, numIndices)
  }

  /** Changes all properties at once.
   *  Call without any arguments to reference a complete mesh. */
  setTo(vertexID = 0, numVertices = -1, indexID = 0, numIndices = -1) {
    this.vertexID = vertexID
    this.numVertices = numVertices
    this.indexID = indexID
    this.numIndices = numIndices
  }
}
