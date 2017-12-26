import 'regenerator-runtime/runtime';
import { Starling } from '../../src/index';
import App from './app';

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
