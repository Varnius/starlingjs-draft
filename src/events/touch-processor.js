import Starling from '../core/starling';
import Point from '../math/point';
import TouchPhase from './touch-phase';
import TouchMarker from './touch-marker';
import TouchEvent from './touch-event';
import KeyboardEvent from './keyboard-event';

/** The TouchProcessor is used to convert mouse and touch events of the conventional
 *  Flash stage to Starling's TouchEvents.
 *
 *  <p>The Starling instance listens to mouse and touch events on the native stage. The
 *  attributes of those events are enqueued (right as they are happening) in the
 *  TouchProcessor.</p>
 *
 *  <p>Once per frame, the "advanceTime" method is called. It analyzes the touch queue and
 *  figures out which touches are active at that moment; the properties of all touch objects
 *  are updated accordingly.</p>
 *
 *  <p>Once the list of touches has been finalized, the "processTouches" method is called
 *  (that might happen several times in one "advanceTime" execution; no information is
 *  discarded). It's responsible for dispatching the actual touch events to the Starling
 *  display tree.</p>
 *
 *  <strong>Subclassing TouchProcessor</strong>
 *
 *  <p>You can extend the TouchProcessor if you need to have more control over touch and
 *  mouse input. For example, you could filter the touches by overriding the "processTouches"
 *  method, throwing away any touches you're not interested in and passing the rest to the
 *  super implementation.</p>
 *
 *  <p>To use your custom TouchProcessor, assign it to the "Starling.touchProcessor"
 *  property.</p>
 *
 *  <p>Note that you should not dispatch TouchEvents yourself, since they are
 *  much more complex to handle than conventional events (e.g. it must be made sure that an
 *  object receives a TouchEvent only once, even if it's manipulated with several fingers).
 *  Always use the base implementation of "processTouches" to let them be dispatched. That
 *  said: you can always dispatch your own custom events, of course.</p>
 */
export default class TouchProcessor
{
    _stage;
    _root;
    _elapsedTime;
    _lastTaps;
    _shiftDown = false;
    _ctrlDown = false;
    _multitapTime = 0.3;
    _multitapDistance = 25;
    _touchEvent;

    _touchMarker;
    _simulateMultitouch;

    /** A vector of arrays with the arguments that were passed to the "enqueue"
     *  method (the oldest being at the end of the vector). */
    _queue;

    /** The list of all currently active touches. */
    _currentTouches;

    /** Helper objects. */
    static sUpdatedTouches = [];
    static sHoveringTouchData = [];
    static sHelperPoint = new Point();

    /** Creates a new TouchProcessor that will dispatch events to the given stage. */
    constructor(stage)
    {
        this._root = this._stage = stage;
        this._elapsedTime = 0.0;
        this._currentTouches = [];
        this._queue = [];
        this._lastTaps = [];
        this._touchEvent = new TouchEvent(TouchEvent.TOUCH);

        this._stage.addEventListener(KeyboardEvent.KEY_DOWN, this.onKey);
        this._stage.addEventListener(KeyboardEvent.KEY_UP, this.onKey);
        //this.monitorInterruptions(true);
    }

    /** Removes all event handlers on the stage and releases any acquired resources. */
    dispose()
    {
        //this.monitorInterruptions(false);
        this._stage.removeEventListener(KeyboardEvent.KEY_DOWN, this.onKey);
        this._stage.removeEventListener(KeyboardEvent.KEY_UP, this.onKey);
        if (this._touchMarker) this._touchMarker.dispose();
    }

