import Effect from './effect';
import TextureSmoothing from '../textures/texture-smoothing';
import RenderUtil from '../utils/render-util';
import Program from './program';

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

    static STD_VERTEX_SHADER = `#version 300 es
                layout(location = 0) in vec2 aPosition;
                layout(location = 1) in vec2 aTexCoords;

                uniform mat4 uMVPMatrix;

                out vec2 vTexCoords;

                void main() {
                    // Transform to clipspace
                    gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);

                    vTexCoords = aTexCoords;
                }
            `;

    _texture;
    _textureSmoothing;
    _textureRepeat;

    /** Creates a new FilterEffect instance. */
    constructor() {
        super();
        this._textureSmoothing = TextureSmoothing.BILINEAR;
    }

    /** Override this method if the effect requires a different program depending on the
     *  current settings. Ideally, you do this by creating a bit mask encoding all the options.
     *  This method is called often, so do not allocate any temporary objects when overriding.
     *
     *  <p>Reserve 4 bits for the variant name of the base class.</p>
     */
    get programVariantName() {
        return RenderUtil.getTextureVariantBits(this._texture); // todo: implement
    }

    /** @private */
    createProgram() {
        if (this._texture) {
            const vertexShader = FilterEffect.STD_VERTEX_SHADER;

            const fragmentShader = `#version 300 es
                precision highp float;

                uniform sampler2D sTexture;

                in vec2 vTexCoords;

                out vec4 color;

                void main() {
                    color = texture(sTexture, vTexCoords);
                }
            `;

            return Program.fromSource(vertexShader, fragmentShader);
        } else {
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
    beforeDraw(gl) {
        super.beforeDraw(gl);
        const { _texture, _textureSmoothing, _textureRepeat } = this;

        if (_texture) {
            gl.bindTexture(gl.TEXTURE_2D, _texture.base);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, _textureSmoothing);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, _textureRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, _textureRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        }
    }

    /** This method is called by <code>render</code>, directly after
     *  <code>context.drawTriangles</code>. Resets texture and vertex buffer attributes. */
    afterDraw(gl) {
        gl.bindTexture(gl.TEXTURE_2D, null);
        super.afterDraw(gl);
    }

    /** The data format that this effect requires from the VertexData that it renders:
     *  <code>'position:float2, texCoords:float2'</code> */
    get vertexFormat() { // eslint-disable-line
        return FilterEffect.VERTEX_FORMAT;
    }

    /** The texture to be mapped onto the vertices. */
    get texture() {
        return this._texture;
    }

    set texture(value) {
        this._texture = value;
    }

    /** The smoothing filter that is used for the texture. @default bilinear */
    get textureSmoothing() {
        return this._textureSmoothing;
    }

    set textureSmoothing(value) {
        this._textureSmoothing = value;
    }

    /** Indicates if pixels at the edges will be repeated or clamped.
     *  Only works for power-of-two textures. @default false */
    get textureRepeat() {
        return this._textureRepeat;
    }

    set textureRepeat(value) {
        this._textureRepeat = value;
    }
}
