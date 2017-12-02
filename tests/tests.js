import { expect } from 'chai';
import Starling from '../src/core/starling';
import Sprite from '../src/display/sprite';
import { FakeContext } from './utils/fake-context';

new Starling(
    Sprite,
    // mock canvas
    {
        getContext: () => new FakeContext(),
    },
    null,
    {
        requestAnimationFrame() {
        },
    }
);

global.expect = expect;
