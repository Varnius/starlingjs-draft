import 'regenerator-runtime/runtime';
import { expect } from 'chai';
import Starling from '../src/core/starling';
import Sprite from '../src/display/sprite';
import { FakeContext } from './test-utils/fake-context';
import fetch from 'node-fetch';

const mockWindow = {
    fetch,
    createImageBitmap: input => input,
    document: {
        getElementById: id =>
            id === 'text-canvas' ? { getContext: () => ({
                measureText: () => ({}),
                fillText: () => {},
                clearRect: () => {}
            }) } : null,
    },
    requestAnimationFrame() {
    },
};

new Starling(
    Sprite,
    // mock canvas
    {
        getContext: () => new FakeContext(),
        addEventListener() {
        },
    },
    null,
    mockWindow
);

global.expect = expect;
global.window = mockWindow;
global.navigator = {};
