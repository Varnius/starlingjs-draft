import { Starling, Image, Event, FragmentFilter, ColorMatrixFilter } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';
import Constants from '../constants';
import MenuButton from '../utils/menu-button';

export default class FilterScene extends Scene {
    _button;
    _image;
    _infoText;
    _filterInfos;
    _displacementMap;

    constructor() {
        super();

        this._button = new MenuButton('Switch Filter');
        this._button.x = Math.floor(Constants.CenterX - this._button.width / 2);
        this._button.y = 15;
        this._button.addEventListener(Event.TRIGGERED, this.onButtonTriggered);
        this.addChild(this._button);

        this._image = new Image(Game.assets.getTexture('starling_rocket'));
        this._image.x = Math.floor(Constants.CenterX - this._image.width / 2);
        this._image.y = 170;
        this.addChild(this._image);

        //this._infoText = new TextField(300, 32);
        //this._infoText.format.size = 19;
        //this._infoText.x = 10;
        //this._infoText.y = 330;
        //this.addChild(this._infoText);

        this.initFilters();
        this.onButtonTriggered();
    }

    dispose() {
        //this._displacementMap.dispose();
        super.dispose();
    }

    onButtonTriggered = () => {
        const filterInfo = this._filterInfos.shift();
        this._filterInfos.push(filterInfo);

        //this._infoText.text = filterInfo[0];
        this._image.filter = filterInfo[1];
    };

    initFilters() {
        this._filterInfos = [
            ['Identity', new FragmentFilter()],
            //['Blur', new BlurFilter()],
            //['Drop Shadow', new DropShadowFilter()],
            //['Glow', new GlowFilter()],
        ];

        //this._displacementMap = this.createDisplacementMap(this._image.width, this._image.height);

        //const displacementFilter:DisplacementMapFilter = new DisplacementMapFilter(
        //    this._displacementMap, BitmapDataChannel.RED, BitmapDataChannel.GREEN, 25, 25);
        //this._filterInfos.push(['Displacement Map', displacementFilter]);

        const invertFilter = new ColorMatrixFilter();
        invertFilter.invert();
        this._filterInfos.push(['Invert', invertFilter]);

        //const grayscaleFilter = new ColorMatrixFilter();
        //grayscaleFilter.adjustSaturation(-1);
        //this._filterInfos.push(['Grayscale', grayscaleFilter]);
        //
        //const saturationFilter = new ColorMatrixFilter();
        //saturationFilter.adjustSaturation(1);
        //this._filterInfos.push(['Saturation', saturationFilter]);
        //
        //const contrastFilter = new ColorMatrixFilter();
        //contrastFilter.adjustContrast(0.75);
        //this._filterInfos.push(['Contrast', contrastFilter]);
        //
        //const brightnessFilter = new ColorMatrixFilter();
        //brightnessFilter.adjustBrightness(-0.25);
        //this._filterInfos.push(['Brightness', brightnessFilter]);
        //
        //const hueFilter = new ColorMatrixFilter();
        //hueFilter.adjustHue(1);
        //this._filterInfos.push(['Hue', hueFilter]);
        //
        //const chain = new FilterChain(hueFilter, new DropShadowFilter());
        //this._filterInfos.push(['Hue + Shadow', chain]);
    }

    //createDisplacementMap(width, height) {
    //    const scale = Starling.contentScaleFactor;
    //    const map = new BitmapData(width * scale, height * scale, false);
    //    map.perlinNoise(20 * scale, 20 * scale, 3, 5, false, true);
    //    const texture = Texture.fromBitmapData(map, false, false, scale);
    //    return texture;
    //}
}
