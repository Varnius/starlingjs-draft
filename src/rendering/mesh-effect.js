import FilterEffect from './filter-effect';
import Program from './program';

/** An effect drawing a mesh of textured, colored vertices.
 *  This is the standard effect that is the base for all mesh styles;
 *  if you want to create your own mesh styles, you will have to extend this class.
 *
 *  <p>For more information about the usage and creation of effects, please have a look at
 *  the documentation of the root class, 'Effect'.</p>
 *
 *  @see Effect
 *  @see FilterEffect
 *  @see starling.styles.MeshStyle
 */
export default class MeshEffect extends FilterEffect {
    /** The vertex format expected by <code>uploadVertexData</code>:
     *  <code>'position:float2, texCoords:float2, color:bytes4'</code> */
    static VERTEX_FORMAT = FilterEffect.VERTEX_FORMAT.extend('color:bytes4');

    _alpha;
    _tinted;
    _optimizeIfNotTinted;

    // helper objects
    static sRenderAlpha = [];

    /** Creates a new MeshEffect instance. */
    constructor()
    {
        // Non-tinted meshes may be rendered with a simpler fragment shader, which brings
        // a huge performance benefit on some low-end hardware. However, I don't want
        // subclasses to become any more complicated because of this optimization (they
        // probably use much longer shaders, anyway), so I only apply this optimization if
        // this is actually the 'MeshEffect' class.

        super();
        this._alpha = 1.0;
        this._optimizeIfNotTinted = false; // todo: optimize or not?
    }

    /** @private */
    get programVariantName()
    {
        const noTinting = (this._optimizeIfNotTinted && !this._tinted && this._alpha === 1.0) >>> 0; // todo: uint()
        return super.programVariantName | (noTinting << 3);
    }

    /** @private */
    createProgram()
    {
        if (this.texture)
        {
            //if (this._optimizeIfNotTinted && !this._tinted && this._alpha === 1.0)
            //    return super.createProgram();
            //
            //vertexShader =
            //    'm44 op, va0, vc0 \n' + // 4x4 matrix transform to output clip-space
            //    'mov v0, va1      \n' + // pass texture coordinates to fragment program
            //    'mul v1, va2, vc4 \n';  // multiply alpha (vc4) with color (va2), pass to fp
            //
            //fragmentShader =
            //    FilterEffect.tex('ft0', 'v0', 0, this.texture) +
            //    'mul oc, ft0, v1  \n';  // multiply color with texel color
        }
        else
        {
            //vertexShader =
            //    'm44 op, va0, vc0 \n' + // 4x4 matrix transform to output clipspace
            //    'mul v0, va2, vc4 \n';  // multiply alpha (vc4) with color (va2)
            //
            //fragmentShader =
            //    'mov oc, v0       \n';  // output color
        }

        const vertexShader = `#version 300 es
            uniform mat4 u_viewProj;

            in vec4 a_position;

            out vec4 v_color;

            void main() {
                gl_Position = u_viewProj * a_position;
                v_color = vec4(1, 1, 1, 1);
            }
        `;

        const fragmentShader = `#version 300 es
            precision highp float;

            in vec4 v_color;

            out vec4 color;

            void main() {
               color = vec4(1, 0, 0, 1);  // red
            }
        `;

        return Program.fromSource(vertexShader, fragmentShader);
    }

    /** This method is called by <code>render</code>, directly before
     *  <code>context.drawTriangles</code>. It activates the program and sets up
     *  the context with the following constants and attributes:
     *
     *  <ul>
     *    <li><code>vc0-vc3</code> — MVP matrix</li>
     *    <li><code>vc4</code> — alpha value (same value for all components)</li>
     *    <li><code>va0</code> — vertex position (xy)</li>
     *    <li><code>va1</code> — texture coordinates (uv)</li>
     *    <li><code>va2</code> — vertex color (rgba), using premultiplied alpha</li>
     *    <li><code>fs0</code> — texture</li>
     *  </ul>
     */
    beforeDraw(gl)
    {
        super.beforeDraw(gl);

        MeshEffect.sRenderAlpha[0] = MeshEffect.sRenderAlpha[1] = MeshEffect.sRenderAlpha[2] = MeshEffect.sRenderAlpha[3] = this._alpha;
        //context.setProgramConstantsFromVector(Context3DProgramType.VERTEX, 4, MeshEffect.sRenderAlpha);
        console.log('implemented: MeshEffect: bind vertex array, set uniforms');

        const nativeProgram = this.program.nativeProgram;
        const alphaUniformLoc = gl.getUniformLocation(nativeProgram, 'u_renderAlpha');
        gl.uniform4fv(alphaUniformLoc, new Float32Array(MeshEffect.sRenderAlpha)); // todo: reuse same array?

        if (this._tinted || this._alpha !== 1.0 || !this._optimizeIfNotTinted || !this.texture)
        {
            //this.vertexFormat.setVertexBufferAt(2, this.vertexBuffer, 'color');
            gl.bindAttribLocation(nativeProgram, 2, 'a_color');
        }
    }

    /** The data format that this effect requires from the VertexData that it renders:
     *  <code>'position:float2, texCoords:float2, color:bytes4'</code> */
    get vertexFormat() // eslint-disable-line
    {
        return MeshEffect.VERTEX_FORMAT;
    }

    /** The alpha value of the object rendered by the effect. Must be taken into account
     *  by all subclasses. */
    get alpha()
    {
        return this._alpha;
    }

    set alpha(value)
    {
        this._alpha = value;
    }

    /** Indicates if the rendered vertices are tinted in any way, i.e. if there are vertices
     *  that have a different color than fully opaque white. The base <code>MeshEffect</code>
     *  class uses this information to simplify the fragment shader if possible. May be
     *  ignored by subclasses. */
    get tinted()
    {
        return this._tinted;
    }

    set tinted(value)
    {
        this._tinted = value;
    }
}
