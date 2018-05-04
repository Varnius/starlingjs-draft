import Starling from '../core/starling';
import Color from './color';

/** A utility class containing methods related to Stage3D and rendering in general. */
export default class RenderUtil {

    /** Clears the render context with a certain color and alpha value. */
    static clear(rgb = 0, alpha = 0.0, depth = 1.0, stencil = 0) {
        const gl = Starling.context;
        gl.clearColor(
            Color.getRed(rgb) / 255.0,
            Color.getGreen(rgb) / 255.0,
            Color.getBlue(rgb) / 255.0,
            alpha
        );
        gl.clearStencil(stencil);
        gl.clearDepth(depth);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }

    /** Returns a bit field uniquely describing texture format and premultiplied alpha,
     *  so that each required AGAL variant will get its unique ID. This method is most
     *  useful when overriding the <code>programVariantName</code> method of custom
     *  effects.
     *
     *  @return a bit field using the 3 least significant bits.
     */
    static getTextureVariantBits(texture) {
        if (!texture) return 0;

        let bitField = 0;
        let formatBits = 0;

        switch (texture.format) {
            //case Context3DTextureFormat.COMPRESSED_ALPHA:
            //    formatBits = 3;
            //    break;
            //case Context3DTextureFormat.COMPRESSED:
            //    formatBits = 2;
            //    break;
            default:
                formatBits = 1;
        }

        bitField |= formatBits;

        if (!texture.premultipliedAlpha)
            bitField |= 1 << 2;

        return bitField;
    }

    /** Calls <code>setSamplerStateAt</code> at the current context,
     *  converting the given parameters to their low level counterparts. */
    //setSamplerStateAt(sampler, mipMapping, smoothing = 'bilinear', repeat = false)
    //{
    //    const wrap = repeat ? Context3DWrapMode.REPEAT : Context3DWrapMode.CLAMP;
    //    let filter;
    //    let mipFilter;
    //
    //    if (smoothing === TextureSmoothing.NONE)
    //    {
    //        filter = Context3DTextureFilter.NEAREST;
    //        mipFilter = mipMapping ? Context3DMipFilter.MIPNEAREST : Context3DMipFilter.MIPNONE;
    //    }
    //    else if (smoothing === TextureSmoothing.BILINEAR)
    //    {
    //        filter = Context3DTextureFilter.LINEAR;
    //        mipFilter = mipMapping ? Context3DMipFilter.MIPNEAREST : Context3DMipFilter.MIPNONE;
    //    }
    //    else
    //    {
    //        filter = Context3DTextureFilter.LINEAR;
    //        mipFilter = mipMapping ? Context3DMipFilter.MIPLINEAR : Context3DMipFilter.MIPNONE;
    //    }
    //
    //    Starling.context.setSamplerStateAt(sampler, wrap, filter, mipFilter);
    //}

    /** Creates an AGAL source string with a <code>tex</code> operation, including an options
     *  list with the appropriate format flag.
     *
     *  <p>Note that values for <code>repeat/clamp</code>, <code>filter</code> and
     *  <code>mip-filter</code> are not included in the options list, since it's preferred
     *  to set those values at runtime via <code>setSamplerStateAt</code>.</p>
     *
     *  <p>Starling expects every color to have its alpha value premultiplied into
     *  the RGB channels. Thus, if this method encounters a non-PMA texture, it will
     *  (per default) convert the color in the result register to PMA mode, resulting
     *  in an additional <code>mul</code>-operation.</p>
     *
     *  @param resultReg  the register to write the result into.
     *  @param uvReg      the register containing the texture coordinates.
     *  @param sampler    the texture sampler to use.
     *  @param texture    the texture that's active in the given texture sampler.
     *  @param convertToPmaIfRequired  indicates if a non-PMA color should be converted to PMA.
     *  @param tempReg    if 'resultReg' is the output register and PMA conversion is done,
     *                    a temporary register is needed.
     *
     *  @return the AGAL source code, line break(s) included.
     */
    //createAGALTexOperation(resultReg, uvReg, sampler, texture, convertToPmaIfRequired = true, tempReg = 'ft0')
    //{
    //    const format = texture.format;
    //    let formatFlag;
    //
    //    switch (format)
    //    {
    //        case Context3DTextureFormat.COMPRESSED:
    //            formatFlag = 'dxt1';
    //            break;
    //        case Context3DTextureFormat.COMPRESSED_ALPHA:
    //            formatFlag = 'dxt5';
    //            break;
    //        default:
    //            formatFlag = 'rgba';
    //    }
    //
    //    const needsConversion = convertToPmaIfRequired && !texture.premultipliedAlpha;
    //    const texReg = needsConversion && resultReg === 'oc' ? tempReg : resultReg;
    //    let operation = 'tex ' + texReg + ', ' + uvReg + ', fs' + sampler +
    //        ' <2d, ' + formatFlag + '>\n';
    //
    //    if (needsConversion)
    //    {
    //        if (resultReg === 'oc') // the output color register cannot use a write mask ...
    //        {
    //            operation += 'mul ' + texReg + '.xyz, ' + texReg + '.xyz, ' + texReg + '.www\n';
    //            operation += 'mov ' + resultReg + ', ' + texReg;
    //        }
    //        else
    //        {
    //            operation += 'mul ' + resultReg + '.xyz, ' + texReg + '.xyz, ' + texReg + '.www\n';
    //        }
    //    }
    //
    //    return operation;
    //}

