import { Starling, Quad, Sprite } from '../src/index';

class App extends Sprite {
    constructor()
    {
        super();
        this.addChild(new Quad(50, 50));
    }
}

const canvas = document.getElementById('starling-canvas');
const starling = new Starling(App, canvas, null, window);

starling.start();

// UI

document.getElementById('start-stop').onclick = () =>
{
    if (starling.isStarted)
        starling.stop();
    else
        starling.start();
};
