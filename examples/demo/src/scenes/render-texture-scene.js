import { Event, TouchEvent, RenderTexture, BlendMode, TextField, TouchPhase, Image } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';
import Constants from '../constants';
import MenuButton from '../utils/menu-button';

export default class RenderTextureScene extends Scene {
    _renderTexture;
    _canvas;
    _brush;
    _button;
    _colors;

    constructor() {
        super();

        this._colors = new Map();
        this._renderTexture = new RenderTexture(320, 435);

        this._canvas = new Image(this._renderTexture);
        this._canvas.addEventListener(TouchEvent.TOUCH, this.onTouch);
        this.addChild(this._canvas);

        this._brush = new Image(Game.assets.getTexture('brush'));
        this._brush.pivotX = this._brush.width / 2;
        this._brush.pivotY = this._brush.height / 2;
        this._brush.blendMode = BlendMode.NORMAL;

        const infoText = new TextField(256, 128, 'Touch the screen\nto draw!');
        infoText.format.size = 24;
        infoText.x = Constants.CenterX - infoText.width / 2;
        infoText.y = Constants.CenterY - infoText.height / 2;
        this._renderTexture.draw(infoText);
        infoText.dispose();

        this._button = new MenuButton('Mode: Draw');
        this._button.x = Math.floor(Constants.CenterX - this._button.width / 2);
        this._button.y = 15;
        this._button.addEventListener(Event.TRIGGERED, this.onButtonTriggered);
        this.addChild(this._button);
    }

    onTouch = event => {
        // touching the canvas will draw a brush texture. The 'drawBundled' method is not
        // strictly necessary, but it's faster when you are drawing with several fingers
        // simultaneously.

        this._renderTexture.drawBundled(() => {
            const touches = event.getTouches(this._canvas);

            for (const touch of touches) {
                if (touch.phase === TouchPhase.BEGAN)
                    this._colors[touch.id] = Math.random() * 4294967295;

                if (touch.phase === TouchPhase.HOVER || touch.phase === TouchPhase.ENDED)
                    continue;

                const location = touch.getLocation(this._canvas);
                this._brush.x = location.x;
                this._brush.y = location.y;
                this._brush.color = this._colors[touch.id];
                this._brush.rotation = Math.random() * Math.PI * 2.0;

                this._renderTexture.draw(this._brush);

                // necessary because 'Starling.skipUnchangedFrames === true'
                this.setRequiresRedraw();
            }
        });
    };

    onButtonTriggered = () => {
        if (this._brush.blendMode === BlendMode.NORMAL) {
            this._brush.blendMode = BlendMode.ERASE;
            this._button.text = 'Mode: Erase';
        } else {
            this._brush.blendMode = BlendMode.NORMAL;
            this._button.text = 'Mode: Draw';
        }
    };

    dispose() {
        this._renderTexture.dispose();
        super.dispose();
    }
}
