import { Starling, Sprite, Image, Quad } from '../../../src/index';
import MainMenu from './main-menu';

export default class Game extends Sprite {
    // Embed the Ubuntu Font. Beware: the 'embedAsCFF'-part IS REQUIRED!!!
    //[Embed(source="../../demo/assets/fonts/Ubuntu-R.ttf", embedAsCFF="false", fontFamily="Ubuntu")]
    //private static const UbuntuRegular:Class;

    _mainMenu;
    _currentScene;

    static sAssets;

    start(assets)
    {
        Game.sAssets = assets;
        //this.addChild(new Image(assets.getTexture('background')));
        this.showMainMenu();
        const s = new Quad(50, 50, 0xFF0000);
        s.x = 60;s.y = 55;
        this.addChild(s)
        this.addEventListener(Event.TRIGGERED, this.onButtonTriggered);
        this.stage.addEventListener(KeyboardEvent.KEY_DOWN, this.onKey);
    }

    showMainMenu()
    {
        if (!this._mainMenu)
            this._mainMenu = new MainMenu();

        this.addChild(this._mainMenu);
    }

    onKey = event =>
    {
        if (event.key === 'Space')
            Starling.current.showStats = !Starling.current.showStats;
    };

    onButtonTriggered = event =>
    {
        const button = event.target;

        if (button.name === 'backButton')
            this.closeScene();
        else
            this.showScene(button.name);
    };

    closeScene()
    {
        this._currentScene.removeFromParent(true);
        this._currentScene = null;
        this.showMainMenu();
    }

    showScene(name)
    {
        //if (_currentScene) return;
        //
        //const sceneClass = getDefinitionByName(name) as Class;
        //_currentScene = new sceneClass() as Scene;
        //_mainMenu.removeFromParent();
        //addChild(_currentScene);
    }

    static get assets()
    {
        return Game.sAssets;
    }
}
