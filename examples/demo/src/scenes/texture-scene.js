import { Image } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';

export default class TextureScene extends Scene {
    constructor()
    {
        super();
        
        // the flight textures are actually loaded from an atlas texture.
        // the "AssetManager" class wraps it away for us.

        const image1 = new Image(Game.assets.getTexture('flight_00'));
        image1.x = -20;
        image1.y = 0;
        this.addChild(image1);

        const image2 = new Image(Game.assets.getTexture('flight_04'));
        image2.x = 90;
        image2.y = 85;
        this.addChild(image2);

        const image3 = new Image(Game.assets.getTexture('flight_08'));
        image3.x = 100;
        image3.y = -60;
        this.addChild(image3);
    }
}
