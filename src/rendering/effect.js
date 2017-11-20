import Starling from '../core/starling';

import VertexDataFormat from './vertex-data-format';

import Matrix3D from '../math/matrix3d';

/** An effect encapsulates all steps of a Stage3D draw operation. It configures the
 *  render context and sets up shader programs as well as index- and vertex-buffers, thus
 *  providing the basic mechanisms of all low-level rendering.
 *
 *  <p><strong>Using the Effect class</strong></p>
 *
 *  <p>Effects are mostly used by the <code>MeshStyle</code> and <code>FragmentFilter</code>
 *  classes. When you extend those classes, you'll be required to provide a custom effect.
 *  Setting it up for rendering is done by the base class, though, so you rarely have to
 *  initiate the rendering yourself. Nevertheless, it's good to know how an effect is doing
 *  its work.</p>
 *
 *  <p>Using an effect always follows steps shown in the example below. You create the
 *  effect, configure it, upload vertex data and then: draw!</p>
 *
 *  <listing>
 *  // create effect
 *  var effect:MeshEffect = new MeshEffect();
 *
 *  // configure effect
 *  effect.mvpMatrix3D = painter.state.mvpMatrix3D;
 *  effect.texture = getHeroTexture();
 *  effect.color = 0xf0f0f0;
 *
 *  // upload vertex data
 *  effect.uploadIndexData(indexData);
 *  effect.uploadVertexData(vertexData);
 *
 *  // draw!
 *  effect.render(0, numTriangles);</listing>
 *
 *  <p>Note that the <code>VertexData</code> being uploaded has to be created with the same
 *  format as the one returned by the effect's <code>vertexFormat</code> property.</p>
 *
 *  <p><strong>Extending the Effect class</strong></p>
 *
 *  <p>The base <code>Effect</code>-class can only render white triangles, which is not much
 *  use in itself. However, it is designed to be extended; subclasses can easily implement any
 *  kinds of shaders.</p>
 *
 *  <p>Normally, you won't extend this class directly, but either <code>FilterEffect</code>
 *  or <code>MeshEffect</code>, depending on your needs (i.e. if you want to create a new
 *  fragment filter or a new mesh style). Whichever base class you're extending, you should
 *  override the following methods:</p>
 *
 *  <ul>
 *    <li><code>createProgram():Program</code> — must create the actual program containing
 *        vertex- and fragment-shaders. A program will be created only once for each render
 *        context; this is taken care of by the base class.</li>
 *    <li><code>get programVariantName():uint</code> (optional) — override this if your
 *        effect requires different programs, depending on its settings. The recommended
 *        way to do this is via a bit-mask that uniquely encodes the current settings.</li>
 *    <li><code>get vertexFormat()</code> (optional) — must return the
 *        <code>VertexData</code> format that this effect requires for its vertices. If
 *        the effect does not require any special attributes, you can leave this out.</li>
 *    <li><code>beforeDraw(context:Context3D)</code> — Set up your context by
 *        configuring program constants and buffer attributes.</li>
 *    <li><code>afterDraw(context:Context3D)</code> — Will be called directly after
 *        <code>context.drawTriangles()</code>. Clean up any context configuration here.</li>
 *  </ul>
 *
 *  <p>Furthermore, you need to add properties that manage the data you require on rendering,
 *  e.g. the texture(s) that should be used, program constants, etc. I recommend looking at
 *  the implementations of Starling's <code>FilterEffect</code> and <code>MeshEffect</code>
 *  classes to see how to approach sub-classing.</p>
 *
 *  @see FilterEffect
 *  @see MeshEffect
 *  @see starling.styles.MeshStyle
 *  @see starling.filters.FragmentFilter
 *  @see starling.utils.RenderUtil
 */
export default class Effect {
    /** The vertex format expected by <code>uploadVertexData</code>:
     *  <code>'position:float2'</code> */
    static VERTEX_FORMAT = VertexDataFormat.fromString('position:float2');

    _vertexBuffer;
    _vertexBufferSize; // in bytes
    _indexBuffer;
    _indexBufferSize;  // in number of indices
    _indexBufferUsesQuadLayout;

    _mvpMatrix3D;
    _onRestore;
    _programBaseName;

    // helper objects
    static sProgramNameCache = new Map();

