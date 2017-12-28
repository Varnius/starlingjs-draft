import Quad from './quad';
import Pool from '../utils/pool';
import Rectangle from '../math/rectangle';
import MathUtil from '../utils/math-util';
import RectangleUtil from '../utils/rectangle-util';
import Padding from '../utils/padding';

/** An Image is a quad with a texture mapped onto it.
 *
 *  <p>Typically, the Image class will act as an equivalent of Flash's Bitmap class. Instead
 *  of BitmapData, Starling uses textures to represent the pixels of an image. To display a
 *  texture, you have to map it onto a quad - and that's what the Image class is for.</p>
 *
 *  <p>While the base class <code>Quad</code> already supports textures, the <code>Image</code>
 *  class adds some additional functionality.</p>
 *
 *  <p>First of all, it provides a convenient constructor that will automatically synchronize
 *  the size of the image with the displayed texture.</p>
 *
 *  <p>Furthermore, it adds support for a "Scale9" grid. This splits up the image into
 *  nine regions, the corners of which will always maintain their original size.
 *  The center region stretches in both directions to fill the remaining space; the side
 *  regions will stretch accordingly in either horizontal or vertical direction.</p>
 *
 *  <p>Finally, you can repeat a texture horizontally and vertically within the image's region,
 *  just like the tiles of a wallpaper. Use the <code>tileGrid</code> property to do that.</p>
 *
 *  @see starling.textures.Texture
 *  @see Quad
 */
export default class Image extends Quad {
    _scale9Grid = null;
    _tileGrid = null;

    static sSetupFunctions = new WeakMap();

    // helper objects
    static sPadding = new Padding();
    static sBounds = new Rectangle();
    static sBasCols = new Float32Array(3);
    static sBasRows = new Float32Array(3);
    static sPosCols = new Float32Array(3);
    static sPosRows = new Float32Array(3);
    static sTexCols = new Float32Array(3);
    static sTexRows = new Float32Array(3);

    /** Creates an image with a texture mapped onto it. */
    constructor(texture) {
        super(100, 100);
        this.texture = texture;
        this.readjustSize();
    }

    /** The current scaling grid that is in effect. If set to null, the image is scaled just
     *  like any other display object; assigning a rectangle will divide the image into a grid
     *  of nine regions, based on the center rectangle. The four corners of this grid will
     *  always maintain their original size; the other regions will stretch (horizontally,
     *  vertically, or both) to fill the complete area.
     *
     *  <p>Notes:</p>
     *
     *  <ul>
     *  <li>Assigning a Scale9 rectangle will change the number of vertices to a maximum of 16
     *  (less if possible) and all vertices will be colored like vertex 0 (the top left vertex).
     *  </li>
     *  <li>For Scale3-grid behavior, assign a zero size for all but the center row / column.
     *  This will cause the 'caps' to scale in a way that leaves the aspect ratio intact.</li>
     *  <li>An image can have either a <code>scale9Grid</code> or a <code>tileGrid</code>, but
     *  not both. Assigning one will delete the other.</li>
     *  <li>Changes will only be applied on assignment. To force an update, simply call
     *  <code>image.scale9Grid = image.scale9Grid</code>.</li>
     *  <li>Assignment causes an implicit call to <code>readjustSize()</code>,
     *  and the same will happen when the texture is changed afterwards.</li>
     *  </ul>
     *
     *  @default null
     */
    get scale9Grid() {
        return this._scale9Grid;
    }

    set scale9Grid(value) {
        if (value) {
            if (!this._scale9Grid) this._scale9Grid = value.clone();
            else this._scale9Grid.copyFrom(value);

            this.readjustSize();
            this._tileGrid = null;
        } else this._scale9Grid = null;

        this.setupVertices();
    }

