import { values } from 'ramda';

import { createTextureFromData } from './texture-creators';
import TextureOptions from '../textures/texture-options';

const DataType = {
    TEXTURE: { id: 'texture', extensions: ['png', 'jpg', 'jpeg'] },
};

export default class AssetManager {
    constructor(scaleFactor = 1, useMipmaps = false)
    {
        this._defaultTextureOptions = new TextureOptions(scaleFactor, useMipmaps);
        this._textures = new Map();
        this._atlases = new Map();
        this._queue = [];
    }

    getType(descriptor)
    {
        return values(DataType)
            .find(type => !!type.extensions.find(extension => descriptor.path.includes(extension)));
    }

    enqueueWithName({ path, name, options })
    {
        if (!path || !name)
        {
            throw new Error('[AssetManager] The resource being added has no valid name and/or path');
        }

        this._queue.push({
            path,
            name,
            options,
        });
    }

    async loadQueue()
    {
        const { _queue } = this;

        const promises = _queue.map(({ path }) => window.fetch(path));
        const loadedQueue = await Promise.all(promises);

        const preparsedQueue = loadedQueue.map((data, index) =>
        {
            const descriptor = _queue[index];
            const type = this.getType(descriptor);

            if (type === DataType.TEXTURE)
            {
                return data.blob().then(blobData => window.createImageBitmap(blobData));
            }

            return Promise.resolve(data);
        });

        const parsedQueue = await Promise.all(preparsedQueue);

        parsedQueue.forEach((item, index) =>
        {
            const descriptor = _queue[index];
            const type = this.getType(descriptor);

            if (type === DataType.TEXTURE)
            {
                this.addTexture(descriptor.name, createTextureFromData({
                    data: item,
                    width: item.width,
                    height: item.height,
                }));
            }

            // other...
        });
    }

    addTexture(name, texture)
    {
        this._textures.set(name, texture);
    }

    getTexture(name)
    {
        return this._textures.get(name);
    }
}
