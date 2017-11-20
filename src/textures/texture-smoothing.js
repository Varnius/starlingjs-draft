/** A class that provides constant values for the possible smoothing algorithms of a texture. */
export default class TextureSmoothing {
    /** No smoothing, also called "Nearest Neighbor". Pixels will scale up as big rectangles. */
    static NONE = 'none';

    /** Bilinear filtering. Creates smooth transitions between pixels. */
    static BILINEAR = 'bilinear';

    /** Trilinear filtering. Highest quality by taking the next mip map level into account. */
    static TRILINEAR = 'trilinear';

    /** Determines whether a smoothing value is valid. */
    static isValid(smoothing)
    {
        return smoothing === TextureSmoothing.NONE || smoothing === TextureSmoothing.BILINEAR || smoothing === TextureSmoothing.TRILINEAR;
    }
}