    /** Creates a new effect. */
    constructor()
    {
        this._mvpMatrix3D = new Matrix3D();
        this._programBaseName = getQualifiedClassName(this);

        // Handle lost context (using conventional Flash event for weak listener support)
        Starling.current.stage3D.addEventListener(Event.CONTEXT3D_CREATE,
            this.onContextCreated, false, 20, true);
    }

    /** Purges the index- and vertex-buffers. */
    dispose()
    {
        Starling.current.stage3D.removeEventListener(Event.CONTEXT3D_CREATE, this.onContextCreated);
        this.purgeBuffers();
    }

    onContextCreated()
    {
        this.purgeBuffers();
        this.execute(this._onRestore, this);
    }

    /** Purges one or both of the vertex- and index-buffers. */
    purgeBuffers(vertexBuffer = true, indexBuffer = true)
    {
        // We wrap the dispose calls in a try/catch block to work around a stage3D problem.
        // Since they are not re-used later, that shouldn't have any evil side effects.

        if (this._vertexBuffer && vertexBuffer)
        {
            try
            {
                this._vertexBuffer.dispose();
            }
            catch (e)
            {
                //
            }
            this._vertexBuffer = null;
        }

        if (this._indexBuffer && indexBuffer)
        {
            try
            {
                this._indexBuffer.dispose();
            }
            catch (e)
            {
                //
            }
            this._indexBuffer = null;
        }
    }

    /** Uploads the given index data to the internal index buffer. If the buffer is too
     *  small, a new one is created automatically.
     *
     *  @param indexData   The IndexData instance to upload.
     *  @param bufferUsage The expected buffer usage. Use one of the constants defined in
     *                     <code>Context3DBufferUsage</code>. Only used when the method call
     *                     causes the creation of a new index buffer.
     */
    uploadIndexData(indexData, bufferUsage = 'staticDraw')
    {
        const numIndices = indexData.numIndices;
        const isQuadLayout = indexData.useQuadLayout;
        const wasQuadLayout = this._indexBufferUsesQuadLayout;

        if (this._indexBuffer)
        {
            if (numIndices <= this._indexBufferSize)
            {
                if (!isQuadLayout || !wasQuadLayout)
                {
                    indexData.uploadToIndexBuffer(this._indexBuffer);
                    this._indexBufferUsesQuadLayout = isQuadLayout && numIndices === this._indexBufferSize;
                }
            }
            else
                this.purgeBuffers(false, true);
        }
        if (this._indexBuffer === null)
        {
            this._indexBuffer = indexData.createIndexBuffer(true, bufferUsage);
            this._indexBufferSize = numIndices;
            this._indexBufferUsesQuadLayout = isQuadLayout;
        }
    }

    /** Uploads the given vertex data to the internal vertex buffer. If the buffer is too
     *  small, a new one is created automatically.
     *
     *  @param vertexData  The VertexData instance to upload.
     *  @param bufferUsage The expected buffer usage. Use one of the constants defined in
     *                     <code>Context3DBufferUsage</code>. Only used when the method call
     *                     causes the creation of a new vertex buffer.
     */
    uploadVertexData(vertexData,
                     bufferUsage = 'staticDraw')
    {
        if (this._vertexBuffer)
        {
            if (vertexData.size <= this._vertexBufferSize)
                vertexData.uploadToVertexBuffer(this._vertexBuffer);
            else
                this.purgeBuffers(true, false);
        }
        if (this._vertexBuffer === null)
        {
            this._vertexBuffer = vertexData.createVertexBuffer(true, bufferUsage);
            this._vertexBufferSize = vertexData.size;
        }
    }

    // rendering

    /** Draws the triangles described by the index- and vertex-buffers, or a range of them.
     *  This calls <code>beforeDraw</code>, <code>context.drawTriangles</code>, and
     *  <code>afterDraw</code>, in this order. */
    render(firstIndex = 0, numTriangles = -1)
    {
        if (numTriangles < 0) numTriangles = this._indexBufferSize / 3;
        if (numTriangles === 0) return;

        const context = Starling.context;
        if (context === null) throw new Error('[MissingContextError]');

        this.beforeDraw(context);
        context.drawTriangles(this.indexBuffer, firstIndex, numTriangles);
        this.afterDraw(context);
    }

