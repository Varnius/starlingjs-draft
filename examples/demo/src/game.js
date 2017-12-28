import { Starling, Sprite, Image, Quad } from '../../../src/index';
import MainMenu from './main-menu';

export default class Game extends Sprite {
    // Embed the Ubuntu Font. Beware: the 'embedAsCFF'-part IS REQUIRED!!!
    //[Embed(source="../../demo/assets/fonts/Ubuntu-R.ttf", embedAsCFF="false", fontFamily="Ubuntu")]
    //private static const UbuntuRegular:Class;

    _mainMenu;
    _currentScene;

    static sAssets;

    start(assets) {
        Game.sAssets = assets;
        this.addChild(new Image(assets.getTexture('background')));
        this.showMainMenu();
        this.addEventListener(Event.TRIGGERED, this.onButtonTriggered);
        this.stage.addEventListener(KeyboardEvent.KEY_DOWN, this.onKey);
    }

    showMainMenu() {
        if (!this._mainMenu)
            this._mainMenu = new MainMenu();

        this.addChild(this._mainMenu);
    }

    onKey = event => {
        if (event.key === 'Space')
            Starling.current.showStats = !Starling.current.showStats;
    };

    onButtonTriggered = event => {
        const button = event.target;

        if (button.name === 'backButton') {
            this.closeScene();
        } else {
            this.showScene(button.sceneClass);
        }
    };

    closeScene() {
        this._currentScene.removeFromParent(true);
        this._currentScene = null;
        this.showMainMenu();
    }

    showScene(sceneClass) {
        if (this._currentScene) return;

        this._currentScene = new sceneClass();
        this._mainMenu.removeFromParent();
        this.addChild(this._currentScene);
    }

    static get assets() {
        return Game.sAssets;
    }
}
