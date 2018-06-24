import detectIt from 'detect-it';

import Stage from '../display/stage';
import EventDispatcher from '../events/event-dispatcher';
import Event from '../events/event';
import KeyboardEvent from '../events/keyboard-event';
import TouchProcessor from '../events/touch-processor';
import TouchPhase from '../events/touch-phase';
import Painter from '../rendering/painter';
import Rectangle from '../math/rectangle';
import RectangleUtil from '../utils/rectangle-util';
import Juggler from '../animation/juggler';

const MouseEventType = {
    MOUSE_DOWN: 'mousedown',
    MOUSE_MOVE: 'mousemove',
    MOUSE_UP: 'mouseup',
};

const TouchEventType = {
    TOUCH_START: 'touchstart',
    TOUCH_MOVE: 'touchmove',
    TOUCH_END: 'touchend',
};

const KeyboardEventType = {
    KEY_DOWN: 'keydown',
    KEY_UP: 'keyup',
};

export default class Starling extends EventDispatcher {

    /** The version of the Starling framework. */
    static VERSION = '2.2.1';

    _stage;
    _rootClass;
    _root;
    _juggler;
    _painter;
    _touchProcessor;
    _antiAliasing;
    _frameTimestamp;
    _frameID;
    _leftMouseDown;
    _statsDisplay;
    _rendering;
    //_supportHighResolutions:Boolean;
    _skipUnchangedFrames;
    _showStats;

    _viewPort;
    _previousViewPort;
    _clippedViewPort;

    static sCurrent;
    static sAll = [];

    constructor(rootClass, canvas, viewPort = null, window) {
        super();

        if (!canvas) throw new Error('[ArgumentError] Canvas must not be null');
        if (!viewPort) viewPort = new Rectangle(0, 0, canvas.width, canvas.height);

        //SystemUtil.initialize();
        Starling.sAll.push(this);
        this.makeCurrent();

        this._rootClass = rootClass;
        this._viewPort = viewPort;
        this._previousViewPort = new Rectangle();
        this._stage = new Stage(viewPort.width, viewPort.height);
        this._touchProcessor = new TouchProcessor(this._stage);
        this._juggler = new Juggler();
        this._antiAliasing = 0;
        this._supportHighResolutions = false;
        this._painter = new Painter(canvas);
        this._frameTimestamp = new Date().getTime() / 1000.0;
        this._frameID = 1;

        // todo:
        this.textCanvas = window.document.getElementById('text-canvas');
        this.textContext = this.textCanvas.getContext('2d');

        // register touch/mouse event handlers            
        for (const touchEventType of this.touchEventTypes)
            canvas.addEventListener(touchEventType, this.onTouch, false); // todo: removed last two params

        // register other event handlers

        window.requestAnimationFrame(this.nextFrame);
        canvas.addEventListener(KeyboardEventType.KEY_DOWN, this.onKey, false); // todo: removed last two params
        canvas.addEventListener(KeyboardEventType.KEY_UP, this.onKey, false); // todo: removed last two params
        //stage.addEventListener(Event.RESIZE, onResize, false, 0, true);
        //stage.addEventListener(Event.MOUSE_LEAVE, onMouseLeave, false, 0, true);

        //stage3D.addEventListener(Event.CONTEXT3D_CREATE, onContextCreated, false, 10, true);
        //stage3D.addEventListener(ErrorEvent.ERROR, onStage3DError, false, 10, true);

        this.initialize();
    }

    initialize() {
        this.makeCurrent();
        this.updateViewPort(true);
        this.initializeRoot();
        this._frameTimestamp = new Date().getTime() / 1000.0;
    }

    initializeRoot() {
        if (!this._root && this._rootClass) {
            this._root = new this._rootClass();
            if (!this._root) throw new Error('Invalid root class: ' + this._rootClass);
            this._stage.addChildAt(this._root, 0);

            this.dispatchEventWith(Event.ROOT_CREATED, false, this._root);
        }
    }

    /** Calls <code>advanceTime()</code> (with the time that has passed since the last frame)
     *  and <code>render()</code>. */
    nextFrame = time => {
        const now = time / 1000;
        let passedTime = now - this._frameTimestamp;
        this._frameTimestamp = now;

        // to avoid overloading time-based animations, the maximum delta is truncated.
        if (passedTime > 1.0) passedTime = 1.0;

        if (this._rendering) {
            this.advanceTime(passedTime);
            this.render();
        }

        window.requestAnimationFrame(this.nextFrame);
    };

