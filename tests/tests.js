import { expect } from 'chai';
import Starling from '../src/core/starling';
import Sprite from '../src/display/sprite';
import { FakeContext } from './test-utils/fake-context';
import fetch from 'node-fetch';

new Starling(
    Sprite,
    // mock canvas
    {
        getContext: () => new FakeContext(),
        addEventListener() {
        },
    },
    null,
    {
        requestAnimationFrame() {
        },
    }
);

global.expect = expect;
global.window = {
    fetch,
    createImageBitmap: input => input,
};
global.navigator = {};