    /** Analyzes the current touch queue and processes the list of current touches, emptying
     *  the queue while doing so. This method is called by Starling once per frame. */
    advanceTime(passedTime)
    {
        const { _lastTaps, _multitapTime, _currentTouches, _queue, _shiftDown, _ctrlDown, _root } = this;
        const { sUpdatedTouches, sHelperPoint } = TouchProcessor;
        let i;
        let touch;
        let numIterations = 0;

        this._elapsedTime += passedTime;
        TouchProcessor.sUpdatedTouches.length = 0;

        // remove old taps
        if (_lastTaps.length > 0)
        {
            for (i = _lastTaps.length - 1; i >= 0; --i)
                if (this._elapsedTime - _lastTaps[i].timestamp > _multitapTime)
                    _lastTaps.removeAt(i);
        }

        while (_queue.length > 0 || numIterations === 0)
        {
            ++numIterations; // we need to enter this loop at least once (for HOVER updates)

            // Set touches that were new or moving to phase 'stationary'.
            for (touch of _currentTouches)
                if (touch.phase === TouchPhase.BEGAN || touch.phase === TouchPhase.MOVED)
                    touch.phase = TouchPhase.STATIONARY;

            // analyze new touches, but each ID only once
            while (_queue.length > 0 && !this.containsTouchWithID(sUpdatedTouches, _queue[_queue.length - 1][0]))
            {
                const touchArgs = _queue.pop();
                touch = this.createOrUpdateTouch(
                    touchArgs[0], touchArgs[1], touchArgs[2], touchArgs[3],
                    touchArgs[4], touchArgs[5], touchArgs[6]);

                sUpdatedTouches[sUpdatedTouches.length] = touch; // avoiding 'push'
            }

            // Find any hovering touches that did not move.
            // If the target of such a touch changed, add it to the list of updated touches.
            for (i = _currentTouches.length - 1; i >= 0; --i)
            {
                touch = _currentTouches[i];
                if (touch.phase === TouchPhase.HOVER && !this.containsTouchWithID(sUpdatedTouches, touch.id))
                {
                    sHelperPoint.setTo(touch.globalX, touch.globalY);
                    if (touch.target !== _root.hitTest(sHelperPoint))
                        sUpdatedTouches[sUpdatedTouches.length] = touch;
                }
            }

            // process the current set of touches (i.e. dispatch touch events)
            if (sUpdatedTouches.length)
                this.processTouches(sUpdatedTouches, _shiftDown, _ctrlDown);

            // remove ended touches
            for (i = _currentTouches.length - 1; i >= 0; --i)
                if (_currentTouches[i].phase === TouchPhase.ENDED)
                    _currentTouches.removeAt(i);

            sUpdatedTouches.length = 0;
        }
    }

    /** Dispatches TouchEvents to the display objects that are affected by the list of
     *  given touches. Called internally by "advanceTime". To calculate updated targets,
     *  the method will call "hitTest" on the "root" object.
     *
     *  @param touches    a list of all touches that have changed just now.
     *  @param shiftDown  indicates if the shift key was down when the touches occurred.
     *  @param ctrlDown   indicates if the ctrl or cmd key was down when the touches occurred.
     */
    processTouches(touches, shiftDown, ctrlDown)
    {
        const { _currentTouches, _touchEvent, _root } = this;
        const { sHoveringTouchData, sHelperPoint } = TouchProcessor;

        TouchProcessor.sHoveringTouchData.length = 0;

        // the same touch event will be dispatched to all targets;
        // the 'dispatch' method makes sure each bubble target is visited only once.
        _touchEvent.resetTo(TouchEvent.TOUCH, _currentTouches, shiftDown, ctrlDown);

        // hit test our updated touches
        for (const touch of touches)
        {
            // hovering touches need special handling (see below)
            if (touch.phase === TouchPhase.HOVER && touch.target)
                sHoveringTouchData[sHoveringTouchData.length] = {
                    touch,
                    target: touch.target,
                    bubbleChain: touch.bubbleChain,
                }; // avoiding 'push'

            if (touch.phase === TouchPhase.HOVER || touch.phase === TouchPhase.BEGAN)
            {
                sHelperPoint.setTo(touch.globalX, touch.globalY);
                touch.target = _root.hitTest(sHelperPoint);
            }
        }

        // if the target of a hovering touch changed, we dispatch the event to the previous
        // target to notify it that it's no longer being hovered over.
        for (const touchData of sHoveringTouchData)
        {
            if (touchData.touch.target !== touchData.target)
                _touchEvent.dispatch(touchData.bubbleChain);
        }

        // dispatch events for the rest of our updated touches
        for (const touch of touches)
        {
            touch.dispatchEvent(_touchEvent);
        }

        // clean up any references
        _touchEvent.resetTo(TouchEvent.TOUCH);
    }

    /** Enqueues a new touch our mouse event with the given properties. */
    enqueue(...args)
    {
        const [touchID, phase, globalX, globalY] = args;
        this._queue.unshift(args);

        // multitouch simulation (only with mouse)
        if (this._ctrlDown && this._touchMarker && touchID === 0)
        {
            this._touchMarker.moveMarker(globalX, globalY, this._shiftDown);
            this._queue.unshift([1, phase, this._touchMarker.mockX, this._touchMarker.mockY]);
        }
    }