    /** The current tiling grid that is in effect. If set to null, the image is scaled just
     *  like any other display object; assigning a rectangle will divide the image into a grid
     *  displaying the current texture in each and every cell. The assigned rectangle points
     *  to the bounds of one cell; all other elements will be calculated accordingly. A zero
     *  or negative value for the rectangle's width or height will be replaced with the actual
     *  texture size. Thus, you can make a 2x2 grid simply like this:
     *
     *  <listing>
     *  var image = new Image(texture);
     *  image.tileGrid = new Rectangle();
     *  image.scale = 2;</listing>
     *
     *  <p>Notes:</p>
     *
     *  <ul>
     *  <li>Assigning a tile rectangle will change the number of vertices to whatever is
     *  required by the grid. New vertices will be colored just like vertex 0 (the top left
     *  vertex).</li>
     *  <li>An image can have either a <code>scale9Grid</code> or a <code>tileGrid</code>, but
     *  not both. Assigning one will delete the other.</li>
     *  <li>Changes will only be applied on assignment. To force an update, simply call
     *  <code>image.tileGrid = image.tileGrid</code>.</li>
     *  </ul>
     *
     *  @default null
     */
    get tileGrid() {
        return this._tileGrid;
    }

    set tileGrid(value) {
        if (value) {
            if (!this._tileGrid) this._tileGrid = value.clone();
            else this._tileGrid.copyFrom(value);

            this._scale9Grid = null;
        } else this._tileGrid = null;

        this.setupVertices();
    }

    /** @private */
    setupVertices() {
        const texture = this.texture;
        if (texture && this._scale9Grid) this.setupScale9Grid();
        else if (texture && this._tileGrid) this.setupTileGrid();
        else super.setupVertices();
    }

    get scaleX() {
        return super.scaleX;
    }

    /** @private */
    set scaleX(value) {
        super.scaleX = value;
        if (this.texture && (this._scale9Grid || this._tileGrid)) this.setupVertices();
    }

    get scaleY() {
        return super.scaleY;
    }

    /** @private */
    set scaleY(value) {
        super.scaleY = value;
        if (this.texture && (this._scale9Grid || this._tileGrid)) this.setupVertices();
    }

    get texture() {
        return super.texture;
    }

    /** @private */
    set texture(value) {
        const texture = this.texture;

        if (value !== texture) {
            if (texture && Image.sSetupFunctions.get(texture)) {
                Image.sSetupFunctions.get(texture)[1](this);
            }

            super.texture = value;

            if (value && Image.sSetupFunctions.get(value)) {
                Image.sSetupFunctions.get(value)[0](this);
            } else if (this._scale9Grid && value) {
                this.readjustSize();
            }
        }
    }

    // vertex setup

