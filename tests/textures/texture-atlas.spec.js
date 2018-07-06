import { xml2json } from 'xml-js'

import TextureAtlas from '../../src/textures/texture-atlas'
import SubTexture from '../../src/textures/subtexture'
import Rectangle from '../../src/math/rectangle'
import MockTexture from '../test-utils/mock-texture'

describe('TextureAtlas', () => {
  it('should parse JSON', () => {
    const xml = `<TextureAtlas>
                <SubTexture name='ann' x='0'   y='0'  width='55.5' height='16' />
                <SubTexture name='bob' x='16'  y='32' width='16'   height='32' />
            </TextureAtlas>`

    const texture = new MockTexture(64, 64)
    const atlas = new TextureAtlas(
      texture,
      JSON.parse(xml2json(xml, { compact: true }))
    )

    const ann = atlas.getTexture('ann')
    const bob = atlas.getTexture('bob')

    expect(ann instanceof SubTexture).to.be.true
    expect(bob instanceof SubTexture).to.be.true

    expect(ann.width).to.equal(55.5)
    expect(ann.height).to.equal(16)
    expect(bob.width).to.equal(16)
    expect(bob.height).to.equal(32)

    const annST = ann
    const bobST = bob

    expect(annST.region.x).to.equal(0)
    expect(annST.region.y).to.equal(0)
    expect(bobST.region.x).to.equal(16)
    expect(bobST.region.y).to.equal(32)
  })

  it('should allow manual creation', () => {
    const texture = new MockTexture(64, 64)
    const atlas = new TextureAtlas(texture)

    atlas.addRegion('ann', new Rectangle(0, 0, 55.5, 16))
    atlas.addRegion('bob', new Rectangle(16, 32, 16, 32))

    expect(atlas.getTexture('ann')).to.not.be.null
    expect(atlas.getTexture('bob')).to.not.be.null
    expect(atlas.getTexture('carl')).to.be.undefined

    atlas.removeRegion('carl') // should not blow up
    atlas.removeRegion('bob')

    expect(atlas.getTexture('bob')).to.be.undefined
  })

  it('should add subtexture', () => {
    const texture = new MockTexture(64, 64)
    const subTexture = new SubTexture(texture, new Rectangle(32, 32, 32, 32))
    const atlas = new TextureAtlas(texture)
    atlas.addSubTexture('subTexture', subTexture)
    expect(subTexture).to.equal(atlas.getTexture('subTexture'))
  })

  it('should get textures', () => {
    const texture = new MockTexture(64, 64)
    const atlas = new TextureAtlas(texture)

    expect(atlas.texture).to.equal(texture)

    atlas.addRegion('ann', new Rectangle(0, 0, 8, 8))
    atlas.addRegion('prefix_3', new Rectangle(8, 0, 3, 8))
    atlas.addRegion('prefix_1', new Rectangle(16, 0, 1, 8))
    atlas.addRegion('bob', new Rectangle(24, 0, 8, 8))
    atlas.addRegion('prefix_2', new Rectangle(32, 0, 2, 8))

    const textures = atlas.getTextures('prefix_')

    expect(textures.length).to.equal(3)
    expect(textures[0].width).to.equal(1)
    expect(textures[1].width).to.equal(2)
    expect(textures[2].width).to.equal(3)
  })
})
