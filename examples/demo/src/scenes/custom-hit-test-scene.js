import { TextField, Align } from '../../../../src/index';

import RoundButton from '../utils/round-button';
import Scene from './scene';
import Game from '../game';
import Constants from '../constants';

export default class CustomHitTestScene extends Scene {
    constructor() {
        super();
        const description =
            `Pushing the bird only works when the touch occurs within a circle.
            This can be accomplished by overriding the method 'hitTest'.`;

        const infoText = new TextField(300, 100, description);
        infoText.x = infoText.y = 10;
        infoText.format.verticalAlign = Align.TOP;
        infoText.format.horizontalAlign = Align.CENTER;
        this.addChild(infoText);

        // 'RoundButton' is a helper class of the Demo, not a part of Starling!
        // Have a look at its code to understand this sample.

        const button = new RoundButton(Game.assets.getTexture('starling_round'));
        button.x = Constants.CenterX - Math.floor(button.width / 2);
        button.y = 150;
        this.addChild(button);
    }
}
