import Event from './event';

/** An EnterFrameEvent is triggered once per frame and is dispatched to all objects in the
 *  display tree.
 *
 *  It contains information about the time that has passed since the last frame. That way, you
 *  can easily make animations that are independent of the frame rate, taking the passed time
 *  into account.
 */
export default class EnterFrameEvent extends Event {
    /** Event type for a display object that is entering a new frame. */
    static ENTER_FRAME = 'enterFrame';

    /** Creates an enter frame event with the passed time. */
    constructor(type, passedTime, bubbles = false)
    {
        super(type, bubbles, passedTime);
    }

    /** The time that has passed since the last frame (in seconds). */
    get passedTime()
    {
        return this.data;
    }
}
