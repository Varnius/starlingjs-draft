import Point from '../math/point';
import FragmentFilter from './fragment-filter';
import FilterEffect from '../rendering/filter-effect';
import RenderUtil from '../utils/render-util';
import Color from '../utils/color';
import Program from '../rendering/program';

/** The CompositeFilter class allows to combine several layers of textures into one texture.
 *  It's mainly used as a building block for more complex filters; e.g. the DropShadowFilter
 *  uses this class to draw the shadow (the result of a BlurFilter) behind an object.
 */
export default class CompositeFilter extends FragmentFilter {

    /** Combines up to four input textures into one new texture,
     *  adhering to the properties of each layer. */
    process(painter, helper, input0 = null, input1 = null, input2 = null, input3 = null) {
        this.compositeEffect.texture = input0;
        this.compositeEffect.getLayerAt(1).texture = input1;
        this.compositeEffect.getLayerAt(2).texture = input2;
        this.compositeEffect.getLayerAt(3).texture = input3;

        if (input1) input1.setupTextureCoordinates(this.vertexData, 0, 'texCoords1', true);
        if (input2) input2.setupTextureCoordinates(this.vertexData, 0, 'texCoords2', true);
        if (input3) input3.setupTextureCoordinates(this.vertexData, 0, 'texCoords3', true);

        return super.process(painter, helper, input0, input1, input2, input3);
    }

    /** @private */
    createEffect() {
        return new CompositeEffect();
    }

    /** Returns the position (in points) at which a certain layer will be drawn. */
    getOffsetAt(layerID, out = null) {
        if (!out) out = new Point();

        out.x = this.compositeEffect.getLayerAt(layerID).x;
        out.y = this.compositeEffect.getLayerAt(layerID).y;

        return out;
    }

    /** Indicates the position (in points) at which a certain layer will be drawn. */
    setOffsetAt(layerID, x, y) {
        this.compositeEffect.getLayerAt(layerID).x = x;
        this.compositeEffect.getLayerAt(layerID).y = y;
    }

    /** Returns the RGB color with which a layer is tinted when it is being drawn.
     *  @default 0xffffff */
    getColorAt(layerID) {
        return this.compositeEffect.getLayerAt(layerID).color;
    }

    /** Adjusts the RGB color with which a layer is tinted when it is being drawn.
     *  If <code>replace</code> is enabled, the pixels are not tinted, but instead
     *  the RGB channels will replace the texture's color entirely.
     */
    setColorAt(layerID, color, replace = false) {
        this.compositeEffect.getLayerAt(layerID).color = color;
        this.compositeEffect.getLayerAt(layerID).replaceColor = replace;
    }

    /** Indicates the alpha value with which the layer is drawn.
     *  @default 1.0 */
    getAlphaAt(layerID) {
        return this.compositeEffect.getLayerAt(layerID).alpha;
    }

    /** Adjusts the alpha value with which the layer is drawn. */
    setAlphaAt(layerID, alpha) {
        this.compositeEffect.getLayerAt(layerID).alpha = alpha;
    }

    get compositeEffect() {
        return this.effect instanceof CompositeEffect ? this.effect : null;
    }
}


class CompositeEffect extends FilterEffect {
    static VERTEX_FORMAT = FilterEffect.VERTEX_FORMAT.extend('texCoords1:float2, texCoords2:float2, texCoords3:float2');

    _layers;

    static sLayers = [];
    static sOffset = [0, 0, 0, 0];
    static sColor = [0, 0, 0, 0];

    constructor(numLayers = 4) {
        super();
        if (numLayers < 1 || numLayers > 4)
            throw new Error('[Argument error] number of layers must be between 1 and 4');

        this._layers = [];

        for (let i = 0; i < numLayers; ++i)
            this._layers[i] = new CompositeLayer();
    }

    getLayerAt(layerID) {
        return this._layers[layerID];
    }

    getUsedLayers(out = null) {
        if (!out) out = [];
        else out.length = 0;

        for (const layer of this._layers)
            if (layer.texture) out[out.length] = layer;

        return out;
    }

