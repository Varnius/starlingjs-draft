import { Sprite, Image, TouchPhase } from '../../../src/index';

import MenuButton from './utils/menu-button';
import Game from './game';
import TextureScene from './scenes/texture-scene';
import TouchScene from './scenes/touch-scene';
import TextScene from './scenes/text-scene';
import AnimationScene from './scenes/animation-scene';
import MovieScene from './scenes/movie-scene';
import BlendModeScene from './scenes/blend-mode-scene';
import BenchmarkScene from './scenes/benchmark-scene';
import Sprite3DScene from './scenes/sprite3d-scene';
import CustomHitTestScene from './scenes/custom-hit-test-scene';
import MaskScene from './scenes/mask-scene';
import FilterScene from './scenes/filter-scene';
import RenderTextureScene from './scenes/render-texture-scene';

export default class MainMenu extends Sprite {
    constructor() {
        super();
        this.init();
    }

    init() {
        const logo = new Image(Game.assets.getTexture('logo'));
        this.addChild(logo);

        const scenesToCreate = [
            ['Textures', TextureScene],
            ['Multitouch', TouchScene],
            ['TextFields', TextScene],
            ['Animations', AnimationScene],
            ['Custom hit-test', CustomHitTestScene],
            ['Movie Clip', MovieScene],
            ['Filters', FilterScene],
            ['Blend Modes', BlendModeScene],
            ['Render Texture', RenderTextureScene],
            ['Benchmark', BenchmarkScene],
            ['Masks', MaskScene],
            ['Sprite 3D', Sprite3DScene],
        ];

        let count = 0;

        for (const sceneToCreate of scenesToCreate) {
            const sceneTitle = sceneToCreate[0];
            const sceneClass = sceneToCreate[1];
            const button = new MenuButton(sceneTitle);
            button.sceneClass = sceneClass;
            button.height = 42;
            button.readjustSize();
            button.x = count % 2 === 0 ? 28 : 167;
            button.y = 155 + Math.floor(count / 2) * 46;

            this.addChild(button);

            if (scenesToCreate.length % 2 !== 0 && count % 2 === 1) {
                button.y += 24;
            }

            ++count;
        }

        // todo:
        // show information about rendering method (hardware/software)

        //var driverInfo = Starling.context.driverInfo;
        //var infoText:TextField = new TextField(310, 64, driverInfo);
        //infoText.format.size = 10;
        //infoText.format.verticalAlign = Align.BOTTOM;
        //infoText.x = 5;
        //infoText.y = 475 - infoText.height;
        //infoText.addEventListener(TouchEvent.TOUCH, onInfoTextTouched);
        //addChildAt(infoText, 0);
    }

    //onInfoTextTouched(event) {
    //    if (event.getTouch(this, TouchPhase.ENDED))
    //        window.StarlingContextManager.current.showStats = !window.StarlingContextManager.current.showStats;
    //}
}