    /** Enqueues an artificial touch that represents the mouse leaving the stage.
     *
     *  <p>On OS X, we get mouse events from outside the stage; on Windows, we do not.
     *  This method enqueues an artificial hover point that is just outside the stage.
     *  That way, objects listening for HOVERs over them will get notified everywhere.</p>
     */
    enqueueMouseLeftStage()
    {
        const { _stage } = this;
        const mouse = this.getCurrentTouch(0);
        if (!mouse || mouse.phase !== TouchPhase.HOVER) return;

        const offset = 1;
        let exitX = mouse.globalX;
        let exitY = mouse.globalY;
        const distLeft = mouse.globalX;
        const distRight = _stage.stageWidth - distLeft;
        const distTop = mouse.globalY;
        const distBottom = _stage.stageHeight - distTop;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        // the new hover point should be just outside the stage, near the point where
        // the mouse point was last to be seen.

        if (minDist === distLeft)
            exitX = -offset;
        else if (minDist === distRight)
            exitX = this._stage.stageWidth + offset;
        else if (minDist === distTop)
            exitY = -offset;
        else
            exitY = this._stage.stageHeight + offset;

        this.enqueue(0, TouchPhase.HOVER, exitX, exitY);
    }

    /** Force-end all current touches. Changes the phase of all touches to 'ENDED' and
     *  immediately dispatches a new TouchEvent (if touches are present). Called automatically
     *  when the app receives a 'DEACTIVATE' event. */
    cancelTouches()
    {
        const { _currentTouches, _queue, _shiftDown, _ctrlDown } = this;

        if (this._currentTouches.length > 0)
        {
            // abort touches
            for (const touch of _currentTouches)
            {
                if (touch.phase === TouchPhase.BEGAN || touch.phase === TouchPhase.MOVED ||
                    touch.phase === TouchPhase.STATIONARY)
                {
                    touch.phase = TouchPhase.ENDED;
                    touch.cancelled = true;
                }
            }

            // dispatch events
            this.processTouches(_currentTouches, _shiftDown, _ctrlDown);
        }

        // purge touches
        _currentTouches.length = 0;
        _queue.length = 0;
    }

    createOrUpdateTouch(touchID, phase, globalX, globalY, pressure = 1.0, width = 1.0, height = 1.0)
    {
        let touch = this.getCurrentTouch(touchID);

        if (!touch)
        {
            touch = new Touch(touchID);
            this.addCurrentTouch(touch);
        }

        touch.globalX = globalX;
        touch.globalY = globalY;
        touch.phase = phase;
        touch.timestamp = this._elapsedTime;
        touch.pressure = pressure;
        touch.width = width;
        touch.height = height;

        if (phase === TouchPhase.BEGAN)
            this.updateTapCount(touch);

        return touch;
    }

    updateTapCount(touch)
    {
        const { _lastTaps, _multitapDistance } = this;

        let nearbyTap = null;
        const minSqDist = _multitapDistance * _multitapDistance;

        for (const tap of _lastTaps)
        {
            const sqDist = Math.pow(tap.globalX - touch.globalX, 2) + Math.pow(tap.globalY - touch.globalY, 2);
            if (sqDist <= minSqDist)
            {
                nearbyTap = tap;
                break;
            }
        }

        if (nearbyTap)
        {
            touch.tapCount = nearbyTap.tapCount + 1;
            _lastTaps.removeAt(_lastTaps.indexOf(nearbyTap));
        }
        else
        {
            touch.tapCount = 1;
        }

        _lastTaps[_lastTaps.length] = touch.clone(); // avoiding 'push'
    }

    addCurrentTouch(touch)
    {
        const { _currentTouches } = this;

        for (let i = _currentTouches.length - 1; i >= 0; --i)
            if (_currentTouches[i].id === touch.id)
                _currentTouches.removeAt(i);

        _currentTouches[_currentTouches.length] = touch; // avoiding 'push'
    }

    getCurrentTouch(touchID)
    {
        for (const touch of this._currentTouches)
        {
            if (touch.id === touchID) return touch;
        }

        return null;
    }

    containsTouchWithID(touches, touchID)
    {
        for (const touch of touches)
            if (touch.id === touchID) return true;

        return false;
    }

    /** Indicates if multitouch simulation should be activated. When the user presses
     *  ctrl/cmd (and optionally shift), he'll see a second touch cursor that mimics the first.
     *  That's an easy way to develop and test multitouch when there's only a mouse available.
     */
    get simulateMultitouch()
    {
        return this._simulateMultitouch;
    }

