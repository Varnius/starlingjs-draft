import ConcreteTexture from '../../src/textures/concrete-texture';

export default class MockTexture extends ConcreteTexture {
    constructor(width = 16, height = 16, scale = 1)
    {
        super(null, 'bgra', width, height, false, true, false, scale);
    }
}
