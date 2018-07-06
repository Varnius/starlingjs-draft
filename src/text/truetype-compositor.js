import { times } from 'ramda';

import Quad from '../display/quad';
import Align from '../utils/align';
import { createTextureFromData } from '../utils/texture-creators';
import { toCssRgbString } from '../utils/color';

/** This text compositor uses a Flash TextField to render system- or embedded fonts into
 *  a texture.
 *
 *  <p>You typically don't have to instantiate this class. It will be used internally by
 *  Starling's text fields.</p>
 */
export default class TrueTypeCompositor {

    static sHelperQuad;
    static sLines = [];

    constructor() {
        if (!TrueTypeCompositor.sHelperQuad) TrueTypeCompositor.sHelperQuad = new Quad(100, 100);
    }

    /** @inheritDoc */
    fillMeshBatch(meshBatch, width, height, text, format, options = null) {
        if (!text || text === '') return;

        const { sHelperQuad } = TrueTypeCompositor;
        const texture = this.renderText(width, height, text, format, options);

        sHelperQuad.texture = texture;
        sHelperQuad.readjustSize();

        if (format.horizontalAlign === Align.LEFT) sHelperQuad.x = 0;
        else if (format.horizontalAlign === Align.CENTER) sHelperQuad.x = Math.floor((width - texture.width) / 2);
        else sHelperQuad.x = width - texture.width;

        if (format.verticalAlign === Align.TOP) sHelperQuad.y = 0;
        else if (format.verticalAlign === Align.CENTER) sHelperQuad.y = Math.floor((height - texture.height) / 2);
        else sHelperQuad.y = height - texture.height;

        meshBatch.addMesh(sHelperQuad);

        sHelperQuad.texture = null;
    }

    /** @inheritDoc */
    clearMeshBatch(meshBatch) {
        meshBatch.clear();
        if (meshBatch.texture) {
            meshBatch.texture.dispose();
            meshBatch.texture = null;
        }
    }

    /** @private */
    getDefaultMeshStyle() {
        return null;
    }

    countOccurences(string, query) {
        let count = 0;
        let pos = string.indexOf(query);

        while (pos !== -1) {
            count++;
            pos = string.indexOf(query, pos + 1);
        }

        return count;
    }

    composeLines(text, width, format, padding, result = []) {
        const ctx = window.StarlingContextManager.current.textContext;
        const textParts = text.split(/(\s+)/);

        result.push('');

        for (const part of textParts) {
            const currentLine = result[result.length - 1];
            const { width: measuredWidth } = ctx.measureText(currentLine + part);

            if (measuredWidth > (width - padding * 2)) {
                if (currentLine === '') {
                    result[result.length - 1] += part;
                } else {
                    result.push(part);
                }
            } else if (part.includes('\n')) {
                times(() => result.push(''), this.countOccurences(part, '\n'));
            } else {
                result[result.length - 1] += part;
            }
        }

        return result;
    }

    renderText(width, height, text, format, options) {
        const { sLines } = TrueTypeCompositor;
        const { font, size, italic, color, horizontalAlign, verticalAlign } = format;
        const ctx = window.StarlingContextManager.current.textContext;
        const scale = options.textureScale;
        const padding = options.padding * scale;
        const textureWidth = width * scale;
        const textureHeight = height * scale;

        const textRenderScale = 2;
        ctx.setTransform(textRenderScale, 0, 0, textRenderScale, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = toCssRgbString(color);
        ctx.font = `${size}px ${font} ${italic ? 'italic' : ''}`;

        this.composeLines(text, width, format, padding, sLines);

        let textY = 0; // Align.TOP
        const measuredHeight = size * sLines.length;
        const lineHeight = size;

        if (verticalAlign === Align.CENTER) {
            textY = height / 2 - measuredHeight / 2;
        } else if (verticalAlign === Align.BOTTOM) {
            textY = height - measuredHeight - padding;
        }

        for (let i = 0; i < sLines.length; ++i) {
            const line = sLines[i];
            const { width: measuredWidth } = ctx.measureText(line);

            let textX = padding;

            if (horizontalAlign === Align.CENTER) {
                textX = width / 2 - measuredWidth / 2;
            } else if (horizontalAlign === Align.RIGHT) {
                textX = width - measuredWidth - padding;
            }

            // (0, 0) is bottom left corner of the text, compensate for it
            // Also, add additional -2px offset
            // Finally, add line offset
            const offsetY = lineHeight - 2 + lineHeight * i;
            ctx.fillText(line, Math.round(textX), Math.round(textY + offsetY));
        }

        console.log(textureWidth, textureHeight)

        const texture = createTextureFromData({
            data: window.StarlingContextManager.current.textCanvas,
            width: textureWidth,
            height: textureHeight,
            scale: textRenderScale,
        });

        ctx.clearRect(0, 0, window.StarlingContextManager.current.textCanvas.width, window.StarlingContextManager.current.textCanvas.height);
        sLines.splice(0);

        return texture;
    }
}
