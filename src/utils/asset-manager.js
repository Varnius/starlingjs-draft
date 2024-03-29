import { values } from 'ramda'
import { xml2json } from 'xml-js'

import { createTextureFromData } from './texture-creators'
import TextureOptions from '../textures/texture-options'
import TextureAtlas from '../textures/texture-atlas'
import TextField from '../text/text-field'
import BitmapFont from '../text/bitmap-font'

const DataType = {
  TEXTURE: { id: 'texture', extensions: ['png', 'jpg', 'jpeg'] },
  XML_ATLAS: { id: 'xml', extensions: ['xml'] },
  BITMAP_FONT: { id: 'bitmapFont', extensions: ['fnt'] }
}

export default class AssetManager {
  static sNames = []

  constructor(scaleFactor = 1, useMipmaps = false) {
    this._defaultTextureOptions = new TextureOptions(scaleFactor, useMipmaps)
    this._textures = new Map()
    this._atlases = new Map()
    this._bitmapFonts = new Map()
    this._queue = []
  }

  getType(descriptor) {
    return values(DataType).find(
      type =>
        !!type.extensions.find(extension => descriptor.path.includes(extension))
    )
  }

  getName(url) {
    const matches = /([^?/\\]+?)(?:\.([\w-]+))?(?:\?.*)?$/.exec(url)
    if (matches && matches.length > 0) return matches[1]
    else return null
  }

  enqueueWithName({ path, name, options }) {
    name = name || this.getName(path)

    if (!path) {
      throw new Error('[AssetManager] The path of the resource is invalid')
    }

    this._queue.push({
      path,
      name,
      options
    })
  }

  enqueue(assets) {
    assets.forEach(asset => this.enqueueWithName(asset))
  }

  async loadQueue() {
    const { _queue } = this

    // 1. Load all the assets

    const promises = _queue.map(({ path }) => window.fetch(path))
    const loadedQueue = await Promise.all(promises)

    // 2. Get appropriate content (text, blob, etc...) from fetch response

    const preparsedQueue = loadedQueue.map((data, index) => {
      const descriptor = _queue[index]
      const type = this.getType(descriptor)

      if (type === DataType.TEXTURE) {
        return data.blob().then(blobData => window.createImageBitmap(blobData))
      } else if (type === DataType.XML_ATLAS || type === DataType.BITMAP_FONT) {
        return data.text()
      }

      return Promise.resolve(data)
    })

    // 3. Parse the content.

    const parsedQueue = await Promise.all(preparsedQueue)
    const parsedAtlases = []
    const parsedBitmapFonts = []

    parsedQueue.forEach((item, index) => {
      const descriptor = _queue[index]
      const type = this.getType(descriptor)

      if (type === DataType.TEXTURE) {
        this.addTexture(
          descriptor.name,
          createTextureFromData({
            data: item,
            width: item.width,
            height: item.height
          })
        )
      } else if (type === DataType.XML_ATLAS) {
        parsedAtlases.push({
          data: JSON.parse(xml2json(item, { compact: true })),
          descriptor
        })
      } else if (type === DataType.BITMAP_FONT) {
        parsedBitmapFonts.push({
          data: JSON.parse(xml2json(item, { compact: true })),
          descriptor
        })
      }

      // other...
    })

    // 4. Create atlas textures/bitmap fonts, if any

    parsedAtlases.forEach(({ descriptor, data }) => {
      if (data.TextureAtlas) {
        const texture = this.getTexture(descriptor.name)
        this.addTextureAtlas(descriptor.name, new TextureAtlas(texture, data))
      }
    })

    parsedBitmapFonts.forEach(({ descriptor: { name }, data }) => {
      if (data.font) {
        const texture = this.getTexture(name)

        if (texture) {
          const font = new BitmapFont(texture, data)
          this._bitmapFonts.set(name, font)
          TextField.registerCompositor(font, name)
          this.removeTexture(name, false)
        } else
          throw new Error(
            `Cannot create bitmap font: texture "${name}" is missing.`
          )
      }
    })
  }

  addTexture(name, texture) {
    this._textures.set(name, texture)
  }

  getTexture(name) {
    const { _textures, _atlases } = this

    if (_textures.has(name)) return _textures.get(name)
    else {
      for (const atlas of _atlases.values()) {
        const texture = atlas.getTexture(name)
        if (texture) return texture
      }
      return null
    }
  }

  removeTexture(name, dispose) {
    if (dispose && this._textures.has(name)) this._textures.get(name).dispose()

    this._textures.delete(name)
  }

  getTextures(prefix, out = null) {
    if (!out) out = []

    for (const name of this.getTextureNames(prefix, AssetManager.sNames)) {
      out.push(this.getTexture(name))
    }

    AssetManager.sNames.length = 0
    return out
  }

  getTextureNames(prefix = '', out = null) {
    out = this.getDictionaryKeys(this._textures, prefix, out)

    for (const atlas of this._atlases.values()) {
      atlas.getNames(prefix, out)
    }

    out.sort()
    return out
  }

  getDictionaryKeys(dictionary, prefix = '', out = null) {
    if (!out) out = []

    for (const name of dictionary.keys()) {
      if (name.indexOf(prefix) === 0) out.push(name)
    }

    out.sort()

    return out
  }

  addTextureAtlas(name, atlas) {
    const existing = this._atlases.get(name)
    if (existing) {
      existing.dispose()
    }

    this._atlases.set(name, atlas)
  }

  getBitmapFont(name) {
    return this._bitmapFonts.get(name)
  }
}
