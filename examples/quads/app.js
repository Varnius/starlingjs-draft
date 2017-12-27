import { Quad, Sprite, Image, createTextureFromData } from '../../src/index';

export default class App extends Sprite
{
    constructor()
    {
        super();
        this.createScene();
    }

    async createScene()
    {
        let quad = new Quad(100, 100);
        quad.x = 100;
        quad.y = 100;
        quad.color = 0xf0f0f0;
        this.addChild(quad);

        quad = new Quad(100, 100);
        quad.x = 300;
        quad.y = 100;
        quad.color = 0x0000ff;
        this.addChild(quad);

        quad = new Quad(10, 300);
        quad.x = 140;
        quad.y = 40;
        quad.rotation = -0.3;
        quad.color = 0x00ff00;
        this.addChild(quad);

        const dogeImg = await fetch('quads/doge.png');
        const dogeBlob = await dogeImg.blob();
        const doge = await window.createImageBitmap(dogeBlob);
        const image = new Image(createTextureFromData({
            data: doge,
            width: doge.width,
            height: doge.height,
        }));
        image.scaleX = image.scaleY = 0.25;
        image.rotation = 0.3;
        image.x = 50;
        image.y = 50;

        this.addChild(image);
    }
}
