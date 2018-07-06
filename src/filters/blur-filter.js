import FragmentFilter from './fragment-filter'
import FilterEffect from '../rendering/filter-effect'
import Program from '../rendering/program'

/** The BlurFilter applies a Gaussian blur to an object. The strength of the blur can be
 *  set for x- and y-axis separately. */
export default class BlurFilter extends FragmentFilter {
  _blurX
  _blurY

  /** Create a new BlurFilter.
   *
   *  <p>The blur is rendered for each direction (x and y) separately; the number of
   *  draw calls add up. The blur value itself is internally multiplied with the current
   *  <code>contentScaleFactor</code> in order to guarantee a consistent look on HiDPI
   *  displays (dubbed 'totalBlur' below).</p>
   *
   *  <p>The number of draw calls per blur value is the following:</p>
   *  <ul><li>totalBlur &lt;= 1: 1 draw call</li>
   *      <li>totalBlur &lt;= 2: 2 draw calls</li>
   *      <li>totalBlur &lt;= 4: 3 draw calls</li>
   *      <li>totalBlur &lt;= 8: 4 draw calls</li>
   *      <li>... etc.</li>
   *  </ul>
   */
  constructor(blurX = 1.0, blurY = 1.0, resolution = 1.0) {
    super()
    this._blurX = Math.abs(blurX)
    this._blurY = Math.abs(blurY)
    this.resolution = resolution
  }

  /** @private */
  process(painter, helper, input0 = null) {
    const effect = this.effect instanceof BlurEffect ? this.effect : null

    if (this._blurX === 0 && this._blurY === 0) {
      effect.strength = 0
      return super.process(painter, helper, input0)
    }

    let inTexture
    let outTexture = input0
    let strengthX = this.totalBlurX
    let strengthY = this.totalBlurY

    effect.direction = BlurEffect.HORIZONTAL

    while (strengthX > 0) {
      effect.strength = strengthX

      inTexture = outTexture
      outTexture = super.process(painter, helper, inTexture)

      if (inTexture !== input0) helper.putTexture(inTexture)
      if (strengthX <= 1) break
      else strengthX /= 2
    }

    effect.direction = BlurEffect.VERTICAL

    while (strengthY > 0) {
      effect.strength = strengthY
      inTexture = outTexture
      outTexture = super.process(painter, helper, inTexture)

      if (inTexture !== input0) helper.putTexture(inTexture)
      if (strengthY <= 1) break
      else strengthY /= 2
    }

    return outTexture
  }

  /** @private */
  createEffect() {
    return new BlurEffect()
  }

  get resolution() {
    return super.resolution
  }

  /** @private */
  set resolution(value) {
    super.resolution = value
    this.updatePadding()
  }

  updatePadding() {
    const paddingX = this._blurX
      ? (this.totalBlurX * 3 + 2) / this.resolution
      : 0
    const paddingY = this._blurY
      ? (this.totalBlurY * 3 + 2) / this.resolution
      : 0

    this.padding.setTo(paddingX, paddingX, paddingY, paddingY)
  }

  /** @private */
  get numPasses() {
    if (this._blurX === 0 && this._blurY === 0) return 1
    else
      return (
        this.getNumPasses(this.totalBlurX) + this.getNumPasses(this.totalBlurY)
      )
  }

  getNumPasses(blur) {
    let numPasses = 1
    while (blur > 1) {
      numPasses += 1
      blur /= 2
    }
    return numPasses
  }

  /** The blur values scaled by the current contentScaleFactor. */
  get totalBlurX() {
    return (
      this._blurX * window.StarlingContextManager.current.contentScaleFactor
    )
  }

  get totalBlurY() {
    return (
      this._blurY * window.StarlingContextManager.current.contentScaleFactor
    )
  }

  /** The blur factor in x-direction. */
  get blurX() {
    return this._blurX
  }

  set blurX(value) {
    this._blurX = Math.abs(value)
    this.updatePadding()
  }

  /** The blur factor in y-direction. */
  get blurY() {
    return this._blurY
  }

  set blurY(value) {
    this._blurY = Math.abs(value)
    this.updatePadding()
  }
}

class BlurEffect extends FilterEffect {
  static HORIZONTAL = 'horizontal'
  static VERTICAL = 'vertical'

  _strength
  _direction

  static sTmpWeights = [0, 0, 0, 0, 0]
  static sWeights = [0, 0, 0, 0]
  static sOffsets = [0, 0, 0, 0]

  /** Creates a new BlurEffect. */
  constructor() {
    super()
    this._strength = 0.0
    this._direction = BlurFilter.HORIZONTAL
  }

