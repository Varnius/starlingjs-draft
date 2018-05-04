import { Sprite, Quad, Starling, TouchEvent, Image, TouchPhase, Canvas } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';

export default class MaskScene extends Scene {
    _contents;
    // Using _mask breaks things as there is an internal check for _mask in
    // the render loop and there is no concept of private variables in JS
    _savedMask;
    _maskDisplay;

    constructor() {
        super();
        this._contents = new Sprite();
        this.addChild(this._contents);

        const stageWidth = Starling.current.stage.stageWidth;
        const stageHeight = Starling.current.stage.stageHeight;

        const touchQuad = new Quad(stageWidth, stageHeight);
        touchQuad.alpha = 0; // only used to get touch events
        this.addChildAt(touchQuad, 0);

        const image = new Image(Game.assets.getTexture('flight_00'));
        image.x = (stageWidth - image.width) / 2;
        image.y = 80;
        this._contents.addChild(image);

        //todo:
        // just to prove it works, use a filter on the image.
        //const cm = new ColorMatrixFilter();
        //cm.adjustHue(-0.5);
        //image.filter = cm;

        //const maskText:TextField = new TextField(256, 128,
        //    "Move the mouse (or a finger) over the screen to move the mask.");
        //maskText.x = (stageWidth - maskText.width) / 2;
        //maskText.y = 260;
        //maskText.format.size = 20;
        //_contents.addChild(maskText);

        this._maskDisplay = this.createCircle();
        this._maskDisplay.alpha = 0.1;
        this._maskDisplay.touchable = false;
        this.addChild(this._maskDisplay);

        this._savedMask = this.createCircle();
        this._contents.mask = this._savedMask;
        this._contents.maskInverted = true;

        this.addEventListener(TouchEvent.TOUCH, this.onTouch);
    }

    onTouch = event => {
        const touch = event.getTouch(this, TouchPhase.HOVER) ||
            event.getTouch(this, TouchPhase.BEGAN) ||
            event.getTouch(this, TouchPhase.MOVED);

        if (touch) {
            const localPos = touch.getLocation(this);
            this._savedMask.x = localPos.x;
            this._savedMask.y = localPos.y;
            this._maskDisplay.x = localPos.x;
            this._maskDisplay.y = localPos.y;
        }
    }

    createCircle() {
        const circle = new Canvas();
        circle.beginFill(0xff0000);
        circle.drawCircle(0, 0, 100);
        circle.endFill();
        return circle;
        //const q =  new Quad(100, 100);
        //q.pivotX = 50;
        //q.pivotY = 50;
        //return q;
    }
}
