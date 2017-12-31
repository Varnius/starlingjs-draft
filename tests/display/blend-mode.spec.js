import BlendMode from '../../src/display/blend-mode';
import GLC from 'gl-constants';

describe('BlendMode', () => {
    it('should register', () => {
        const name = 'test';
        const srcFactor = GLC.ONE_MINUS_SRC_ALPHA;
        const dstFactor = GLC.DST_COLOR;

        BlendMode.register(name, srcFactor, dstFactor);

        expect(srcFactor).to.equal(BlendMode.get(name).sourceFactor);
        expect(dstFactor).to.equal(BlendMode.get(name).destinationFactor);
    });
});
