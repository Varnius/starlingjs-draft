import Button from '../../src/display/button';
import Rectangle from '../../src/math/rectangle';

import MockTexture from '../test-utils/mock-texture';

describe('Button', () => {

    const E = 0.0001;
    
    it('should parse JSON', () => {
        const texture = new MockTexture(100, 50);
        const button = new Button(texture, 'test');
        const textBounds = new Rectangle();

        expect(button.width).to.be.closeTo(100, E);
        expect(button.height).to.be.closeTo(50, E);
        expect(button.scaleX).to.be.closeTo(1.0, E);
        expect(button.scaleY).to.be.closeTo(1.0, E);

        button.scale = 0.5;
        textBounds.copyFrom(button.textBounds);

        expect(button.width).to.be.closeTo(50, E);
        expect(button.height).to.be.closeTo(25, E);
        expect(button.scaleX).to.be.closeTo(0.5, E);
        expect(button.scaleY).to.be.closeTo(0.5, E);
        expect(textBounds.width).to.be.closeTo(100, E);
        expect(textBounds.height).to.be.closeTo(50, E);

        button.width = 100;
        button.height = 50;
        textBounds.copyFrom(button.textBounds);

        expect(button.width).to.be.closeTo(100, E);
        expect(button.height).to.be.closeTo(50, E);
        expect(button.scaleX).to.be.closeTo(0.5, E);
        expect(button.scaleY).to.be.closeTo(0.5, E);
        expect(textBounds.width).to.be.closeTo(200, E);
        expect(textBounds.height).to.be.closeTo(100, E);
    });
});
