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
        let vertexShader, fragmentShader;

        if (this.texture)
        {
            if (this._optimizeIfNotTinted && !this._tinted && this._alpha === 1.0)
                return super.createProgram();

            //vertexShader =
            //    'm44 op, va0, vc0 \n' + // 4x4 matrix transform to output clip-space
            //    'mov v0, va1      \n' + // pass texture coordinates to fragment program
            //    'mul v1, va2, vc4 \n';  // multiply alpha (vc4) with color (va2), pass to fp
            //
            //fragmentShader =
            //    FilterEffect.tex('ft0', 'v0', 0, this.texture) +
            //    'mul oc, ft0, v1  \n';  // multiply color with texel color

            vertexShader = `#version 300 es
                layout(location = 0) in vec2 aPosition;
                layout(location = 1) in vec2 aTexCoords;
                layout(location = 2) in vec4 aColor;

                uniform mat4 uMVPMatrix;
                uniform float uAlpha;

                out vec4 vColor;
                out vec2 vTexCoords;

                void main() {
                    // Transform to clipspace
                    gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);

                    // Reverse components because WebGL expects data as little-endian
                    vColor = aColor.wzyx * uAlpha;

                    vTexCoords = aTexCoords;
                }
            `;

            fragmentShader = `#version 300 es
                precision highp float;

                uniform sampler2D sTexture;

                in vec4 vColor;
                in vec2 vTexCoords;

                out vec4 color;

                void main() {
                    vec4 textureColor = texture(sTexture, vTexCoords);
                    color = vColor * textureColor;
                }
            `;
        }
        else
        {
            vertexShader = `#version 300 es
                layout(location = 0) in vec2 aPosition;
                layout(location = 2) in vec4 aColor;

                uniform mat4 uMVPMatrix;
                uniform float uAlpha;

                out vec4 vColor;

                void main() {
                    // Transform to clipspace
                    gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);

                    // Reverse components because WebGL expects data as little-endian
                    vColor = aColor.wzyx * uAlpha;
                }
            `;

            fragmentShader = `#version 300 es
                precision highp float;

                in vec4 vColor;

                out vec4 color;

                void main() {
                   color = vColor;
                }
            `;
        }

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

        const nativeProgram = this.program.nativeProgram;
        const alphaUniformLoc = gl.getUniformLocation(nativeProgram, 'uAlpha');
        gl.uniform1f(alphaUniformLoc, this._alpha);

        if (this._tinted || this._alpha !== 1.0 || !this._optimizeIfNotTinted || !this.texture)
        {
            gl.bindAttribLocation(nativeProgram, 2, 'aColor');
        }
    }

    afterDraw(gl)
    {
        super.afterDraw(gl);
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
