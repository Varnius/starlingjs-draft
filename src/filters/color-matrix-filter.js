import FragmentFilter from './fragment-filter';
import Color from '../utils/color';
import FilterEffect from '../rendering/filter-effect';
import Program from '../rendering/program';

/** The ColorMatrixFilter class lets you apply a 4x5 matrix transformation to the color
 *  and alpha values of every pixel in the input image to produce a result with a new set
 *  of color and alpha values. This allows saturation changes, hue rotation,
 *  luminance to alpha, and various other effects.
 *
 *  <p>The class contains several convenience methods for frequently used color
 *  adjustments. All those methods change the current matrix, which means you can easily
 *  combine them in one filter:</p>
 *
 *  <listing>
 *  // create an inverted filter with 50% saturation and 180° hue rotation
 *  var filter:ColorMatrixFilter = new ColorMatrixFilter();
 *  filter.invert();
 *  filter.adjustSaturation(-0.5);
 *  filter.adjustHue(1.0);</listing>
 *
 *  <p>If you want to gradually animate one of the predefined color adjustments, either reset
 *  the matrix after each step, or use an identical adjustment value for each step; the
 *  changes will add up.</p>
 */
export default class ColorMatrixFilter extends FragmentFilter {
    // Most of the color transformation math was taken from the excellent ColorMatrix class by
    // Mario Klingemann: http://www.quasimondo.com/archives/000565.php -- THANKS!!!

    LUMA_R = 0.299;
    LUMA_G = 0.587;
    LUMA_B = 0.114;

    // helpers
    static sMatrix = [];

    /** Creates a new ColorMatrixFilter instance with the specified matrix.
     *  @param matrix a vector of 20 items arranged as a 4x5 matrix.
     */
    constructor(matrix = null) {
        super();
        if (matrix) this.colorEffect.matrix = matrix;
    }

    /** @private */
    createEffect() {
        return new ColorMatrixEffect();
    }

    // color manipulation

    /** Inverts the colors of the filtered object. */
    invert() {
        this.concatValues(
            -1, 0, 0, 0, 255,
            0, -1, 0, 0, 255,
            0, 0, -1, 0, 255,
            0, 0, 0, 1, 0
        );
    }

    /** Changes the saturation. Typical values are in the range (-1, 1).
     *  Values above zero will raise, values below zero will reduce the saturation.
     *  '-1' will produce a grayscale image. */
    adjustSaturation(sat) {
        sat += 1;

        const { LUMA_R, LUMA_G, LUMA_B } = this;
        const invSat = 1 - sat;
        const invLumR = invSat * LUMA_R;
        const invLumG = invSat * LUMA_G;
        const invLumB = invSat * LUMA_B;

        this.concatValues((invLumR + sat), invLumG, invLumB, 0, 0,
            invLumR, (invLumG + sat), invLumB, 0, 0,
            invLumR, invLumG, (invLumB + sat), 0, 0,
            0, 0, 0, 1, 0);
    }

    /** Changes the contrast. Typical values are in the range (-1, 1).
     *  Values above zero will raise, values below zero will reduce the contrast. */
    adjustContrast(value) {
        const s = value + 1;
        const o = 128 * (1 - s);

        this.concatValues(s, 0, 0, 0, o,
            0, s, 0, 0, o,
            0, 0, s, 0, o,
            0, 0, 0, 1, 0);
    }

    /** Changes the brightness. Typical values are in the range (-1, 1).
     *  Values above zero will make the image brighter, values below zero will make it darker.*/
    adjustBrightness(value) {
        value *= 255;

        this.concatValues(1, 0, 0, 0, value,
            0, 1, 0, 0, value,
            0, 0, 1, 0, value,
            0, 0, 0, 1, 0);
    }

    /** Changes the hue of the image. Typical values are in the range (-1, 1). */
    adjustHue(value) {
        const { LUMA_R, LUMA_G, LUMA_B } = this;
        value *= Math.PI;

        const cos = Math.cos(value);
        const sin = Math.sin(value);

        this.concatValues(
            ((LUMA_R + (cos * (1 - LUMA_R))) + (sin * -(LUMA_R))), ((LUMA_G + (cos * -(LUMA_G))) + (sin * -(LUMA_G))), ((LUMA_B + (cos * -(LUMA_B))) + (sin * (1 - LUMA_B))), 0, 0,
            ((LUMA_R + (cos * -(LUMA_R))) + (sin * 0.143)), ((LUMA_G + (cos * (1 - LUMA_G))) + (sin * 0.14)), ((LUMA_B + (cos * -(LUMA_B))) + (sin * -0.283)), 0, 0,
            ((LUMA_R + (cos * -(LUMA_R))) + (sin * -((1 - LUMA_R)))), ((LUMA_G + (cos * -(LUMA_G))) + (sin * LUMA_G)), ((LUMA_B + (cos * (1 - LUMA_B))) + (sin * LUMA_B)), 0, 0,
            0, 0, 0, 1, 0);
    }

    /** Tints the image in a certain color, analog to what can be done in Adobe Animate.
     *
     *  @param color   the RGB color with which the image should be tinted.
     *  @param amount  the intensity with which tinting should be applied. Range (0, 1).
     */
    tint(color, amount = 1.0) {
        const { LUMA_R, LUMA_G, LUMA_B } = this;
        const r = Color.getRed(color) / 255.0;
        const g = Color.getGreen(color) / 255.0;
        const b = Color.getBlue(color) / 255.0;
        const q = 1 - amount;

        const rA = amount * r;
        const gA = amount * g;
        const bA = amount * b;

        this.concatValues(
            q + rA * LUMA_R, rA * LUMA_G, rA * LUMA_B, 0, 0,
            gA * LUMA_R, q + gA * LUMA_G, gA * LUMA_B, 0, 0,
            bA * LUMA_R, bA * LUMA_G, q + bA * LUMA_B, 0, 0,
            0, 0, 0, 1, 0);
    }

