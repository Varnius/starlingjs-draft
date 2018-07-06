import AssetManager from '../../src/utils/asset-manager'
import nock from 'nock'

describe('AssetManager', () => {
  let assetManager
  const basePath = 'http://something/'

  beforeEach(() => {
    assetManager = new AssetManager()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('should load assets via enqueueWithName', async () => {
    const imageBlob = { width: 50, height: 40 }

    nock(basePath)
      .get('/texture.png')
      .reply(() => ({ blob: () => Promise.resolve(imageBlob) }))

    assetManager.enqueueWithName({
      path: `${basePath}texture.png`,
      name: 'leTexture'
    })

    expect(assetManager.getTexture('leTexture')).to.not.exist

    await assetManager.loadQueue()

    expect(assetManager.getTexture('leTexture')).to.exist
  })

  it('should load multiple assets via enqueue and assign correct names', async () => {
    const imageBlob = { width: 50, height: 40 }
    const textureResponse = { blob: () => Promise.resolve(imageBlob) }

    nock(basePath)
      .get('/texture.png')
      .reply(() => textureResponse)
      .get('/texture2.png')
      .reply(() => textureResponse)

    assetManager.enqueue([
      { path: `${basePath}texture.png` },
      { path: `${basePath}texture2.png` }
    ])

    expect(assetManager.getTexture('texture')).to.not.exist
    expect(assetManager.getTexture('texture2')).to.not.exist

    await assetManager.loadQueue()

    expect(assetManager.getTexture('texture')).to.exist
    expect(assetManager.getTexture('texture2')).to.exist
  })

  it('should load texture XML atlases', async () => {
    const imageBlob = { width: 50, height: 40 }
    const atlas = `
            <?xml version="1.0" encoding="UTF-8"?>
            <TextureAtlas imagePath="atlas.png" width="788" height="788">
                <SubTexture name="subtexture1" x="337" y="754" width="32" height="32"/>
                <SubTexture name="subtexture2" x="1" y="704" width="63" height="64" frameX="0" frameY="0" frameWidth="64" frameHeight="64"/>
            </TextureAtlas>
        `

    nock(basePath)
      .get('/atlas.png')
      .reply(() => ({ blob: () => Promise.resolve(imageBlob) }))
      .get('/atlas.xml')
      .reply(201, atlas, { 'Content-Type': 'application/xml' })

    assetManager.enqueue([
      { path: `${basePath}atlas.png` },
      { path: `${basePath}atlas.xml` }
    ])

    expect(assetManager.getTexture('subtexture1')).to.not.exist
    expect(assetManager.getTexture('subtexture2')).to.not.exist

    await assetManager.loadQueue()

    expect(assetManager.getTexture('subtexture1')).to.exist
    expect(assetManager.getTexture('subtexture2')).to.exist
  })

  it('should return correct results with getTextures', async () => {
    const imageBlob = { width: 50, height: 40 }
    const atlas = `
            <?xml version="1.0" encoding="UTF-8"?>
            <TextureAtlas imagePath="atlas.png" width="788" height="788">
                <SubTexture name="subtexture1" x="337" y="754" width="32" height="32"/>
                <SubTexture name="subtexture2" x="1" y="704" width="63" height="64" frameX="0" frameY="0" frameWidth="64" frameHeight="64"/>
                <SubTexture name="otherName" x="1" y="704" width="63" height="64" frameX="0" frameY="0" frameWidth="64" frameHeight="64"/>
            </TextureAtlas>
        `

    nock(basePath)
      .get('/atlas.png')
      .reply(() => ({ blob: () => Promise.resolve(imageBlob) }))
      .get('/atlas.xml')
      .reply(201, atlas, { 'Content-Type': 'application/xml' })

    assetManager.enqueue([
      { path: `${basePath}atlas.png` },
      { path: `${basePath}atlas.xml` }
    ])

    expect(assetManager.getTextures('subtex')).to.be.empty

    await assetManager.loadQueue()

    expect(assetManager.getTextures('subtex')).to.have.lengthOf(2)
    expect(assetManager.getTextures('subtex__')).to.have.lengthOf(0)
    expect(assetManager.getTextures('other')).to.have.lengthOf(1)
  })

  it('should load bitmap fonts', async () => {
    const imageBlob = { width: 50, height: 40 }
    const font = `
            <font>
                <info face="Desyrel" size="35" bold="0" italic="0" chasrset="" unicode="0" stretchH="100" smooth="1" aa="1" padding="0,0,0,0" spacing="1,1"/>
                <common lineHeight="43" base="31" scaleW="256" scaleH="256" pages="1" packed="0"/>
                <pages>
                    <page id="0" file="desyrel.png"/>
                </pages>
                <chars count="1">
                    <char id="83" x="1" y="1" width="19" height="39" xoffset="3" yoffset="2" xadvance="16" page="0" chnl="0" letter="S"/>
                    <char id="83" x="1" y="1" width="19" height="39" xoffset="3" yoffset="2" xadvance="16" page="0" chnl="0" letter="A"/>
                </chars>
                <kernings count="1">
                    <kerning first="83" second="83" amount="-4"/>
                    <kerning first="84" second="84" amount="-3"/>
                </kernings>
            </font>
        `

    nock(basePath)
      .get('/bitmapFont.png')
      .reply(() => ({ blob: () => Promise.resolve(imageBlob) }))
      .get('/bitmapFont.fnt')
      .reply(201, font, { 'Content-Type': 'application/xml' })

    assetManager.enqueue([
      { path: `${basePath}bitmapFont.png` },
      { path: `${basePath}bitmapFont.fnt` }
    ])

    expect(assetManager.getBitmapFont('bitmapFont')).to.be.undefined

    await assetManager.loadQueue()

    expect(assetManager.getBitmapFont('bitmapFont')).to.be.ok
    expect(assetManager.getBitmapFont('bitmapFont').name).to.equal('Desyrel')
  })
})
