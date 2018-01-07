import { Starling, Event, Image, Sprite } from '../../../../src/index';

import Game from '../game';
import Scene from './scene';
import Constants from '../constants';
import MenuButton from '../utils/menu-button';

export default class BenchmarkScene extends Scene {
    static FRAME_TIME_WINDOW_SIZE = 10;
    static MAX_FAIL_COUNT = 100;

    _startButton;
    _resultText;
    _statusText;
    _container;
    _objectPool;
    _objectTexture;

    _frameCount;
    _failCount;
    _started;
    _frameTimes;
    _targetFps = 60;
    _phase;

    constructor() {
        super();

        // the container will hold all test objects
        this._container = new Sprite();
        this._container.x = Constants.CenterX;
        this._container.y = Constants.CenterY;
        this._container.touchable = false; // we do not need touch events on the test objects --
        // thus, it is more efficient to disable them.
        this.addChildAt(this._container, 0);

        //this._statusText = new TextField(Constants.GameWidth - 40, 30);
        //this._statusText.format = new TextFormat(BitmapFont.MINI, BitmapFont.NATIVEthis._SIZE * 2);
        //this._statusText.x = 20;
        //this._statusText.y = 10;
        //this.addChild(this._statusText);

        this._startButton = new MenuButton('Start benchmark', 140);
        this._startButton.addEventListener(Event.TRIGGERED, this.onStartButtonTriggered);
        this._startButton.x = Constants.CenterX - Math.floor(this._startButton.width / 2);
        this._startButton.y = 20;
        this.addChild(this._startButton);

        this._started = false;
        this._frameTimes = [];
        this._objectPool = [];
        this._objectTexture = Game.assets.getTexture('benchmark_object');

        this.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);
    }

    dispose() {
        this.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame);
        this._startButton.removeEventListener(Event.TRIGGERED, this.onStartButtonTriggered);

        for (const object of this._objectPool)
            object.dispose();

        super.dispose();
    }

    onStartButtonTriggered = () => {
        console.log('Starting benchmark'); // eslint-disable-line

        this._startButton.visible = false;
        this._started = true;
        this._frameCount = 0;
        this._failCount = 0;
        this._phase = 0;

        for (let i = 0; i < BenchmarkScene.FRAME_TIME_WINDOW_SIZE; ++i)
            this._frameTimes[i] = 1.0 / this._targetFps;

        if (this._resultText) {
            this._resultText.removeFromParent(true);
            this._resultText = null;
        }
    };

    onEnterFrame = (event, passedTime) => {
        if (!this._started) return;

        const { _container, _targetFps, _frameTimes } = this;
        const { FRAME_TIME_WINDOW_SIZE, MAX_FAIL_COUNT } = BenchmarkScene;

        this._frameCount++;
        _container.rotation += event.passedTime * 0.5;
        _frameTimes[FRAME_TIME_WINDOW_SIZE] = 0.0;

        for (let i = 0; i < FRAME_TIME_WINDOW_SIZE; ++i)
            _frameTimes[i] += passedTime;

        const measuredFps = FRAME_TIME_WINDOW_SIZE / _frameTimes.shift();

        if (this._phase === 0) {
            if (measuredFps < 0.985 * _targetFps) {
                this._failCount++;

                if (this._failCount === MAX_FAIL_COUNT)
                    this._phase = 1;
            } else {
                this.addTestObjects(16);
                _container.scale *= 0.99;
                this._failCount = 0;
            }
        }
        if (this._phase === 1) {
            if (measuredFps > 0.99 * _targetFps) {
                this._failCount--;

                if (this._failCount === 0)
                    this.benchmarkComplete();
            } else {
                this.removeTestObjects(1);
                _container.scale /= 0.9993720513; // 0.99 ^ (1/16)
            }
        }

        //if (this._frameCount % Math.floor(_targetFps / 4) == 0)
        //    _statusText.text = _container.numChildren.toString() + ' objects';
    };

    addTestObjects(count) {
        const scale = 1.0 / this._container.scale;

        for (let i = 0; i < count; ++i) {
            const egg = this.getObjectFromPool();
            const distance = (100 + Math.random() * 100) * scale;
            const angle = Math.random() * Math.PI * 2.0;

            egg.x = Math.cos(angle) * distance;
            egg.y = Math.sin(angle) * distance;
            egg.rotation = angle + Math.PI / 2.0;
            egg.scale = scale;

            this._container.addChild(egg);
        }
    }

    removeTestObjects(count) {
        const numChildren = this._container.numChildren;

        if (count >= numChildren)
            count = numChildren;

        for (let i = 0; i < count; ++i)
            this.putObjectToPool(this._container.removeChildAt(this._container.numChildren - 1));
    }

    getObjectFromPool() {
        // we pool mainly to avoid any garbage collection while the benchmark is running

        if (this._objectPool.length === 0) {
            const image = new Image(this._objectTexture);
            image.alignPivot();
            image.pixelSnapping = false; // slightly faster (and doesn't work here, anyway)
            return image;
        } else
            return this._objectPool.pop();
    }

    putObjectToPool(object) {
        this._objectPool[this._objectPool.length] = object;
    }

    benchmarkComplete() {
        this._started = false;
        this._startButton.visible = true;

        const { _container, _frameTimes } = this;

        const numChildren = _container.numChildren;
        console.log(`Result:\n${numChildren} objects\nwith ${this._targetFps} fps`); // eslint-disable-line

        //_resultText = new TextField(240, 200, resultString);
        //_resultText.format.size = 30;
        //_resultText.x = Constants.CenterX - _resultText.width / 2;
        //_resultText.y = Constants.CenterY - _resultText.height / 2;

        //addChild(_resultText);

        _container.scale = 1.0;
        _frameTimes.length = 0;
        //_statusText.text = '';

        for (let i = numChildren - 1; i >= 0; --i)
            this.putObjectToPool(_container.removeChildAt(i));
    }
}
