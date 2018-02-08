import { Image, Starling, Sprite3D } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';
import Constants from '../constants';

export default class Sprite3DScene extends Scene {
    _cube;

    constructor() {
        super();

        const texture = Game.assets.getTexture('gamua-logo');

        this._cube = this.createCube(texture);
        this._cube.x = Constants.CenterX;
        this._cube.y = Constants.CenterY;
        this._cube.z = 100;

        this.addChild(this._cube);

        addEventListener(Event.ADDED_TO_STAGE, this.start);
        addEventListener(Event.REMOVED_FROM_STAGE, this.stop);
    }

    start() {
        Starling.juggler.tween(this._cube, 6, { rotationX: 2 * Math.PI, repeatCount: 0 });
        Starling.juggler.tween(this._cube, 7, { rotationY: 2 * Math.PI, repeatCount: 0 });
        Starling.juggler.tween(this._cube, 8, { rotationZ: 2 * Math.PI, repeatCount: 0 });
    }

    stop() {
        Starling.juggler.removeTweens(this._cube);
    }

    createCube(texture) {
        const { createSidewall } = this;
        const offset = texture.width / 2;

        const front = createSidewall(texture, 0xff0000);
        front.z = -offset;

        const back = createSidewall(texture, 0x00ff00);
        back.rotationX = Math.PI;
        back.z = offset;

        const top = createSidewall(texture, 0x0000ff);
        top.y = -offset;
        top.rotationX = Math.PI / -2.0;

        const bottom = createSidewall(texture, 0xffff00);
        bottom.y = offset;
        bottom.rotationX = Math.PI / 2.0;

        const left = createSidewall(texture, 0xff00ff);
        left.x = -offset;
        left.rotationY = Math.PI / 2.0;

        const right = createSidewall(texture, 0x00ffff);
        right.x = offset;
        right.rotationY = Math.PI / -2.0;

        const cube = new Sprite3D();
        cube.addChild(front);
        cube.addChild(back);
        cube.addChild(top);
        cube.addChild(bottom);
        cube.addChild(left);
        cube.addChild(right);

        return cube;
    }

    createSidewall(texture, color = 0xffffff) {
        const image = new Image(texture);
        image.color = color;
        image.alignPivot();

        const sprite = new Sprite3D();
        sprite.addChild(image);

        return sprite;
    }

    render(painter) {
        // Starling does not make any depth-tests, so we use a trick in order to only show
        // the front quads: we're activating backface culling, i.e. we hide triangles at which
        // we look from behind. 

        painter.pushState();
        //painter.state.culling = Context3DTriangleFace.BACK; todo: ???
        super.render(painter);
        painter.popState();
    }
}