    /** Requests a context3D object from the given Stage3D object.
     *
     * @param stage3D    The stage3D object the context needs to be requested from.
     * @param renderMode The 'Context3DRenderMode' to use when requesting the context.
     * @param profile    If you know exactly which 'Context3DProfile' you want to use, simply
     *                   pass a String with that profile.
     *
     *                   <p>If you are unsure which profiles are supported on the current
     *                   device, you can also pass an Array of profiles; they will be
     *                   tried one after the other (starting at index 0), until a working
     *                   profile is found. If none of the given profiles is supported,
     *                   the Stage3D object will dispatch an ERROR event.</p>
     *
     *                   <p>You can also pass the String 'auto' to use the best available
     *                   profile automatically. This will try all known Stage3D profiles,
     *                   beginning with the most powerful.</p>
     */
    static requestContext3D() {
        return null;
    }

    //static requestContext3D(stage3D, renderMode, profile)
    //{
    //    let profiles:Array;
    //    let currentProfile;
    //
    //    if (profile === 'auto')
    //        profiles = ['standardExtended', 'standard', 'standardConstrained',
    //            'baselineExtended', 'baseline', 'baselineConstrained'];
    //    else if (profile instanceof String)
    //        profiles = [profile];
    //    else if (profile instanceof Array)
    //        profiles = profile;
    //    else
    //        throw new Error('[ArgumentError] Profile must be of type String or Array');
    //
    //    stage3D.addEventListener(Event.CONTEXT3D_CREATE, onCreated, false, 100);
    //    stage3D.addEventListener(ErrorEvent.ERROR, onError, false, 100);
    //
    //    requestNextProfile();
    //
    //    function requestNextProfile()
    //    {
    //        currentProfile = profiles.shift();
    //
    //        try
    //        {
    //            execute(stage3D.requestContext3D, renderMode, currentProfile);
    //        }
    //        catch (error)
    //        {
    //            if (profiles.length !== 0) setTimeout(requestNextProfile, 1);
    //            else throw error;
    //        }
    //    }
    //
    //    function onCreated(event:Event)
    //    {
    //        const context = stage3D.context3D;
    //
    //        if (renderMode === Context3DRenderMode.AUTO && profiles.length !== 0 &&
    //            context.driverInfo.indexOf('Software') !== -1)
    //        {
    //            onError(event);
    //        }
    //        else
    //        {
    //            onFinished();
    //        }
    //    }
    //
    //    function onError(event:Event)
    //    {
    //        if (profiles.length !== 0)
    //        {
    //            event.stopImmediatePropagation();
    //            setTimeout(requestNextProfile, 1);
    //        }
    //        else onFinished();
    //    }
    //
    //    function onFinished()
    //    {
    //        stage3D.removeEventListener(Event.CONTEXT3D_CREATE, onCreated);
    //        stage3D.removeEventListener(ErrorEvent.ERROR, onError);
    //    }
    //}
}
