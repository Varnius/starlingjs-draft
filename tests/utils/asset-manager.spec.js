import AssetManager from '../../src/utils/asset-manager';
import nock from 'nock';

describe('AssetManager', () =>
{
    let assetManager;
    const basePath = 'http://something/';

    beforeEach(() =>
    {
        assetManager = new AssetManager();
    });

    afterEach(() =>
    {
        nock.cleanAll();
    });

    it('should load textures', async () =>
    {
        const imageBlob = { width: 50, height: 40 };

        nock(basePath)
            .get('/texture.png')
            .reply(() => ({ blob: () => Promise.resolve(imageBlob) }));

        assetManager.enqueueWithName({
            path: `${basePath}texture.png`,
            name: 'leTexture',
        });

        expect(assetManager.getTexture('leTexture')).to.not.exist;

        await assetManager.loadQueue();

        expect(assetManager.getTexture('leTexture')).to.exist;
    });
});