    /** This method is called by <code>render</code>, directly before
     *  <code>context.drawTriangles</code>. It activates the program and sets up
     *  the context with the following constants and attributes:
     *
     *  <ul>
     *    <li><code>vc0-vc3</code> — MVP matrix</li>
     *    <li><code>va0</code> — vertex position (xy)</li>
     *  </ul>
     */
    beforeDraw(context)
    {
        this.program.activate(context);
        this.vertexFormat.setVertexBufferAt(0, this.vertexBuffer, 'position');
        context.setProgramConstantsFromMatrix(Context3DProgramType.VERTEX, 0, this.mvpMatrix3D, true);
    }

    /** This method is called by <code>render</code>, directly after
     *  <code>context.drawTriangles</code>. Resets vertex buffer attributes.
     */
    afterDraw(context)
    {
        context.setVertexBufferAt(0, null);
    }

    // program management

    /** Creates the program (a combination of vertex- and fragment-shader) used to render
     *  the effect with the current settings. Override this method in a subclass to create
     *  your shaders. This method will only be called once; the program is automatically stored
     *  in the <code>Painter</code> and re-used by all instances of this effect.
     *
     *  <p>The basic implementation always outputs pure white.</p>
     */
    createProgram() // eslint-disable-line
    {
        const vertexShader = [
            'm44 op, va0, vc0', // 4x4 matrix transform to output clipspace
            'seq v0, va0, va0',  // this is a hack that always produces '1'
        ].join('\n');

        const fragmentShader =
            'mov oc, v0';       // output color: white

        return Program.fromSource(vertexShader, fragmentShader);
    }

    /** Override this method if the effect requires a different program depending on the
     *  current settings. Ideally, you do this by creating a bit mask encoding all the options.
     *  This method is called often, so do not allocate any temporary objects when overriding.
     *
     *  @default 0
     */
    get programVariantName() //eslint-disable-line
    {
        return 0;
    }

    /** Returns the base name for the program.
     *  @default the fully qualified class name
     */
    get programBaseName()
    {
        return this._programBaseName;
    }

    set programBaseName(value)
    {
        this._programBaseName = value;
    }

    /** Returns the full name of the program, which is used to register it at the current
     *  <code>Painter</code>.
     *
     *  <p>The default implementation efficiently combines the program's base and variant
     *  names (e.g. <code>LightEffect#42</code>). It shouldn't be necessary to override
     *  this method.</p>
     */
    get programName()
    {
        const baseName = this.programBaseName;
        const variantName = this.programVariantName;
        let nameCache = Effect.sProgramNameCache[baseName];

        if (nameCache === null)
        {
            nameCache = new Map();
            Effect.sProgramNameCache[baseName] = nameCache;
        }

        let name = nameCache[variantName];

        if (name === null)
        {
            if (variantName) name = baseName + '#' + variantName.toString(16);
            else name = baseName;

            nameCache[variantName] = name;
        }

        return name;
    }

    /** Returns the current program, either by creating a new one (via
     *  <code>createProgram</code>) or by getting it from the <code>Painter</code>.
     *  Do not override this method! Instead, implement <code>createProgram</code>. */
    get program()
    {
        const name = this.programName;
        const painter = Starling.painter;
        let program = painter.getProgram(name);

        if (program === null)
        {
            program = this.createProgram();
            painter.registerProgram(name, program);
        }

        return program;
    }

    // properties

    /** The function that you provide here will be called after a context loss.
     *  Call both 'upload...' methods from within the callback to restore any vertex or
     *  index buffers. The callback will be executed with the effect as its sole parameter. */
    get onRestore()
    {
        return this._onRestore;
    }

    set onRestore(value)
    {
        this._onRestore = value;
    }

    /** The data format that this effect requires from the VertexData that it renders:
     *  <code>'position:float2'</code> */
    get vertexFormat() // eslint-disable-line
    {
        return Effect.VERTEX_FORMAT;
    }

    /** The MVP (modelview-projection) matrix transforms vertices into clipspace. */
    get mvpMatrix3D()
    {
        return this._mvpMatrix3D;
    }

    set mvpMatrix3D(value)
    {
        this._mvpMatrix3D.copyFrom(value);
    }

    /** The internally used index buffer used on rendering. */
    get indexBuffer()
    {
        return this._indexBuffer;
    }

    /** The current size of the index buffer (in number of indices). */
    get indexBufferSize()
    {
        return this._indexBufferSize;
    }

    /** The internally used vertex buffer used on rendering. */
    get vertexBuffer()
    {
        return this._vertexBuffer;
    }

    /** The current size of the vertex buffer (in blocks of 32 bits). */
    get vertexBufferSize()
    {
        return this._vertexBufferSize;
    }
}
