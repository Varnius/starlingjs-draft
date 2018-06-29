import { MovieClip, Event } from '../../../../src/index';

import Scene from './scene';
import Game from '../game';
import Constants from '../constants';

export default class MovieScene extends Scene {
    _movie;
    _juggler;

    constructor() {
        super();

        this._juggler = window.StarlingContextManager.current.juggler;

        const frames = Game.assets.getTextures('flight');
        const movie = this._movie = new MovieClip(frames, 15);

        // add sounds
        //var stepSound:Sound = Game.assets.getSound("wing_flap");
        //_movie.setFrameSound(2, stepSound);

        // move the clip to the center and add it to the stage
        movie.x = Constants.CenterX - Math.floor(movie.width / 2);
        movie.y = Constants.CenterY - Math.floor(movie.height / 2);
        this.addChild(movie);

        // like any animation, the movie needs to be added to the juggler!
        // this is the recommended way to do that.
        this.addEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage);
        this.addEventListener(Event.REMOVED_FROM_STAGE, this.onRemovedFromStage);
    }

    onAddedToStage = () => {
        this._juggler.add(this._movie);
    };

    onRemovedFromStage = () => {
        this._juggler.remove(this._movie);
    };

    dispose() {
        this.removeEventListener(Event.REMOVED_FROM_STAGE, this.onRemovedFromStage);
        this.removeEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage);
        super.dispose();
    }
}
