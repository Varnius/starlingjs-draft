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

    it('should load assets via enqueueWithName', async () =>
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

    it('should load multiple assets via enqueue and assign correct names', async () =>
    {
        const imageBlob = { width: 50, height: 40 };
        const textureResponse = { blob: () => Promise.resolve(imageBlob) };

        nock(basePath)
            .get('/texture.png')
            .reply(() => textureResponse)
            .get('/texture2.png')
            .reply(() => textureResponse);

        assetManager.enqueue([
            { path: `${basePath}texture.png` },
            { path: `${basePath}texture2.png` },
        ]);

        expect(assetManager.getTexture('texture')).to.not.exist;
        expect(assetManager.getTexture('texture2')).to.not.exist;

        await assetManager.loadQueue();

        expect(assetManager.getTexture('texture')).to.exist;
        expect(assetManager.getTexture('texture2')).to.exist;
    });

    it('should load texture XML atlases', async () =>
    {
        const imageBlob = { width: 50, height: 40 };
        const atlas = `
            <?xml version="1.0" encoding="UTF-8"?>
            <TextureAtlas imagePath="atlas.png" width="788" height="788">
                <SubTexture name="subtexture1" x="337" y="754" width="32" height="32"/>
                <SubTexture name="subtexture2" x="1" y="704" width="63" height="64" frameX="0" frameY="0" frameWidth="64" frameHeight="64"/>
            </TextureAtlas>
        `;

        nock(basePath)
            .get('/atlas.png')
            .reply(() => ({ blob: () => Promise.resolve(imageBlob) }))
            .get('/atlas.xml')
            .reply(201, atlas, { 'Content-Type': 'application/xml' });

        assetManager.enqueue([
            { path: `${basePath}atlas.png` },
            { path: `${basePath}atlas.xml` },
        ]);

        expect(assetManager.getTexture('subtexture1')).to.not.exist;
        expect(assetManager.getTexture('subtexture2')).to.not.exist;

        await assetManager.loadQueue();

        expect(assetManager.getTexture('subtexture1')).to.exist;
        expect(assetManager.getTexture('subtexture2')).to.exist;
    });
});