    setupScale9Grid() {
        const { sBasCols, sBasRows, sPadding, sPosCols, sPosRows, sTexCols, sTexRows } = Image;
        const { scaleX, scaleY, texture } = this;

        const frame = texture.frame;
        let absScaleX = scaleX > 0 ? scaleX : -scaleX;
        let absScaleY = scaleY > 0 ? scaleY : -scaleY;

        if (absScaleX === 0.0 || absScaleY === 0) return;

        // If top and bottom row / left and right column are empty, this is actually
        // a scale3 grid. In that case, we want the 'caps' to maintain their aspect ratio.

        if (MathUtil.isEquivalent(this._scale9Grid.width, texture.frameWidth))
            absScaleY /= absScaleX;
        else if (MathUtil.isEquivalent(this._scale9Grid.height, texture.frameHeight))
            absScaleX /= absScaleY;

        const invScaleX = 1.0 / absScaleX;
        const invScaleY = 1.0 / absScaleY;
        const vertexData = this.vertexData;
        const indexData = this.indexData;
        const prevNumVertices = vertexData.numVertices;
        let correction;

        // The following rectangles are used to figure everything out.
        // The meaning of each is depicted in this sketch: http://i.imgur.com/KUcv71O.jpg

        const gridCenter = Pool.getRectangle();
        const textureBounds = Pool.getRectangle();
        const pixelBounds = Pool.getRectangle();
        const intersection = Pool.getRectangle();

        gridCenter.copyFrom(this._scale9Grid);
        textureBounds.setTo(0, 0, texture.frameWidth, texture.frameHeight);

        if (frame)
            pixelBounds.setTo(-frame.x, -frame.y, texture.width, texture.height);
        else
            pixelBounds.copyFrom(textureBounds);

        // calculate 3x3 grid according to texture and scale9 properties,
        // taking special care about the texture frame (headache included)

        RectangleUtil.intersect(gridCenter, pixelBounds, intersection);

        sBasCols[0] = sBasCols[2] = 0;
        sBasRows[0] = sBasRows[2] = 0;
        sBasCols[1] = intersection.width;
        sBasRows[1] = intersection.height;

        if (pixelBounds.x < gridCenter.x)
            sBasCols[0] = gridCenter.x - pixelBounds.x;

        if (pixelBounds.y < gridCenter.y)
            sBasRows[0] = gridCenter.y - pixelBounds.y;

        if (pixelBounds.right > gridCenter.right)
            sBasCols[2] = pixelBounds.right - gridCenter.right;

        if (pixelBounds.bottom > gridCenter.bottom)
            sBasRows[2] = pixelBounds.bottom - gridCenter.bottom;

        // set vertex positions

        if (pixelBounds.x < gridCenter.x)
            sPadding.left = pixelBounds.x * invScaleX;
        else
            sPadding.left = gridCenter.x * invScaleX + pixelBounds.x - gridCenter.x;

        if (pixelBounds.right > gridCenter.right)
            sPadding.right = (textureBounds.width - pixelBounds.right) * invScaleX;
        else
            sPadding.right = (textureBounds.width - gridCenter.right) * invScaleX + gridCenter.right - pixelBounds.right;

        if (pixelBounds.y < gridCenter.y)
            sPadding.top = pixelBounds.y * invScaleY;
        else
            sPadding.top = gridCenter.y * invScaleY + pixelBounds.y - gridCenter.y;

        if (pixelBounds.bottom > gridCenter.bottom)
            sPadding.bottom = (textureBounds.height - pixelBounds.bottom) * invScaleY;
        else
            sPadding.bottom = (textureBounds.height - gridCenter.bottom) * invScaleY + gridCenter.bottom - pixelBounds.bottom;

        sPosCols[0] = sBasCols[0] * invScaleX;
        sPosCols[2] = sBasCols[2] * invScaleX;
        sPosCols[1] = textureBounds.width - sPadding.left - sPadding.right - sPosCols[0] - sPosCols[2];

        sPosRows[0] = sBasRows[0] * invScaleY;
        sPosRows[2] = sBasRows[2] * invScaleY;
        sPosRows[1] = textureBounds.height - sPadding.top - sPadding.bottom - sPosRows[0] - sPosRows[2];

        // if the total width / height becomes smaller than the outer columns / rows,
        // we hide the center column / row and scale the rest normally.

        if (sPosCols[1] <= 0) {
            correction = textureBounds.width / (textureBounds.width - gridCenter.width) * absScaleX;
            sPadding.left *= correction;
            sPosCols[0] *= correction;
            sPosCols[1] = 0.0;
            sPosCols[2] *= correction;
        }

        if (sPosRows[1] <= 0) {
            correction = textureBounds.height / (textureBounds.height - gridCenter.height) * absScaleY;
            sPadding.top *= correction;
            sPosRows[0] *= correction;
            sPosRows[1] = 0.0;
            sPosRows[2] *= correction;
        }

        // now set the texture coordinates

        sTexCols[0] = sBasCols[0] / pixelBounds.width;
        sTexCols[2] = sBasCols[2] / pixelBounds.width;
        sTexCols[1] = 1.0 - sTexCols[0] - sTexCols[2];

        sTexRows[0] = sBasRows[0] / pixelBounds.height;
        sTexRows[2] = sBasRows[2] / pixelBounds.height;
        sTexRows[1] = 1.0 - sTexRows[0] - sTexRows[2];

        const numVertices = this.setupScale9GridAttributes(sPadding.left, sPadding.top, sPosCols, sPosRows, sTexCols, sTexRows);

        // update indices

        const numQuads = numVertices / 4;
        vertexData.numVertices = numVertices;
        indexData.numIndices = 0;

        for (let i = 0; i < numQuads; ++i)
            indexData.addQuad(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3);

        // if we just switched from a normal to a scale9 image,
        // we need to colorize all vertices just like the first one.

        if (numVertices !== prevNumVertices) {
            const color = prevNumVertices ? vertexData.getColor(0) : 0xffffff;
            const alpha = prevNumVertices ? vertexData.getAlpha(0) : 1.0;
            vertexData.colorize('color', color, alpha);
        }

        Pool.putRectangle(textureBounds);
        Pool.putRectangle(pixelBounds);
        Pool.putRectangle(gridCenter);
        Pool.putRectangle(intersection);

        this.setRequiresRedraw();
    }

