import Mesh from './mesh';

import IndexData from '../rendering/index-data';
import VertexData from '../rendering/vertex-data';

import MatrixUtil from '../utils/matrix-util';
import MeshSubset from '../utils/mesh-subset';

/** Combines a number of meshes to one display object and renders them efficiently.
 *
 *  <p>The most basic tangible (non-container) display object in Starling is the Mesh.
 *  However, a mesh typically does not render itself; it just holds the data describing its
 *  geometry. Rendering is orchestrated by the "MeshBatch" class. As its name suggests, it
 *  acts as a batch for an arbitrary number of Mesh instances; add meshes to a batch and they
 *  are all rendered together, in one draw call.</p>
 *
 *  <p>You can only batch meshes that share similar properties, e.g. they need to have the
 *  same texture and the same blend mode. The first object you add to a batch will decide
 *  this state; call <code>canAddMesh</code> to find out if a new mesh shares that state.
 *  To reset the current state, you can call <code>clear</code>; this will also remove all
 *  geometry that has been added thus far.</p>
 *
 *  <p>Starling will use MeshBatch instances (or compatible objects) for all rendering.
 *  However, you can also instantiate MeshBatch instances yourself and add them to the display
 *  tree. That makes sense for an object containing a large number of meshes; that way, that
 *  object can be created once and then rendered very efficiently, without having to copy its
 *  vertices and indices between buffers and GPU memory.</p>
 *
 *  @see Mesh
 *  @see Sprite
 */
export default class MeshBatch extends Mesh {
    /** The maximum number of vertices that fit into one MeshBatch. */
    static MAX_NUM_VERTICES = 65535;

    _effect;
    _batchable;
    _vertexSyncRequired;
    _indexSyncRequired;

    // helper object
    static sFullMeshSubset = new MeshSubset();

    /** Creates a new, empty MeshBatch instance. */
    constructor()
    {
        const vertexData = new VertexData();
        const indexData = new IndexData();

        super(vertexData, indexData);
    }

    /** @inheritDoc */
    dispose()
    {
        if (this._effect) this._effect.dispose();
        super.dispose();
    }

    /** This method must be called whenever the mesh's vertex data was changed. Makes
     *  sure that the vertex buffer is synchronized before rendering, and forces a redraw. */
    setVertexDataChanged()
    {
        this._vertexSyncRequired = true;
        super.setVertexDataChanged();
    }

    /** This method must be called whenever the mesh's index data was changed. Makes
     *  sure that the index buffer is synchronized before rendering, and forces a redraw. */
    setIndexDataChanged()
    {
        this._indexSyncRequired = true;
        super.setIndexDataChanged();
    }

    setVertexAndIndexDataChanged()
    {
        this._vertexSyncRequired = this._indexSyncRequired = true;
    }

    syncVertexBuffer()
    {
        this._effect.uploadVertexData(this._vertexData);
        this._vertexSyncRequired = false;
    }

    syncIndexBuffer()
    {
        this._effect.uploadIndexData(this._indexData);
        this._indexSyncRequired = false;
    }

    /** Removes all geometry. */
    clear()
    {
        if (this._parent) this.setRequiresRedraw();

        this._vertexData.numVertices = 0;
        this._indexData.numIndices = 0;
        this._vertexSyncRequired = true;
        this._indexSyncRequired = true;
    }

    /** Adds a mesh to the batch by appending its vertices and indices.
     *
     *  @param mesh      the mesh to add to the batch.
     *  @param matrix    transform all vertex positions with a certain matrix. If this
     *                   parameter is omitted, <code>mesh.transformationMatrix</code>
     *                   will be used instead (except if the last parameter is enabled).
     *  @param alpha     will be multiplied with each vertex' alpha value.
     *  @param subset    the subset of the mesh you want to add, or <code>null</code> for
     *                   the complete mesh.
     *  @param ignoreTransformations   when enabled, the mesh's vertices will be added
     *                   without transforming them in any way (no matter the value of the
     *                   <code>matrix</code> parameter).
     */
    addMesh(mesh, matrix = null, alpha = 1.0, subset = null, ignoreTransformations = false)
    {
        if (ignoreTransformations) matrix = null;
        else if (!matrix) matrix = mesh.transformationMatrix;
        if (!subset) subset = MeshBatch.sFullMeshSubset;

        const targetVertexID = this._vertexData.numVertices;
        const targetIndexID = this._indexData.numIndices;
        const meshStyle = mesh._style;

        if (targetVertexID === 0)
            this.setupFor(mesh);

        meshStyle.batchVertexData(this._style, targetVertexID, matrix, subset.vertexID, subset.numVertices);
        meshStyle.batchIndexData(this._style, targetIndexID, targetVertexID - subset.vertexID, subset.indexID, subset.numIndices);

        if (alpha !== 1.0) this._vertexData.scaleAlphas('color', alpha, targetVertexID, subset.numVertices);
        if (this._parent) this.setRequiresRedraw();

        this._indexSyncRequired = this._vertexSyncRequired = true;
    }

