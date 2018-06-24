/** This class is an enumeration of possible types of bitmap fonts. */
export default class BitmapFontType {
    /** A standard bitmap font uses a regular RGBA texture containing all glyphs. */
    static STANDARD = 'standard';

    /** Indicates that the font texture contains a single channel distance field texture
     *  to be rendered with the <em>DistanceFieldStyle</em>. */
    static DISTANCE_FIELD = 'distanceField';

    /** Indicates that the font texture contains a multi channel distance field texture
     *  to be rendered with the <em>DistanceFieldStyle</em>. */
    static MULTI_CHANNEL_DISTANCE_FIELD = 'multiChannelDistanceField';
}
