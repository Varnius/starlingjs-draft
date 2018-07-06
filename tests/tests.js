import 'regenerator-runtime/runtime'
import { expect } from 'chai'
import { FakeContext } from './test-utils/fake-context'
import fetch from 'node-fetch'
import Sprite from '../src/display/sprite'

const document = {
  getElementById: id =>
    id === 'starling-text-canvas'
      ? {
          getContext: () => ({
            measureText: () => ({}),
            fillText: () => {},
            clearRect: () => {},
            setTransform: () => {}
          })
        }
      : null
}

const mockWindow = {
  fetch,
  createImageBitmap: input => Promise.resolve(input),
  document,
  requestAnimationFrame() {},
  navigator: {
    userAgent: ''
  }
}

global.expect = expect
global.window = mockWindow
global.navigator = {}
global.Blob = require('blob-polyfill').Blob

global.document = document

const Starling = require('../src/core/starling').default

const starling = new Starling( // eslint-disable-line
  Sprite,
  // mock canvas
  {
    getContext: () => new FakeContext(),
    addEventListener() {}
  },
  null,
  mockWindow
)