    /** Dispatches ENTER_FRAME events on the display list, advances the Juggler
     *  and processes touches. */
    advanceTime(passedTime) {
        this.makeCurrent();

        this._touchProcessor.advanceTime(passedTime);
        this._stage.advanceTime(passedTime);
        this._juggler.advanceTime(passedTime);
    }

    /** Renders the complete display list. Before rendering, the context is cleared; afterwards,
     *  it is presented (to avoid this, enable <code>shareContext</code>).
     *
     *  <p>This method also dispatches an <code>Event.RENDER</code>-event on the Starling
     *  instance. That's the last opportunity to make changes before the display list is
     *  rendered.</p> */
    render() {
        this.makeCurrent();
        this.updateViewPort();

        const doRedraw = this._stage.requiresRedraw;
        if (doRedraw) {
            this.dispatchEventWith(Event.RENDER);

            //const shareContext = this._painter.shareContext;
            const scaleX = this._viewPort.width / this._stage.stageWidth;
            const scaleY = this._viewPort.height / this._stage.stageHeight;
            const stageColor = this._stage.color;

            this._painter.nextFrame();
            this._painter.pixelSize = 1.0 / this.contentScaleFactor;

            this._painter.state.setProjectionMatrix(
                this._viewPort.x < 0 ? -this._viewPort.x / scaleX : 0.0,
                this._viewPort.y < 0 ? -this._viewPort.y / scaleY : 0.0,
                this._viewPort.width / scaleX,
                this._viewPort.height / scaleY,
                this._stage.stageWidth, this._stage.stageHeight, this._stage.cameraPosition);

            if (!this.shareContext)
                this._painter.clear(stageColor, 1.0);

            this._stage.render(this._painter);
            this._painter.finishFrame();
            this._painter.frameID = ++this._frameID;

            if (!this.shareContext)
                this._painter.present();
        }

        //console.log('[Starling] Draw count:', this._painter.drawCount);

        //if (_statsDisplay)
        //{
        //    _statsDisplay.drawCount = _painter.drawCount;
        //    if (!doRedraw) _statsDisplay.markFrameAsSkipped();
        //}
    }

    updateViewPort(forceUpdate = false) {
        // the last set viewport is stored in a variable; that way, people can modify the
        // viewPort directly (without a copy) and we still know if it has changed.

        if (forceUpdate || !RectangleUtil.compare(this._viewPort, this._previousViewPort)) {
            //this._previousViewPort.setTo(this._viewPort.x, this._viewPort.y, this._viewPort.width, this._viewPort.height);
            //
            //// Constrained mode requires that the viewport is within the native stage bounds;
            //// thus, we use a clipped viewport when configuring the back buffer. (In baseline
            //// mode, that's not necessary, but it does not hurt either.)
            //
            //this._clippedViewPort = this._viewPort.intersection(
            //    new Rectangle(0, 0, this._nativeStage.stageWidth, this._nativeStage.stageHeight));
            //
            //if (_clippedViewPort.width  < 32) _clippedViewPort.width  = 32;
            //if (_clippedViewPort.height < 32) _clippedViewPort.height = 32;
            //
            //var contentScaleFactor:Number =
            //    _supportHighResolutions ? _nativeStage.contentsScaleFactor : 1.0;
            //
            //_painter.configureBackBuffer(_clippedViewPort, contentScaleFactor,
            //    _antiAliasing, true);
            //
            //setRequiresRedraw();
        }
    }

