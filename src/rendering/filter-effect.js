import Effect from './effect';
import TextureSmoothing from '../textures/texture-smoothing';
import RenderUtil from '../utils/render-util';

/** An effect drawing a mesh of textured vertices.
 *  This is the standard effect that is the base for all fragment filters;
 *  if you want to create your own fragment filters, you will have to extend this class.
 *
 *  <p>For more information about the usage and creation of effects, please have a look at
 *  the documentation of the parent class, 'Effect'.</p>
 *
 *  @see Effect
 *  @see MeshEffect
 *  @see starling.filters.FragmentFilter
 */
export default class FilterEffect extends Effect {
    /** The vertex format expected by <code>uploadVertexData</code>:
     *  <code>'position:float2, texCoords:float2'</code> */
    static VERTEX_FORMAT = Effect.VERTEX_FORMAT.extend('texCoords:float2');

    /** The AGAL code for the standard vertex shader that most filters will use.
     *  It simply transforms the vertex coordinates to clip-space and passes the texture
     *  coordinates to the fragment program (as 'v0'). */
    static STD_VERTEX_SHADER =
        'm44 op, va0, vc0 \n' +  // 4x4 matrix transform to output clip-space
        'mov v0, va1';          // pass texture coordinates to fragment program

    _texture;
    _textureSmoothing;
    _textureRepeat;

    /** Creates a new FilterEffect instance. */
    constructor()
    {
        super();
        this._textureSmoothing = TextureSmoothing.BILINEAR;
    }

    /** Override this method if the effect requires a different program depending on the
     *  current settings. Ideally, you do this by creating a bit mask encoding all the options.
     *  This method is called often, so do not allocate any temporary objects when overriding.
     *
     *  <p>Reserve 4 bits for the variant name of the base class.</p>
     */
    get programVariantName()
    {
        return RenderUtil.getTextureVariantBits(this._texture); // todo: implement
    }

    /** @private */
    createProgram()
    {
        if (this._texture)
        {
            const vertexShader = FilterEffect.STD_VERTEX_SHADER;
            const fragmentShader = FilterEffect.tex('oc', 'v0', 0, this._texture);
            return Program.fromSource(vertexShader, fragmentShader);
        }
        else
        {
            return super.createProgram();
        }
    }

    /** This method is called by <code>render</code>, directly before
     *  <code>context.drawTriangles</code>. It activates the program and sets up
     *  the context with the following constants and attributes:
     *
     *  <ul>
     *    <li><code>vc0-vc3</code> — MVP matrix</li>
     *    <li><code>va0</code> — vertex position (xy)</li>
     *    <li><code>va1</code> — texture coordinates (uv)</li>
     *    <li><code>fs0</code> — texture</li>
     *  </ul>
     */
    beforeDraw(context)
    {
        super.beforeDraw(context);
        //const { _texture, _textureSmoothing, _textureRepeat } = this;
        //
        //if (_texture)
        //{
        //    const repeat = _textureRepeat && _texture.root.isPotTexture;
        //    RenderUtil.setSamplerStateAt(0, _texture.mipMapping, _textureSmoothing, repeat);
        //    context.setTextureAt(0, _texture.base);
        //    this.vertexFormat.setVertexBufferAt(1, this.vertexBuffer, 'texCoords');
        //}
    }

    /** This method is called by <code>render</code>, directly after
     *  <code>context.drawTriangles</code>. Resets texture and vertex buffer attributes. */
    afterDraw(context)
    {
        //if (this._texture)
        //{
        //    context.setTextureAt(0, null);
        //    context.setVertexBufferAt(1, null);
        //}

        super.afterDraw(context);
    }

    /** Creates an AGAL source string with a <code>tex</code> operation, including an options
     *  list with the appropriate format flag. This is just a convenience method forwarding
     *  to the respective RenderUtil method.
     *
     *  @see starling.utils.RenderUtil#createAGALTexOperation()
     */
    static tex(resultReg, uvReg, sampler, texture, convertToPmaIfRequired = true)
    {
        return RenderUtil.createAGALTexOperation(resultReg, uvReg, sampler, texture, convertToPmaIfRequired);
    }

    /** The data format that this effect requires from the VertexData that it renders:
     *  <code>'position:float2, texCoords:float2'</code> */
    get vertexFormat() // eslint-disable-line
    {
        return FilterEffect.VERTEX_FORMAT;
    }

    /** The texture to be mapped onto the vertices. */
    get texture()
    {
        return this._texture;
    }

    set texture(value)
    {
        this._texture = value;
    }

    /** The smoothing filter that is used for the texture. @default bilinear */
    get textureSmoothing()
    {
        return this._textureSmoothing;
    }

    set textureSmoothing(value)
    {
        this._textureSmoothing = value;
    }

    /** Indicates if pixels at the edges will be repeated or clamped.
     *  Only works for power-of-two textures. @default false */
    get textureRepeat()
    {
        return this._textureRepeat;
    }

    set textureRepeat(value)
    {
        this._textureRepeat = value;
    }
}
