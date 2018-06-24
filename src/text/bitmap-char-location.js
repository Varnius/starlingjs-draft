/** A helper class referencing a BitmapChar and properties about its location and size.
 *
 *  <p>This class is used and returned by <code>BitmapFont.arrangeChars()</code>.
 *  It's typically only needed for advanced changes to Starling's default text composition
 *  mechanisms.</p>
 *
 *  <p>This class supports object pooling. All instances returned by the methods
 *  <code>instanceFromPool</code> and <code>vectorFromPool</code> are returned to the
 *  respective pool when calling <code>rechargePool</code>.</p>
 */
export default class BitmapCharLocation {
    /** The actual bitmap char to be drawn. */
    char;

    /** The scale with which the char must be placed. */
    scale;

    /** The x-coordinate of the char's location. */
    x;

    /** The y-coordinate of the char's location. */
    y;

    /** The index of this char in the processed String. */
    index;

    /** Create a new instance that references the given char. */
    constructor(char) {
        this.init(char);
    }

    init(char) {
        this.char = char;
        return this;
    }

    // pooling

    static sInstancePool = [];
    static sVectorPool = [];

    static sInstanceLoan = [];
    static sVectorLoan = [];

    /** Returns a "BitmapCharLocation" instance from the pool, initialized with the given char.
     *  All instances will be returned to the pool when calling <code>rechargePool</code>. */
    static instanceFromPool(char) {
        const instance = BitmapCharLocation.sInstancePool.length > 0 ?
            BitmapCharLocation.sInstancePool.pop() : new BitmapCharLocation(char);

        instance.init(char);
        BitmapCharLocation.sInstanceLoan[BitmapCharLocation.sInstanceLoan.length] = instance;

        return instance;
    }

    /** Returns an empty Vector for "BitmapCharLocation" instances from the pool.
     *  All vectors will be returned to the pool when calling <code>rechargePool</code>. */
    static vectorFromPool() {
        const vector = BitmapCharLocation.sVectorPool.length > 0 ?
            BitmapCharLocation.sVectorPool.pop() : [];

        vector.length = 0;
        BitmapCharLocation.sVectorLoan[BitmapCharLocation.sVectorLoan.length] = vector;

        return vector;
    }

    /** Puts all objects that were previously returned by either of the "...fromPool" methods
     *  back into the pool. */
    static rechargePool() {
        let instance;
        let vector;

        while (BitmapCharLocation.sInstanceLoan.length > 0) {
            instance = BitmapCharLocation.sInstanceLoan.pop();
            instance.char = null;
            BitmapCharLocation.sInstancePool[BitmapCharLocation.sInstancePool.length] = instance;
        }

        while (BitmapCharLocation.sVectorLoan.length > 0) {
            vector = BitmapCharLocation.sVectorLoan.pop();
            vector.length = 0;
            BitmapCharLocation.sVectorPool[BitmapCharLocation.sVectorPool.length] = vector;
        }
    }
}