  createProgram() {
    if (this._strength === 0) return super.createProgram()

    const vertexShader = `#version 300 es
            layout(location = 0) in vec2 aPosition;
            layout(location = 1) in vec2 aTexCoords;

            uniform mat4 uMVPMatrix;
            uniform vec4 uOffsets;

            out vec2 vSampleCoords0;
            out vec2 vSampleCoords1;
            out vec2 vSampleCoords2;
            out vec2 vSampleCoords3;
            out vec2 vSampleCoords4;

            void main() {
                // Transform to clipspace
                gl_Position = uMVPMatrix * vec4(aPosition, 0.0, 1.0);
                vSampleCoords0 = aTexCoords;
                vSampleCoords1 = aTexCoords + uOffsets.xy;
                vSampleCoords2 = aTexCoords - uOffsets.xy;
                vSampleCoords3 = aTexCoords + uOffsets.zw;
                vSampleCoords4 = aTexCoords - uOffsets.zw;
            }
        `
    const fragmentShader = `#version 300 es
                precision highp float;

                uniform sampler2D sTexture;
                uniform vec4 uWeights;

                in vec2 vSampleCoords0;
                in vec2 vSampleCoords1;
                in vec2 vSampleCoords2;
                in vec2 vSampleCoords3;
                in vec2 vSampleCoords4;

                out vec4 color;

                void main() {
                    vec4 center = texture(sTexture, vSampleCoords0);
                    vec4 right1 = texture(sTexture, vSampleCoords1);
                    vec4 left1 = texture(sTexture, vSampleCoords2);
                    vec4 right2 = texture(sTexture, vSampleCoords3);
                    vec4 left2 = texture(sTexture, vSampleCoords4);

                    vec4 result =
                    center * uWeights.x
                    + right1 * uWeights.y
                    + left1 * uWeights.y
                    + right2 * uWeights.z
                    + left2 * uWeights.z;
                    color = result;
                }
            `

    return Program.fromSource(vertexShader, fragmentShader)
  }

  beforeDraw(context) {
    super.beforeDraw(context)

    if (this._strength) {
      this.updateParameters()

      const nativeProgram = this.program.nativeProgram
      const offsetsLoc = context.getUniformLocation(nativeProgram, 'uOffsets')
      context.uniform4f(offsetsLoc, ...BlurEffect.sOffsets)

      const weightsLoc = context.getUniformLocation(nativeProgram, 'uWeights')
      context.uniform4f(weightsLoc, ...BlurEffect.sWeights)
    }
  }

  updateParameters() {
    const { sWeights, sTmpWeights, sOffsets } = BlurEffect
    let offset1, offset2
    const pixelSize =
      1.0 /
      (this._direction === BlurFilter.HORIZONTAL
        ? this.texture.root.nativeWidth
        : this.texture.root.nativeHeight)

    if (this._strength <= 1) {
      // algorithm described here:
      // http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/
      //
      // To support the baseline constrained profile, we can only make 5 texture look-ups
      // in the fragment shader. By making use of linear texture sampling, we can produce
      // similar output to what would be 9 look-ups.

      const sigma = this._strength * 2
      const twoSigmaSq = 2 * sigma * sigma
      const multiplier = 1.0 / Math.sqrt(twoSigmaSq * Math.PI)

      // get weights on the exact pixels (sTmpWeights) and calculate sums (sWeights)

      for (let i = 0; i < 5; ++i)
        sTmpWeights[i] = multiplier * Math.exp((-i * i) / twoSigmaSq)

      sWeights[0] = sTmpWeights[0]
      sWeights[1] = sTmpWeights[1] + sTmpWeights[2]
      sWeights[2] = sTmpWeights[3] + sTmpWeights[4]

      // normalize weights so that sum equals "1.0"

      const weightSum = sWeights[0] + 2 * sWeights[1] + 2 * sWeights[2]
      const invWeightSum = 1.0 / weightSum

      sWeights[0] *= invWeightSum
      sWeights[1] *= invWeightSum
      sWeights[2] *= invWeightSum

      // calculate intermediate offsets

      offset1 = (sTmpWeights[1] + 2 * sTmpWeights[2]) / sWeights[1]
      offset2 = (3 * sTmpWeights[3] + 4 * sTmpWeights[4]) / sWeights[2]
    } else {
      // All other passes look up 5 texels with a standard gauss distribution and bigger
      // offsets. In itself, this looks as if the object was drawn multiple times; combined
      // with the last pass (strength <= 1), though, the result is a very strong blur.

      sWeights[0] = 0.29412
      sWeights[1] = 0.23529
      sWeights[2] = 0.11765

      offset1 = this._strength * 1.3 // the additional '0.3' compensate the difference between
      offset2 = this._strength * 2.3 // the two gauss distributions.
    }

    // depending on pass, we move in x- or y-direction

    if (this._direction === BlurEffect.HORIZONTAL) {
      sOffsets[0] = offset1 * pixelSize
      sOffsets[1] = 0
      sOffsets[2] = offset2 * pixelSize
      sOffsets[3] = 0
    } else {
      sOffsets[0] = 0
      sOffsets[1] = offset1 * pixelSize
      sOffsets[2] = 0
      sOffsets[3] = offset2 * pixelSize
    }
  }

  get programVariantName() {
    return super.programVariantName | (this._strength ? 1 << 4 : 0)
  }

  get direction() {
    return this._direction
  }

  set direction(value) {
    this._direction = value
  }

  get strength() {
    return this._strength
  }

  set strength(value) {
    this._strength = value
  }
}