    setupScale9GridAttributes(startX, startY, posCols, posRows, texCols, texRows) {
        const posAttr = 'position';
        const texAttr = 'texCoords';

        let row, col;
        let colWidthPos, rowHeightPos;
        let colWidthTex, rowHeightTex;
        const vertexData = this.vertexData;
        const texture = this.texture;
        let currentX = startX;
        let currentY = startY;
        let currentU = 0.0;
        let currentV = 0.0;
        let vertexID = 0;

        for (row = 0; row < 3; ++row) {
            rowHeightPos = posRows[row];
            rowHeightTex = texRows[row];

            if (rowHeightPos > 0) {
                for (col = 0; col < 3; ++col) {
                    colWidthPos = posCols[col];
                    colWidthTex = texCols[col];

                    if (colWidthPos > 0) {
                        vertexData.setPoint(vertexID, posAttr, currentX, currentY);
                        texture.setTexCoords(vertexData, vertexID, texAttr, currentU, currentV);
                        vertexID++;

                        vertexData.setPoint(vertexID, posAttr, currentX + colWidthPos, currentY);
                        texture.setTexCoords(vertexData, vertexID, texAttr, currentU + colWidthTex, currentV);
                        vertexID++;

                        vertexData.setPoint(vertexID, posAttr, currentX, currentY + rowHeightPos);
                        texture.setTexCoords(vertexData, vertexID, texAttr, currentU, currentV + rowHeightTex);
                        vertexID++;

                        vertexData.setPoint(vertexID, posAttr, currentX + colWidthPos, currentY + rowHeightPos);
                        texture.setTexCoords(vertexData, vertexID, texAttr, currentU + colWidthTex, currentV + rowHeightTex);
                        vertexID++;

                        currentX += colWidthPos;
                    }

                    currentU += colWidthTex;
                }

                currentY += rowHeightPos;
            }

            currentX = startX;
            currentU = 0.0;
            currentV += rowHeightTex;
        }

        return vertexID;
    }

