/**
 * A class that provides constant values for horizontal and vertical alignment of objects.
 * */
export default class Align {
    /** Horizontal left alignment. */
    static LEFT = 'left';

    /** Horizontal right alignment. */
    static RIGHT = 'right';

    /** Vertical top alignment. */
    static TOP = 'top';

    /** Vertical bottom alignment. */
    static BOTTOM = 'bottom';

    /** Centered alignment. */
    static CENTER = 'center';

    /** Indicates whether the given alignment string is valid. */
    static isValid(align)
    {
        return align === Align.LEFT || align === Align.RIGHT || align === Align.CENTER || align === Align.TOP || align === Align.BOTTOM;
    }

    /** Indicates if the given string is a valid horizontal alignment. */
    static isValidHorizontal(align)
    {
        return align === Align.LEFT || align === Align.CENTER || align === Align.RIGHT;
    }

    /** Indicates if the given string is a valid vertical alignment. */
    static isValidVertical(align)
    {
        return align === Align.TOP || align === Align.CENTER || align === Align.BOTTOM;
    }
}
