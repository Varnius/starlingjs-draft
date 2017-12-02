import BatchToken from './batch-token';

import MeshBatch from '../display/mesh-batch';

import MeshSubset from '../utils/mesh-subset';

/** This class manages a list of mesh batches of different types;
 *  it acts as a "meta" MeshBatch that initiates all rendering.
 */
export default class BatchProcessor {
    _batches;
    _batchPool;
    _currentBatch;
    _currentStyleType;
    _onBatchComplete;
    _cacheToken;

    // helper objects
    static sMeshSubset = new MeshSubset();

    /** Creates a new batch processor. */
    constructor()
    {
        this._batches = [];
        this._batchPool = new BatchPool();
        this._cacheToken = new BatchToken();
    }

    /** Disposes all batches (including those in the reusable pool). */
    dispose()
    {
        for (const batch of this._batches)
            batch.dispose();

        this._batches.length = 0;
        this._batchPool.purge();
        this._currentBatch = null;
        this._onBatchComplete = null;
    }

    /** Adds a mesh to the current batch, or to a new one if the current one does not support
     *  it. Whenever the batch changes, <code>onBatchComplete</code> is called for the previous
     *  one.
     *
     *  @param mesh       the mesh to add to the current (or new) batch.
     *  @param state      the render state from which to take the current settings for alpha,
     *                    modelview matrix, and blend mode.
     *  @param subset     the subset of the mesh you want to add, or <code>null</code> for
     *                    the complete mesh.
     *  @param ignoreTransformations   when enabled, the mesh's vertices will be added
     *                    without transforming them in any way (no matter the value of the
     *                    state's <code>modelviewMatrix</code>).
     */
    addMesh(mesh, state, subset = null, ignoreTransformations = false)
    {
        const { _cacheToken } = this;

        if (!subset)
        {
            subset = BatchProcessor.sMeshSubset;
            subset.vertexID = subset.indexID = 0;
            subset.numVertices = mesh.numVertices;
            subset.numIndices = mesh.numIndices;
        }
        else
        {
            if (subset.numVertices < 0) subset.numVertices = mesh.numVertices - subset.vertexID;
            if (subset.numIndices < 0) subset.numIndices = mesh.numIndices - subset.indexID;
        }

        if (subset.numVertices > 0)
        {
            if (!this._currentBatch || !this._currentBatch.canAddMesh(mesh, subset.numVertices))
            {
                this.finishBatch();

                this._currentStyleType = mesh.style.type;
                this._currentBatch = this._batchPool.get(this._currentStyleType);
                this._currentBatch.blendMode = state ? state.blendMode : mesh.blendMode;
                this._cacheToken.setTo(this._batches.length);
                this._batches[this._batches.length] = this._currentBatch;
            }

            const matrix = state ? state._modelviewMatrix : null;
            const alpha = state ? state._alpha : 1.0;

            this._currentBatch.addMesh(mesh, matrix, alpha, subset, ignoreTransformations);
            _cacheToken.vertexID += subset.numVertices;
            _cacheToken.indexID += subset.numIndices;
        }
    }

    /** Finishes the current batch, i.e. call the 'onComplete' callback on the batch and
     *  prepares initialization of a new one. */
    finishBatch()
    {
        const meshBatch = this._currentBatch;

        if (meshBatch)
        {
            this._currentBatch = null;
            this._currentStyleType = null;

            if (this._onBatchComplete)
                this._onBatchComplete(meshBatch);
        }
    }

    /** Clears all batches and adds them to a pool so they can be reused later. */
    clear()
    {
        const numBatches = this._batches.length;

        for (let i = 0; i < numBatches; ++i)
            this._batchPool.put(this._batches[i]);

        this._batches.length = 0;
        this._currentBatch = null;
        this._currentStyleType = null;
        this._cacheToken.reset();
    }

    /** Returns the batch at a certain index. */
    getBatchAt(batchID)
    {
        return this._batches[batchID];
    }

    /** Disposes all batches that are currently unused. */
    trim()
    {
        this._batchPool.purge();
    }

    /** Sets all properties of the given token so that it describes the current position
     *  within this instance. */
    fillToken(token)
    {
        token.batchID = this._cacheToken.batchID;
        token.vertexID = this._cacheToken.vertexID;
        token.indexID = this._cacheToken.indexID;
        return token;
    }

    /** The number of batches currently stored in the BatchProcessor. */
    get numBatches()
    {
        return this._batches.length;
    }

    /** This callback is executed whenever a batch is finished and replaced by a new one.
     *  The finished MeshBatch is passed to the callback. Typically, this callback is used
     *  to actually render it. */
    get onBatchComplete()
    {
        return this._onBatchComplete;
    }

    set onBatchComplete(value)
    {
        this._onBatchComplete = value;
    }
}

class BatchPool {
    _batchLists;

    constructor()
    {
        this._batchLists = new Map();
    }

    purge()
    {
        for (const batchList of this._batchLists)
        {
            for (let i = 0; i < batchList.length; ++i)
                batchList[i].dispose();

            batchList.length = 0;
        }
    }

    get(styleType)
    {
        let batchList = this._batchLists[styleType];
        if (!batchList)
        {
            batchList = [];
            this._batchLists[styleType] = batchList;
        }

        if (batchList.length > 0) return batchList.pop();
        else return new MeshBatch();
    }

    put(meshBatch)
    {
        const styleType = meshBatch.style.type;
        let batchList = this._batchLists[styleType];
        if (!batchList)
        {
            batchList = [];
            this._batchLists[styleType] = batchList;
        }

        meshBatch.clear();
        batchList[batchList.length] = meshBatch;
    }
}