    setupTileGrid() {
        const { scaleX, scaleY } = this;
        // calculate the grid of vertices simulating a repeating / tiled texture.
        // again, texture frames make this somewhat more complicated than one would think.

        const texture = this.texture;
        const frame = texture.frame;
        const vertexData = this.vertexData;
        const indexData = this.indexData;
        const bounds = this.getBounds(this, Image.sBounds);
        const prevNumVertices = vertexData.numVertices;
        const color = prevNumVertices ? vertexData.getColor(0) : 0xffffff;
        const alpha = prevNumVertices ? vertexData.getAlpha(0) : 1.0;
        const invScaleX = scaleX > 0 ? 1.0 / scaleX : -1.0 / scaleX;
        const invScaleY = scaleY > 0 ? 1.0 / scaleY : -1.0 / scaleY;
        let frameWidth = this._tileGrid.width > 0 ? this._tileGrid.width : texture.frameWidth;
        let frameHeight = this._tileGrid.height > 0 ? this._tileGrid.height : texture.frameHeight;

        frameWidth *= invScaleX;
        frameHeight *= invScaleY;

        const tileX = frame ? -frame.x * (frameWidth / frame.width) : 0;
        const tileY = frame ? -frame.y * (frameHeight / frame.height) : 0;
        const tileWidth = texture.width * (frameWidth / texture.frameWidth);
        const tileHeight = texture.height * (frameHeight / texture.frameHeight);
        let modX = (this._tileGrid.x * invScaleX) % frameWidth;
        let modY = (this._tileGrid.y * invScaleY) % frameHeight;

        if (modX < 0) modX += frameWidth;
        if (modY < 0) modY += frameHeight;

        let startX = modX + tileX;
        let startY = modY + tileY;

        if (startX > (frameWidth - tileWidth)) startX -= frameWidth;
        if (startY > (frameHeight - tileHeight)) startY -= frameHeight;

        let posLeft, posRight, posTop, posBottom;
        let texLeft, texRight, texTop, texBottom;
        const posAttrName = 'position';
        const texAttrName = 'texCoords';
        let currentX;
        let currentY = startY;
        let vertexID = 0;

        indexData.numIndices = 0;

        while (currentY < bounds.height) {
            currentX = startX;

            while (currentX < bounds.width) {
                indexData.addQuad(vertexID, vertexID + 1, vertexID + 2, vertexID + 3);

                posLeft = currentX < 0 ? 0 : currentX;
                posTop = currentY < 0 ? 0 : currentY;
                posRight = currentX + tileWidth > bounds.width ? bounds.width : currentX + tileWidth;
                posBottom = currentY + tileHeight > bounds.height ? bounds.height : currentY + tileHeight;

                vertexData.setPoint(vertexID, posAttrName, posLeft, posTop);
                vertexData.setPoint(vertexID + 1, posAttrName, posRight, posTop);
                vertexData.setPoint(vertexID + 2, posAttrName, posLeft, posBottom);
                vertexData.setPoint(vertexID + 3, posAttrName, posRight, posBottom);

                texLeft = (posLeft - currentX) / tileWidth;
                texTop = (posTop - currentY) / tileHeight;
                texRight = (posRight - currentX) / tileWidth;
                texBottom = (posBottom - currentY) / tileHeight;

                texture.setTexCoords(vertexData, vertexID, texAttrName, texLeft, texTop);
                texture.setTexCoords(vertexData, vertexID + 1, texAttrName, texRight, texTop);
                texture.setTexCoords(vertexData, vertexID + 2, texAttrName, texLeft, texBottom);
                texture.setTexCoords(vertexData, vertexID + 3, texAttrName, texRight, texBottom);

                currentX += frameWidth;
                vertexID += 4;
            }

            currentY += frameHeight;
        }

        // trim to actual size
        vertexData.numVertices = vertexID;

        for (let i = prevNumVertices; i < vertexID; ++i) {
            vertexData.setColor(i, 'color', color);
            vertexData.setAlpha(i, 'color', alpha);
        }

        this.setRequiresRedraw();
    }

    // bindings

    /** Injects code that is called by all instances whenever the given texture is assigned or replaced.
     *
     *  @param texture    Assignment of this texture instance will lead to the following callback(s) being executed.
     *  @param onAssign   Called when the texture is assigned. Receives one parameter of type 'Image'.
     *  @param onRelease  Called when the texture is replaced. Receives one parameter of type 'Image'. (Optional.)
     */
    static automateSetupForTexture(texture, onAssign, onRelease = null) {
        if (!texture)
            return;
        else if (!onAssign && !onRelease)
            Image.sSetupFunctions.delete(texture);
        else {
            Image.sSetupFunctions.set(texture, [onAssign, onRelease]);
        }
    }

    /** Removes any custom setup functions for the given texture. */
    static resetSetupForTexture(texture) {
        Image.automateSetupForTexture(texture, null, null);
    }

    /** Binds the given scaling grid to the given texture so that any image which displays the texture will
     *  automatically use the grid. */
    static bindScale9GridToTexture(texture, scale9Grid) {
        Image.automateSetupForTexture(texture,
            image => {
                image.scale9Grid = scale9Grid;
            },
            image => {
                image.scale9Grid = null;
            }
        );
    }

    /** Binds the given pivot point to the given texture so that any image which displays the texture will
     *  automatically use the pivot point. */
    static bindPivotPointToTexture(texture, pivotX, pivotY) {
        Image.automateSetupForTexture(texture,
            image => {
                image.pivotX = pivotX;
                image.pivotY = pivotY;
            },
            image => {
                image.pivotX = image.pivotY = 0;
            }
        );
    }
}
