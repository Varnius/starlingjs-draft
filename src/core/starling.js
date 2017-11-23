import Stage from '../display/stage';
import EventDispatcher from '../events/event-dispatcher';
import Event from '../events/event';
import Color from '../utils/color';
import Painter from '../rendering/painter';
import Rectangle from '../math/rectangle';
import RectangleUtil from '../utils/rectangle-util';

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
    _started;
    _rendering;
    //_supportHighResolutions:Boolean;
    _skipUnchangedFrames;
    _showStats;

    _viewPort;
    _previousViewPort;
    _clippedViewPort;

    static sCurrent;
    static sAll = [];

    constructor(rootClass, canvas, viewPort = null)
    {
        super();
        
        if (!canvas) throw new Error('[ArgumentError] Canvas must not be null');
        if (!viewPort) viewPort = new Rectangle(0, 0, canvas.width, canvas.height); // ???

        //SystemUtil.initialize();
        Starling.sAll.push(this);
        this.makeCurrent();

        this._rootClass = rootClass;
        this._viewPort = viewPort;
        this._previousViewPort = new Rectangle();
        this._stage = new Stage(viewPort.width, viewPort.height, 0xFFFFFF);
        //this._touchProcessor = new TouchProcessor(this._stage);
        //this._juggler = new Juggler();
        this._antiAliasing = 0;
        this._supportHighResolutions = false;
        this._painter = new Painter(canvas);
        this._frameTimestamp = new Date().getTime() / 1000.0;
        this._frameID = 1;

        // register touch/mouse event handlers            
        //for (const touchEventType of touchEventTypes)
        //    stage.addEventListener(touchEventType, onTouch, false, 0, true);

        // register other event handlers
        //stage.addEventListener(Event.ENTER_FRAME, onEnterFrame, false, 0, true);
        //stage.addEventListener(KeyboardEvent.KEY_DOWN, onKey, false, 0, true);
        //stage.addEventListener(KeyboardEvent.KEY_UP, onKey, false, 0, true);
        //stage.addEventListener(Event.RESIZE, onResize, false, 0, true);
        //stage.addEventListener(Event.MOUSE_LEAVE, onMouseLeave, false, 0, true);

        //stage3D.addEventListener(Event.CONTEXT3D_CREATE, onContextCreated, false, 10, true);
        //stage3D.addEventListener(ErrorEvent.ERROR, onStage3DError, false, 10, true);

        this.initialize();
    }

    initialize()
    {
        this.makeCurrent();
        this.updateViewPort(true);

        // ideal time: after viewPort setup, before root creation
        //this.dispatchEventWith(Event.CONTEXT3D_CREATE, false, context);

        this.initializeRoot();
        this._frameTimestamp = new Date().getTime() / 1000.0;
    }

    initializeRoot()
    {
        if (!this._root && !this._rootClass)
        {
            this._root = new this._rootClass();
            if (!this._root) throw new Error('Invalid root class: ' + this._rootClass);
            this._stage.addChildAt(this._root, 0);

            this.dispatchEventWith(Event.ROOT_CREATED, false, this._root);
        }
    }

    /** Calls <code>advanceTime()</code> (with the time that has passed since the last frame)
     *  and <code>render()</code>. */
    nextFrame()
    {
        const now = new Date().getTime() / 1000.0;
        let passedTime = now - this._frameTimestamp;
        this._frameTimestamp = now;

        // to avoid overloading time-based animations, the maximum delta is truncated.
        if (passedTime > 1.0) passedTime = 1.0;

        // after about 25 days, 'getTimer()' will roll over. A rare event, but still ...
        //if (passedTime < 0.0) passedTime = 1.0 / _nativeStage.frameRate;

        this.advanceTime(passedTime);
        this.render();
    }

    /** Dispatches ENTER_FRAME events on the display list, advances the Juggler
     *  and processes touches. */
    advanceTime(passedTime)
    {
        //if (!contextValid)
        //    return;

        this.makeCurrent();

        //this._touchProcessor.advanceTime(passedTime);
        this._stage.advanceTime(passedTime);
        //_juggler.advanceTime(passedTime);
    }

    /** Renders the complete display list. Before rendering, the context is cleared; afterwards,
     *  it is presented (to avoid this, enable <code>shareContext</code>).
     *
     *  <p>This method also dispatches an <code>Event.RENDER</code>-event on the Starling
     *  instance. That's the last opportunity to make changes before the display list is
     *  rendered.</p> */
    render()
    {
        //if (!contextValid)
        //    return;

        this.makeCurrent();
        this.updateViewPort();

        const doRedraw = this._stage.requiresRedraw;
        if (doRedraw)
        {
            this.dispatchEventWith(Event.RENDER);

            const shareContext = this._painter.shareContext;
            const scaleX = this._viewPort.width / this._stage.stageWidth;
            const scaleY = this._viewPort.height / this._stage.stageHeight;
            const stageColor = this._stage.color;

            this._painter.nextFrame();
            this._painter.pixelSize = 1.0 / this.contentScaleFactor;
            this._painter.state.setProjectionMatrix(
                this._viewPort.x < 0 ? -this._viewPort.x / scaleX : 0.0,
                this._viewPort.y < 0 ? -this._viewPort.y / scaleY : 0.0,
                this._clippedViewPort.width / scaleX,
                this._clippedViewPort.height / scaleY,
                this._stage.stageWidth, this._stage.stageHeight, this._stage.cameraPosition);

            if (!this.shareContext)
                this._painter.clear(stageColor, Color.getAlpha(stageColor));

            this._stage.render(this._painter);
            this._painter.finishFrame();
            this._painter.frameID = ++this._frameID;

            if (!this.shareContext)
                this._painter.present();
        }

        //if (_statsDisplay)
        //{
        //    _statsDisplay.drawCount = _painter.drawCount;
        //    if (!doRedraw) _statsDisplay.markFrameAsSkipped();
        //}
    }

    updateViewPort(forceUpdate = false)
    {
        // the last set viewport is stored in a variable; that way, people can modify the
        // viewPort directly (without a copy) and we still know if it has changed.

        if (forceUpdate || !RectangleUtil.compare(this._viewPort, this._previousViewPort))
        {
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
    makeCurrent = () =>
    {
        Starling.sCurrent = this;
    };

    get contentScaleFactor()
    {
        return (this._viewPort.width * this._painter.backBufferScaleFactor) / this._stage.stageWidth;
    }

    get stage()
    {
        return this._stage;
    }

    static get current()
    {
        return Starling.sCurrent;
    }
}