    createProgram() {
        const layers = this.getUsedLayers(CompositeEffect.sLayers);

        if (layers.length) {
            const vertexShader = `#version 300 es
                layout(location = 0) in vec2 aPosition;

                ${layers.map((layer, i) =>
                `layout(location = ${i + 1}) in vec2 aLayerTexCoords${i + 1};
                 uniform vec4 uLayerOffset${i};
                 out vec2 vLayerTexCoords${i};
                `).join('\n')}

                uniform mat4 uMVPMatrix;

                void main() {
                    gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);
                    ${layers.map((layer, i) => `vLayerTexCoords${i} = aLayerTexCoords${i + 1} + uLayerOffset${i}.xy;`).join('\n')}
                }
            `;

            const fragmentShader = `#version 300 es
                precision highp float;

                ${layers.map((layer, i) =>
                `uniform sampler2D sTexture${i};
                 uniform vec4 uColor${i};
                 in vec2 vLayerTexCoords${i};
                `).join('\n')}

                out vec4 color;

                void main() {
                    vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);
                    vec4 result;

                    ${layers.map((layer, i) =>
                `vec4 layer${i} = texture(sTexture${i}, vLayerTexCoords${i});
                    ${layer.replaceColor ? (
                    `layer${i}.w *= uColor${i}.w;
                     layer${i}.w = clamp(layer${i}.w, 0.0, 1.0);
                     layer${i}.xyz = layer${i}.www * uColor${i}.xyz;
                    `) :
                    `layer${i} *= uColor${i};`}
                    ${i !== 0 ? `result = (ones - layer${i}.wwww) * layer0 + layer${i};` : ''}
                    `).join('\n')}

                    color = result;
                }
            `;
            return Program.fromSource(vertexShader, fragmentShader);
        } else {
            return super.createProgram();
        }
    }

    get programVariantName() {
        let bits;
        let totalBits = 0;
        let layer;
        const layers = this.getUsedLayers(CompositeEffect.sLayers);
        const numLayers = layers.length;

        for (let i = 0; i < numLayers; ++i) {
            layer = layers[i];
            bits = RenderUtil.getTextureVariantBits(layer.texture) | (Math.floor(layer.replaceColor) << 3); // todo: was int()
            totalBits |= bits << (i * 4);
        }

        return totalBits;
    }

    /** vc0-vc3  — MVP matrix
     *  vc4-vc7  — layer offsets
     *  fs0-fs3  — input textures
     *  fc0-fc3  — input colors (RGBA+pma)
     *  va0      — vertex position (xy)
     *  va1-va4  — texture coordinates (without offset)
     *  v0-v3    — texture coordinates (with offset)
     */
    beforeDraw(context) {
        super.beforeDraw(context); // todo: not sure

        const { sOffset, sColor } = CompositeEffect;
        const gl = context;
        const layers = this.getUsedLayers(CompositeEffect.sLayers);
        const numLayers = layers.length;

        if (numLayers) {
            for (let i = 0; i < numLayers; ++i) {
                const layer = layers[i];
                const texture = layer.texture;
                const alphaFactor = layer.replaceColor ? 1.0 : layer.alpha;

                sOffset[0] = -layer.x / (texture.root.nativeWidth / texture.scale);
                sOffset[1] = layer.y / (texture.root.nativeHeight / texture.scale);
                sColor[0] = Color.getRed(layer.color) * alphaFactor / 255.0;
                sColor[1] = Color.getGreen(layer.color) * alphaFactor / 255.0;
                sColor[2] = Color.getBlue(layer.color) * alphaFactor / 255.0;
                sColor[3] = layer.alpha;

                const nativeProgram = this.program.nativeProgram;
                const offsetLoc = gl.getUniformLocation(nativeProgram, `uLayerOffset${i}`);
                gl.uniform4f(offsetLoc, ...sOffset);

                const colorLoc = gl.getUniformLocation(nativeProgram, `uColor${i}`);
                gl.uniform4f(colorLoc, ...sColor);

                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, texture.base);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.textureSmoothing);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.textureRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.textureRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);

                const texLoc = gl.getUniformLocation(nativeProgram, `sTexture${i}`);
                gl.uniform1i(texLoc, i);
            }
        }
    }

    afterDraw(context) {
        const gl = context;
        const layers = this.getUsedLayers(CompositeEffect.sLayers);
        const numLayers = layers.length;

        for (let i = 0; i < numLayers; ++i) {
            gl.activeTexture(gl[`TEXTURE${i}`]);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        gl.activeTexture(gl.TEXTURE0);
        super.afterDraw(context);
    }

    get vertexFormat() {
        return CompositeEffect.VERTEX_FORMAT;
    }

    // properties

    get numLayers() {
        return this._layers.length;
    }

    set texture(value) {
        this._layers[0].texture = value;
        super.texture = value;
    }
}

class CompositeLayer {
    texture;
    x;
    y;
    color;
    alpha;
    replaceColor;

    constructor() {
        this.x = this.y = 0;
        this.alpha = 1.0;
        this.color = 0xffffff;
    }
}
