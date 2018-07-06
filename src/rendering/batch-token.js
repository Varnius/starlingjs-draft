/** Points to a location within a list of MeshBatches.
 *
 *  <p>Starling uses these tokens in its render cache. Each call to
 *  <code>painter.pushState()</code> or <code>painter.popState()</code> provides a token
 *  referencing the current location within the cache. In the next frame, if the relevant
 *  part of the display tree has not changed, these tokens can be used to render directly
 *  from the cache instead of constructing new MeshBatches.</p>
 *
 *  @see Painter
 */
export default class BatchToken {
  /** The ID of the current MeshBatch. */
  batchID

  /** The ID of the next vertex within the current MeshBatch. */
  vertexID

  /** The ID of the next index within the current MeshBatch. */
  indexID

  /** Creates a new BatchToken. */
  constructor(batchID = 0, vertexID = 0, indexID = 0) {
    this.setTo(batchID, vertexID, indexID)
  }

  /** Copies the properties from the given token to this instance. */
  copyFrom(token) {
    this.batchID = token.batchID
    this.vertexID = token.vertexID
    this.indexID = token.indexID
  }

  /** Changes all properties at once. */
  setTo(batchID = 0, vertexID = 0, indexID = 0) {
    this.batchID = batchID
    this.vertexID = vertexID
    this.indexID = indexID
  }

  /** Resets all properties to zero. */
  reset() {
    this.batchID = this.vertexID = this.indexID = 0
  }

  /** Indicates if this token contains the same values as the given one. */
  equals(other) {
    return (
      this.batchID === other.batchID &&
      this.vertexID === other.vertexID &&
      this.indexID === other.indexID
    )
  }

  /** Creates a String representation of this instance. */
  toString() {
    return `[BatchToken batchID=${this.batchID} vertexID=${
      this.vertexID
    } indexID=${this.indexID}]`
  }
}