    /** Adds a mesh to the batch by copying its vertices and indices to the given positions.
     *  Beware that you need to check for yourself if those positions make sense; for example,
     *  you need to make sure that they are aligned within the 3-indices groups making up
     *  the mesh's triangles.
     *
     *  <p>It's easiest to only add objects with an identical setup, e.g. only quads.
     *  For the latter, indices are aligned in groups of 6 (one quad requires six indices),
     *  and the vertices in groups of 4 (one vertex for every corner).</p>
     */
    addMeshAt(mesh, indexID, vertexID)
    {
        const numIndices = mesh.numIndices;
        const numVertices = mesh.numVertices;
        const matrix = mesh.transformationMatrix;
        const meshStyle = mesh._style;

        if (this._vertexData.numVertices === 0)
            this.setupFor(mesh);

        meshStyle.batchVertexData(this._style, vertexID, matrix, 0, numVertices);
        meshStyle.batchIndexData(this._style, indexID, vertexID, 0, numIndices);

        if (this.alpha !== 1.0) this._vertexData.scaleAlphas('color', this.alpha, vertexID, numVertices);
        if (this._parent) this.setRequiresRedraw();

        this._indexSyncRequired = this._vertexSyncRequired = true;
    }

    setupFor(mesh)
    {
        const meshStyle = mesh._style;
        const meshStyleType = meshStyle.type;

        if (this._style.type !== meshStyleType)
        {
            const newStyle = new meshStyleType();
            newStyle.copyFrom(meshStyle);
            this.setStyle(newStyle, false);
        }
        else
        {
            this._style.copyFrom(meshStyle);
        }
    }

    /** Indicates if the given mesh instance fits to the current state of the batch.
     *  Will always return <code>true</code> for the first added mesh; later calls
     *  will check if the style matches and if the maximum number of vertices is not
     *  exceeded.
     *
     *  @param mesh         the mesh to add to the batch.
     *  @param numVertices  if <code>-1</code>, <code>mesh.numVertices</code> will be used
     */
    canAddMesh(mesh, numVertices = -1)
    {
        const currentNumVertices = this._vertexData.numVertices;

        if (currentNumVertices === 0) return true;
        if (numVertices < 0) numVertices = mesh.numVertices;
        if (numVertices === 0) return true;
        if (numVertices + currentNumVertices > MeshBatch.MAX_NUM_VERTICES) return false;

        return this._style.canBatchWith(mesh._style);
    }

    /** If the <code>batchable</code> property is enabled, this method will add the batch
     *  to the painter's current batch. Otherwise, this will actually do the drawing. */
    render(painter)
    {
        if (this._vertexData.numVertices === 0) return;
        if (this._pixelSnapping) MatrixUtil.snapToPixels(
            painter.state.modelviewMatrix, painter.pixelSize);

        if (this._batchable)
        {
            painter.batchMesh(this);
        }
        else
        {
            painter.finishMeshBatch();
            painter.drawCount += 1;
            painter.prepareToDraw();
            painter.excludeFromCache(this);

            if (this._vertexSyncRequired) this.syncVertexBuffer();
            if (this._indexSyncRequired) this.syncIndexBuffer();

            this._style.updateEffect(this._effect, painter.state);
            this._effect.render(0, this._indexData.numTriangles);
        }
    }

    /** @inheritDoc */
    setStyle(meshStyle = null, mergeWithPredecessor = true)
    {
        super.setStyle(meshStyle, mergeWithPredecessor);

        if (this._effect)
            this._effect.dispose();

        this._effect = this.style.createEffect();
        this._effect.onRestore = this.setVertexAndIndexDataChanged;

        this.setVertexAndIndexDataChanged(); // we've got a new set of buffers!
    }

    get numVertices()
    {
        return super.numVertices;
    }

    /** The total number of vertices in the mesh. If you change this to a smaller value,
     *  the surplus will be deleted. Make sure that no indices reference those deleted
     *  vertices! */
    set numVertices(value)
    {
        if (this._vertexData.numVertices !== value)
        {
            this._vertexData.numVertices = value;
            this._vertexSyncRequired = true;
            this.setRequiresRedraw();
        }
    }

    get numIndices()
    {
        return super.numIndices;
    }

    /** The total number of indices in the mesh. If you change this to a smaller value,
     *  the surplus will be deleted. Always make sure that the number of indices
     *  is a multiple of three! */
    set numIndices(value)
    {
        if (this._indexData.numIndices !== value)
        {
            this._indexData.numIndices = value;
            this._indexSyncRequired = true;
            this.setRequiresRedraw();
        }
    }

    /** Indicates if this object will be added to the painter's batch on rendering,
     *  or if it will draw itself right away.
     *
     *  <p>Only batchable meshes can profit from the render cache; but batching large meshes
     *  may take up a lot of CPU time. Activate this property only if the batch contains just
     *  a handful of vertices (say, 20 quads).</p>
     *
     *  @default false
     */
    get batchable()
    {
        return this._batchable;
    }

    set batchable(value)
    {
        if (this._batchable !== value)
        {
            this._batchable = value;
            this.setRequiresRedraw();
        }
    }
}
