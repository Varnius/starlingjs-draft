import 'regenerator-runtime/runtime';
import { expect } from 'chai';
import { FakeContext } from './test-utils/fake-context';
import fetch from 'node-fetch';
import Sprite from '../src/display/sprite';

const mockWindow = {
    fetch,
    createImageBitmap: input => Promise.resolve(input),
    document: {
        getElementById: id =>
            id === 'text-canvas' ? { getContext: () => ({
                measureText: () => ({}),
                fillText: () => {},
                clearRect: () => {},
            }) } : null,
    },
    requestAnimationFrame() {
    },
    navigator: {
        userAgent: '',
    },
};

global.expect = expect;
global.window = mockWindow;
global.navigator = {};
global.Blob = require('blob-polyfill').Blob;

const Starling = require('../src/core/starling').default;

const starling = new Starling( // eslint-disable-line
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
