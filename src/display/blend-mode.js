//import Starling from '../core/starling';
import GLC from 'gl-constants';

/** A class that provides constant values for visual blend mode effects.
 *
 *  <p>A blend mode is always defined by two 'Context3DBlendFactor' values. A blend factor
 *  represents a particular four-value vector that is multiplied with the source or destination
 *  color in the blending formula. The blending formula is:</p>
 *
 *  <pre>result = source × sourceFactor + destination × destinationFactor</pre>
 *
 *  <p>In the formula, the source color is the output color of the pixel shader program. The
 *  destination color is the color that currently exists in the color buffer, as set by
 *  previous clear and draw operations.</p>
 *
 *  <p>You can add your own blend modes via <code>BlendMode.register</code>.
 *  To get the math right, remember that all colors in Starling use premultiplied alpha (PMA),
 *  which means that their RGB values were multiplied with the alpha value.</p>
 *
 *  @see flash.display3D.Context3DBlendFactor
 */
export default class BlendMode {
    _name;
    _sourceFactor;
    _destinationFactor;

    static sBlendModes;

    /** Creates a new BlendMode instance. Don't call this method directly; instead,
     *  register a new blend mode using <code>BlendMode.register</code>. */
    constructor(name, sourceFactor, destinationFactor)
    {
        this._name = name;
        this._sourceFactor = sourceFactor;
        this._destinationFactor = destinationFactor;
    }

    /** Inherits the blend mode from this display object's parent. */
    static AUTO = 'auto';

    /** Deactivates blending, i.e. disabling any transparency. */
    static NONE = 'none';

    /** The display object appears in front of the background. */
    static NORMAL = 'normal';

    /** Adds the values of the colors of the display object to the colors of its background. */
    static ADD = 'add';

    /** Multiplies the values of the display object colors with the the background color. */
    static MULTIPLY = 'multiply';

    /** Multiplies the complement (inverse) of the display object color with the complement of
     * the background color, resulting in a bleaching effect. */
    static SCREEN = 'screen';

    /** Erases the background when drawn on a RenderTexture. */
    static ERASE = 'erase';

    /** When used on a RenderTexture, the drawn object will act as a mask for the current
     *  content, i.e. the source alpha overwrites the destination alpha. */
    static MASK = 'mask';

    /** Draws under/below existing objects; useful especially on RenderTextures. */
    static BELOW = 'below';

    // static access methods

    /** Returns the blend mode with the given name.
     *  Throws an ArgumentError if the mode does not exist. */
    static get(modeName)
    {
        if (!BlendMode.sBlendModes) BlendMode.registerDefaults();
        if (modeName in BlendMode.sBlendModes) return BlendMode.sBlendModes[modeName];
        else throw new Error('[ArgumentError] Blend mode not found: ' + modeName);
    }

    /** Registers a blending mode under a certain name. */
    static register(name, srcFactor, dstFactor)
    {
        if (!BlendMode.sBlendModes) BlendMode.registerDefaults();
        const blendMode = new BlendMode(name, srcFactor, dstFactor);
        BlendMode.sBlendModes[name] = blendMode;
        return blendMode;
    }

    static registerDefaults()
    {
        const { register } = BlendMode;
        if (BlendMode.sBlendModes) return;

        BlendMode.sBlendModes = {};

        register('none', GLC.ONE, GLC.ZERO);
        register('normal', GLC.ONE, GLC.ONE_MINUS_SRC_ALPHA);
        register('add', GLC.ONE, GLC.ONE);
        register('multiply', GLC.DST_COLOR, GLC.ONE_MINUS_SRC_ALPHA);
        register('screen', GLC.ONE, GLC.ONE_MINUS_SRC_COLOR);
        register('erase', GLC.ZERO, GLC.ONE_MINUS_SRC_ALPHA);
        register('mask', GLC.ZERO, GLC.SRC_ALPHA);
        register('below', GLC.ONE_MINUS_DST_ALPHA, GLC.DST_ALPHA);
    }

    // instance methods / properties

    /** Sets the appropriate blend factors for source and destination on the current context. */
    activate()
    {
        console.log('IMPLEMENT ME!!');
        //Starling.context.setBlendFactors(this._sourceFactor, this._destinationFactor);
    }

    /** Returns the name of the blend mode. */
    toString()
    {
        return this._name;
    }

    /** The source blend factor of this blend mode. */
    get sourceFactor()
    {
        return this._sourceFactor;
    }

    /** The destination blend factor of this blend mode. */
    get destinationFactor()
    {
        return this._destinationFactor;
    }

    /** Returns the name of the blend mode. */
    get name()
    {
        return this._name;
    }
}