    set simulateMultitouch(value)
    {
        if (this.simulateMultitouch === value) return; // no change

        this._simulateMultitouch = value;
        const target = Starling.current;

        if (value && !this._touchMarker)
        {
            if (Starling.current.contextValid)
                createTouchMarker();
            else
                target.addEventListener(Event.CONTEXT3D_CREATE, createTouchMarker);
        }
        else if (!value && this._touchMarker)
        {
            this._touchMarker.removeFromParent(true);
            this._touchMarker = null;
        }

        const createTouchMarker = () =>
        {
            target.removeEventListener(Event.CONTEXT3D_CREATE, createTouchMarker);

            if (!this._touchMarker)
            {
                this._touchMarker = new TouchMarker();
                this._touchMarker.visible = false;
                this._stage.addChild(this._touchMarker);
            }
        };
    }

    /** The time period (in seconds) in which two touches must occur to be recognized as
     *  a multitap gesture. */
    get multitapTime()
    {
        return this._multitapTime;
    }

    set multitapTime(value)
    {
        this._multitapTime = value;
    }

    /** The distance (in points) describing how close two touches must be to each other to
     *  be recognized as a multitap gesture. */
    get multitapDistance()
    {
        return this._multitapDistance;
    }

    set multitapDistance(value)
    {
        this._multitapDistance = value;
    }

    /** The base object that will be used for hit testing. Per default, this reference points
     *  to the stage; however, you can limit touch processing to certain parts of your game
     *  by assigning a different object. */
    get root()
    {
        return this._root;
    }

    set root(value)
    {
        this._root = value;
    }

    /** The stage object to which the touch events are (per default) dispatched. */
    get stage()
    {
        return this._stage;
    }

    /** Returns the number of fingers / touch points that are currently on the stage. */
    get numCurrentTouches()
    {
        return this._currentTouches.length;
    }

    // keyboard handling

    onKey = event =>
    {
        const { _touchMarker, _queue, _stage } = this;

        if (event.keyCode === 17 || event.keyCode === 15) // ctrl or cmd key
        {
            const wasCtrlDown = this._ctrlDown;
            this._ctrlDown = event.type === KeyboardEvent.KEY_DOWN;

            if (_touchMarker && wasCtrlDown !== this._ctrlDown)
            {
                _touchMarker.visible = this._ctrlDown;
                _touchMarker.moveCenter(_stage.stageWidth / 2, _stage.stageHeight / 2);

                const mouseTouch = this.getCurrentTouch(0);
                const mockedTouch = this.getCurrentTouch(1);

                if (mouseTouch)
                    _touchMarker.moveMarker(mouseTouch.globalX, mouseTouch.globalY);

                if (wasCtrlDown && mockedTouch && mockedTouch.phase !== TouchPhase.ENDED)
                {
                    // end active touch ...
                    _queue.unshift([1, TouchPhase.ENDED, mockedTouch.globalX, mockedTouch.globalY]);
                }
                else if (this._ctrlDown && mouseTouch)
                {
                    // ... or start new one
                    if (mouseTouch.phase === TouchPhase.HOVER || mouseTouch.phase === TouchPhase.ENDED)
                        _queue.unshift([1, TouchPhase.HOVER, _touchMarker.mockX, _touchMarker.mockY]);
                    else
                        _queue.unshift([1, TouchPhase.BEGAN, _touchMarker.mockX, _touchMarker.mockY]);
                }
            }
        }
        else if (event.keyCode === 16) // shift key
        {
            this._shiftDown = event.type === KeyboardEvent.KEY_DOWN;
        }
    }

    // interruption handling
    // todo: maybe use for tab switches?
    //monitorInterruptions(enable)
    //{
    //    // if the application moves into the background or is interrupted (e.g. through
    //    // an incoming phone call), we need to abort all touches.
    //
    //    try
    //    {
    //        var nativeAppClass:Object = getDefinitionByName("flash.desktop::NativeApplication");
    //        var nativeApp:Object = nativeAppClass["nativeApplication"];
    //
    //        if (enable)
    //            nativeApp.addEventListener("deactivate", this.onInterruption, false, 0, true);
    //        else
    //            nativeApp.removeEventListener("deactivate", this.onInterruption);
    //    }
    //    catch (e)
    //    {
    //    } // we're not running in AIR
    //}

    onInterruption = () =>
    {
        this.cancelTouches();
    }
}