    // matrix manipulation

    /** Changes the filter matrix back to the identity matrix. */
    reset() {
        this.matrix = null;
    }

    /** Concatenates the current matrix with another one. */
    concat(matrix) {
        this.colorEffect.concat(matrix);
        this.setRequiresRedraw();
    }

    /** Concatenates the current matrix with another one, passing its contents directly. */
    concatValues(m0, m1, m2, m3, m4,
                 m5, m6, m7, m8, m9,
                 m10, m11, m12, m13, m14,
                 m15, m16, m17, m18, m19) {
        const { sMatrix } = ColorMatrixFilter;
        sMatrix.length = 0;
        sMatrix.push(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9,
            m10, m11, m12, m13, m14, m15, m16, m17, m18, m19);

        this.concat(sMatrix);
    }

    /** A vector of 20 items arranged as a 4x5 matrix. */
    get matrix() {
        return this.colorEffect.matrix;
    }

    set matrix(value) {
        this.colorEffect.matrix = value;
        this.setRequiresRedraw();
    }

    get colorEffect() {
        return this.effect instanceof ColorMatrixEffect ? this.effect : null;
    }
}

class ColorMatrixEffect extends FilterEffect {
    _userMatrix;   // offset in range 0-255
    _shaderMatrix; // offset in range 0-1, changed order

    MIN_COLOR = [0, 0, 0, 0.0001];
    IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

    // helpers
    static sMatrix = [];

    constructor() {
        super();

        this._userMatrix = [];
        this._shaderMatrix = [];

        this.matrix = null;
    }

    createProgram() {
        const vertexShader = FilterEffect.STD_VERTEX_SHADER;
        const fragmentShader = `#version 300 es
                precision highp float;

                uniform sampler2D sTexture;
                uniform mat4 uShaderMatrix;
                uniform vec4 uMinColor;
                uniform vec4 uOffset;

                in vec2 vTexCoords;

                out vec4 color;

                void main() {
                    vec4 textureColor = texture(sTexture, vTexCoords);
                    textureColor = max(textureColor, uMinColor);
                    textureColor.xyz = textureColor.xyz / textureColor.www;
                    textureColor = (uShaderMatrix * textureColor) + uOffset;
                    textureColor.xyz = textureColor.xyz * textureColor.w;
                    color = textureColor;
                }
            `;

        return Program.fromSource(vertexShader, fragmentShader);
    }

    beforeDraw(context) {
        super.beforeDraw(context);

        const nativeProgram = this.program.nativeProgram;
        const shaderMatrixLoc = context.getUniformLocation(nativeProgram, 'uShaderMatrix');
        context.uniformMatrix4fv(shaderMatrixLoc, true, this._shaderMatrix);

        const minColorLoc = context.getUniformLocation(nativeProgram, 'uMinColor');
        context.uniform4f(minColorLoc, ...this.MIN_COLOR);

        const offsetLoc = context.getUniformLocation(nativeProgram, 'uOffset');
        context.uniform4f(offsetLoc, ...this._offset);
    }

    // matrix manipulation

    reset() {
        this.matrix = null;
    }

    /** Concatenates the current matrix with another one. */
    concat(matrix) {
        let i = 0;

        for (let y = 0; y < 4; ++y) {
            for (let x = 0; x < 5; ++x) {
                ColorMatrixEffect.sMatrix[i + x] = matrix[i] * this._userMatrix[x] +
                    matrix[i + 1] * this._userMatrix[x + 5] +
                    matrix[i + 2] * this._userMatrix[x + 10] +
                    matrix[i + 3] * this._userMatrix[x + 15] +
                    (x === 4 ? matrix[i + 4] : 0);
            }

            i += 5;
        }

        this.copyMatrix(ColorMatrixEffect.sMatrix, this._userMatrix);
        this.updateShaderMatrix();
    }

    copyMatrix(from, to) {
        for (let i = 0; i < 20; ++i)
            to[i] = from[i];
    }

    updateShaderMatrix() {
        // the shader needs the matrix components in a different order,
        // and it needs the offsets in the range 0-1.

        this._shaderMatrix.length = 0;
        this._shaderMatrix.push(
            this._userMatrix[0], this._userMatrix[1], this._userMatrix[2], this._userMatrix[3],
            this._userMatrix[5], this._userMatrix[6], this._userMatrix[7], this._userMatrix[8],
            this._userMatrix[10], this._userMatrix[11], this._userMatrix[12], this._userMatrix[13],
            this._userMatrix[15], this._userMatrix[16], this._userMatrix[17], this._userMatrix[18]
        );
        this._offset = [
            this._userMatrix[4] / 255.0, this._userMatrix[9] / 255.0, this._userMatrix[14] / 255.0, this._userMatrix[19] / 255.0,
        ];
    }

    // properties

    get matrix() {
        return this._userMatrix;
    }

    set matrix(value) {
        if (value && value.length !== 20)
            throw new Error('[ArgumentError] Invalid matrix length: must be 20');

        if (!value) {
            this._userMatrix.length = 0;
            this._userMatrix.push.apply(this._userMatrix, this.IDENTITY); // eslint-disable-line
        } else {
            this.copyMatrix(value, this._userMatrix);
        }

        this.updateShaderMatrix();
    }
}