    onTouch = event => {
        if (!this._rendering) return;
        const { _stage, _viewPort } = this;

        let globalX;
        let globalY;
        let touchID;
        let phase;
        let pressure = 1.0;
        let width = 1.0;
        let height = 1.0;

        // figure out general touch properties
        if (event.constructor.name === 'MouseEvent') {
            const mouseEvent = event

            globalX = mouseEvent.offsetX;
            globalY = mouseEvent.offsetY;
            touchID = 0;

            // MouseEvent.buttonDown returns true for both left and right button (AIR supports
            // the right mouse button). We only want to react on the left button for now,
            // so we have to save the state for the left button manually.
            if (event.type === MouseEventType.MOUSE_DOWN) this._leftMouseDown = true;
            else if (event.type === MouseEventType.MOUSE_UP) this._leftMouseDown = false;
        } else {
            console.log('todo: implement touch events')
            //const touchEvent = event;
            //
            //// On a system that supports both mouse and touch input, the primary touch point
            //// is dispatched as mouse event as well. Since we don't want to listen to that
            //// event twice, we ignore the primary touch in that case.
            //
            //if (Mouse.supportsCursor && touchEvent.isPrimaryTouchPoint) return;
            //else {
            //    globalX = touchEvent.stageX;
            //    globalY = touchEvent.stageY;
            //    touchID = touchEvent.touchPointID;
            //    pressure = touchEvent.pressure;
            //    width = touchEvent.sizeX;
            //    height = touchEvent.sizeY;
            //}
        }

        // figure out touch phase
        switch (event.type) {
            case TouchEventType.TOUCH_START:
                phase = TouchPhase.BEGAN;
                break;
            case TouchEventType.TOUCH_MOVE:
                phase = TouchPhase.MOVED;
                break;
            case TouchEventType.TOUCH_END:
                phase = TouchPhase.ENDED;
                break;
            case MouseEventType.MOUSE_DOWN:
                phase = TouchPhase.BEGAN;
                break;
            case MouseEventType.MOUSE_UP:
                phase = TouchPhase.ENDED;
                break;
            case MouseEventType.MOUSE_MOVE:
                phase = (this._leftMouseDown ? TouchPhase.MOVED : TouchPhase.HOVER);
                break;
            default:
        }

        // move position into viewport bounds
        globalX = _stage.stageWidth * (globalX - _viewPort.x) / _viewPort.width;
        globalY = _stage.stageHeight * (globalY - _viewPort.y) / _viewPort.height;

        // enqueue touch in touch processor
        this._touchProcessor.enqueue(touchID, phase, globalX, globalY, pressure, width, height);

        // allow objects that depend on mouse-over state to be updated immediately
        if (event.type === MouseEvent.MOUSE_UP && detectIt.hasMouse)
            this._touchProcessor.enqueue(touchID, TouchPhase.HOVER, globalX, globalY);
    };

    onKey = event => {
        if (!this._rendering) return;

        const keyEvent = new KeyboardEvent(
            event.type, event.charCode, event.key, event.location,
            event.ctrlKey, event.altKey, event.shiftKey);

        this.makeCurrent();
        this._stage.dispatchEvent(keyEvent);

        if (keyEvent.isDefaultPrevented())
            event.preventDefault();
    };

    get touchEventTypes() {
        const types = [];

        if (this.multitouchEnabled)
            types.push(TouchEventType.TOUCH_START, TouchEventType.TOUCH_MOVE, TouchEventType.TOUCH_END);

        if (!this.multitouchEnabled || detectIt.hasMouse)
            types.push(MouseEventType.MOUSE_DOWN, MouseEventType.MOUSE_MOVE, MouseEventType.MOUSE_UP);

        return types;
    }

    makeCurrent = () => {
        Starling.sCurrent = this;
    };

    // Public API

    start() {
        this._rendering = true;
        this._frameTimestamp = new Date().getTime() / 1000.0;
    }

    stop() {
        this._rendering = false;
    }

    get isStarted() {
        return this._rendering;
    }

    get contentScaleFactor() {
        return (this._viewPort.width * this._painter.backBufferScaleFactor) / this._stage.stageWidth;
    }

    get stage() {
        return this._stage;
    }

    get context() {
        return this._painter.context;
    }

    get frameID() {
        return this._frameID;
    }

    get contextValid() {
        return this._painter.contextValid;
    }

    /** The instance of the root class provided in the constructor. Available as soon as
     *  the event 'ROOT_CREATED' has been dispatched. */
    get root() {
        return this._root;
    }

    get simulateMultitouch() {
        return this._touchProcessor.simulateMultitouch;
    }

    set simulateMultitouch(value) {
        this._touchProcessor.simulateMultitouch = value;
    }

    get juggler() {
        return this._juggler;
    }

    static get current() {
        return Starling.sCurrent;
    }

    static get context() {
        return Starling.sCurrent ? Starling.sCurrent.context : null;
    }

    static get painter() {
        return Starling.sCurrent ? Starling.sCurrent._painter : null;
    }

    static get contentScaleFactor() {
        return Starling.sCurrent ? Starling.sCurrent.contentScaleFactor : 1.0;
    }

    static get frameID() {
        return Starling.sCurrent ? Starling.sCurrent._frameID : 0;
    }

    static get multitouchEnabled() {
        return detectIt.hasTouch;
    }

    static get juggler() {
        return Starling.sCurrent ? Starling.sCurrent._juggler : null;
    }
}
