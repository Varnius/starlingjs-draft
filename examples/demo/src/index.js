import 'regenerator-runtime/runtime';
import { Starling, Rectangle, AssetManager } from '../../../src/index';

import Game from './game';
import Constants from './constants';

(function () {
    let starling;

    async function loadAssets(scaleFactor) {
        const assetManager = new AssetManager();

        assetManager.enqueue([
            { path: `/demo/assets/textures/${scaleFactor}x/background.jpg` },
            { path: `/demo/assets/textures/${scaleFactor}x/atlas.png` },
            { path: `/demo/assets/textures/${scaleFactor}x/atlas.xml` },

        ]);
        await assetManager.loadQueue();

        return assetManager;
    }

    async function init() {
        // We develop the game in a *fixed* coordinate system of 320x480

        const canvas = document.getElementById('starling-canvas');
        const viewPort = new Rectangle(0, 0, canvas.width, canvas.height);
        const scaleFactor = viewPort.width < 480 ? 1 : 2; // midway between 320 and 640

        starling = new Starling(Game, canvas, viewPort, window);
        starling.stage.stageWidth = Constants.StageWidth;  // <- same size on all devices!
        starling.stage.stageHeight = Constants.StageHeight; // <- same size on all devices!
        starling.skipUnchangedFrames = true;
        starling.simulateMultitouch = true;

        const assets = await loadAssets(scaleFactor);

        starling.start();
        starling.root.start(assets); // starling.root is actually our Game instance
    }

    init();
}());
