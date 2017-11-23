import { expect } from 'chai';
import Starling from '../src/core/starling';
import Sprite from '../src/display/sprite';

new Starling(
    new Sprite(),
    // mock canvas
    {
        getContext: () => ({
            depthFunc() {},
            depthMask() {},
        }),
    }
);

global.expect = expect;
