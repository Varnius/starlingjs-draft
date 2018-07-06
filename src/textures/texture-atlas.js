import Rectangle from '../math/rectangle'
import SubTexture from '../textures/subtexture'

/** A texture atlas is a collection of many smaller textures in one big image. This class
 *  is used to access textures from such an atlas.
 *
 *  <p>Using a texture atlas for your textures solves two problems:</p>
 *
 *  <ul>
 *    <li>Whenever you switch between textures, the batching of image objects is disrupted.</li>
 *    <li>Any Stage3D texture has to have side lengths that are powers of two. Starling hides
 *        this limitation from you, but at the cost of additional graphics memory.</li>
 *  </ul>
 *
 *  <p>By using a texture atlas, you avoid both texture switches and the power-of-two
 *  limitation. All textures are within one big "super-texture", and Starling takes care that
 *  the correct part of this texture is displayed.</p>
 *
 *  <p>There are several ways to create a texture atlas. One is to use the atlas generator
 *  script that is bundled with Starling's sibling, the <a href="http://www.sparrow-framework.org">
 *  Sparrow framework</a>. It was only tested in Mac OS X, though. A great multi-platform
 *  alternative is the commercial tool <a href="http://www.texturepacker.com">
 *  Texture Packer</a>.</p>
 *
 *  <p>Whatever tool you use, Starling expects the following file format:</p>
 *
 *  <listing>
 *    &lt;TextureAtlas imagePath='atlas.png'&gt;
 *      &lt;SubTexture name='texture_1' x='0'  y='0' width='50' height='50'/&gt;
 *      &lt;SubTexture name='texture_2' x='50' y='0' width='20' height='30'/&gt;
 *    &lt;/TextureAtlas&gt;
 *  </listing>
 *
 *  <strong>Texture Frame</strong>
 *
 *  <p>If your images have transparent areas at their edges, you can make use of the
 *  <code>frame</code> property of the Texture class. Trim the texture by removing the
 *  transparent edges and specify the original texture size like this:</p>
 *
 *  <listing>
 *    &lt;SubTexture name='trimmed' x='0' y='0' height='10' width='10'
 *        frameX='-10' frameY='-10' frameWidth='30' frameHeight='30'/&gt;
 *  </listing>
 *
 *  <strong>Texture Rotation</strong>
 *
 *  <p>Some atlas generators can optionally rotate individual textures to optimize the texture
 *  distribution. This is supported via the boolean attribute "rotated". If it is set to
 *  <code>true</code> for a certain subtexture, this means that the texture on the atlas
 *  has been rotated by 90 degrees, clockwise. Starling will undo that rotation by rotating
 *  it counter-clockwise.</p>
 *
 *  <p>In this case, the positional coordinates (<code>x, y, width, height</code>)
 *  are expected to point at the subtexture as it is present on the atlas (in its rotated
 *  form), while the "frame" properties must describe the texture in its upright form.</p>
 *
 */
export default class TextureAtlas {
  _atlasTexture
  _subTextures
  _subTextureNames

  static sNames = []

  /** Create a texture atlas from a texture by parsing the regions from an JSON file. */
  constructor(texture, atlasData) {
    this._subTextures = new Map()
    this._atlasTexture = texture

    if (atlasData) this.parseAtlasData(atlasData)
  }

  /** Disposes the atlas texture. */
  dispose() {
    this._atlasTexture.dispose()
  }

  parseBoolean(value) {
    return (
      value === 'true' || value === 'TRUE' || value === 'True' || value === '1'
    )
  }

  /** This function is called by the constructor and will parse JSON in Starling's
   *  default atlas file format. Override this method to create custom parsing logic
   *  (e.g. to support a different file format). */
  parseAtlasData(atlasData) {
    const scale = this._atlasTexture.scale
    const region = new Rectangle()
    const frame = new Rectangle()

    for (const subTexture of atlasData.TextureAtlas.SubTexture) {
      const { _attributes } = subTexture
      const name = _attributes.name
      const x = parseFloat(_attributes.x) / scale
      const y = parseFloat(_attributes.y) / scale
      const width = parseFloat(_attributes.width) / scale
      const height = parseFloat(_attributes.height) / scale
      const frameX = parseFloat(_attributes.frameX) / scale
      const frameY = parseFloat(_attributes.frameY) / scale
      const frameWidth = parseFloat(_attributes.frameWidth) / scale
      const frameHeight = parseFloat(_attributes.frameHeight) / scale
      const rotated = this.parseBoolean(_attributes.rotated)

      region.setTo(x, y, width, height)
      frame.setTo(frameX, frameY, frameWidth, frameHeight)

      if (frameWidth > 0 && frameHeight > 0)
        this.addRegion(name, region, frame, rotated)
      else this.addRegion(name, region, null, rotated)
    }
  }

  /** Retrieves a SubTexture by name. Returns <code>null</code> if it is not found. */
  getTexture(name) {
    return this._subTextures.get(name)
  }

  /** Returns all textures that start with a certain string, sorted alphabetically
   *  (especially useful for "MovieClip"). */
  getTextures(prefix = '', out = null) {
    if (!out) out = []

    for (const name of this.getNames(prefix, TextureAtlas.sNames))
      out[out.length] = this.getTexture(name) // avoid 'push'

    TextureAtlas.sNames.length = 0
    return out
  }

  /** Returns all texture names that start with a certain string, sorted alphabetically. */
  getNames(prefix = '', out = null) {
    if (!out) out = []

    if (!this._subTextureNames) {
      // optimization: store sorted list of texture names
      this._subTextureNames = []
      for (const name of this._subTextures.keys()) {
        this._subTextureNames[this._subTextureNames.length] = name
      }
      this._subTextureNames.sort()
    }

    for (const name of this._subTextureNames) {
      if (name.indexOf(prefix) === 0) {
        out[out.length] = name
      }
    }

    return out
  }

  /** Returns the region rectangle associated with a specific name, or <code>null</code>
   *  if no region with that name has been registered. */
  getRegion(name) {
    const subTexture = this._subTextures.get(name)
    return subTexture ? subTexture.region : null
  }

  /** Returns the frame rectangle of a specific region, or <code>null</code> if that region
   *  has no frame. */
  getFrame(name) {
    const subTexture = this._subTextures.get(name)
    return subTexture ? subTexture.frame : null
  }

  /** If true, the specified region in the atlas is rotated by 90 degrees (clockwise). The
   *  SubTexture is thus rotated counter-clockwise to cancel out that transformation. */
  getRotation(name) {
    const subTexture = this._subTextures.get(name)
    return subTexture ? subTexture.rotated : false
  }

  /** Adds a named region for a SubTexture (described by rectangle with coordinates in
   *  points) with an optional frame. */
  addRegion(name, region, frame = null, rotated = false) {
    this.addSubTexture(
      name,
      new SubTexture(this._atlasTexture, region, false, frame, rotated)
    )
  }

  /** Adds a named region for an instance of SubTexture or an instance of its sub-classes.*/
  addSubTexture(name, subTexture) {
    if (subTexture.root !== this._atlasTexture.root)
      throw new Error(
        '[ArgumentError] SubTexture`s root must be atlas texture.'
      )

    this._subTextures.set(name, subTexture)
    this._subTextureNames = null
  }

  /** Removes a region with a certain name. */
  removeRegion(name) {
    const subTexture = this._subTextures.get(name)
    if (subTexture) subTexture.dispose()
    this._subTextures.delete(name)
    this._subTextureNames = null
  }

  /** The base texture that makes up the atlas. */
  get texture() {
    return this._atlasTexture
  }
}
