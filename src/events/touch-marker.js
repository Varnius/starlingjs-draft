import Quad from '../display/quad';
import Point from '../math/point';
import Sprite from '../display/sprite';

/** The TouchMarker is used internally to mark touches created through "simulateMultitouch". */
export default class TouchMarker extends Sprite {
    _center;
    //_texture;

    constructor()
    {
        super();

        this._center = new Point();
        //this._texture = this.createTexture();

        for (let i = 0; i < 2; ++i)
        {
            const marker = new Quad(15, 15);
            marker.pivotX = marker.width / 2;
            marker.pivotY = marker.height / 2;
            marker.touchable = false;
            this.addChild(marker);
        }
    }

    //dispose()
    //{
    //    this._texture.dispose();
    //    super.dispose();
    //}

    moveMarker(x, y, withCenter = false)
    {
        const { _center, realMarker, mockMarker } = this;

        if (withCenter)
        {
            _center.x += x - realMarker.x;
            _center.y += y - realMarker.y;
        }

        realMarker.x = x;
        realMarker.y = y;
        mockMarker.x = 2 * _center.x - x;
        mockMarker.y = 2 * _center.y - y;
    }

    moveCenter(x, y)
    {
        this._center.x = x;
        this._center.y = y;
        this.moveMarker(this.realX, this.realY); // reset mock position
    }

    //createTexture()
    //{
        //var scale = Starling.contentScaleFactor;
        //var radius = 12 * scale;
        //var width = 32 * scale;
        //var height = 32 * scale;
        //var thickness = 1.5 * scale;
        //var shape = new Shape();
        //
        //// draw dark outline
        //shape.graphics.lineStyle(thickness, 0x0, 0.3);
        //shape.graphics.drawCircle(width / 2, height / 2, radius + thickness);
        //
        //// draw white inner circle
        //shape.graphics.beginFill(0xffffff, 0.4);
        //shape.graphics.lineStyle(thickness, 0xffffff);
        //shape.graphics.drawCircle(width / 2, height / 2, radius);
        //shape.graphics.endFill();
        //
        //const bmpData = new BitmapData(width, height, true, 0x0);
        //bmpData.draw(shape);
    //
    //    return Texture.fromBitmapData(bmpData, false, false, scale);
    //}

    get realMarker()
    {
        return this.getChildAt(0);
    }

    get mockMarker()
    {
        return this.getChildAt(1);
    }

    get realX()
    {
        return this.realMarker.x;
    }

    get realY()
    {
        return this.realMarker.y;
    }

    get mockX()
    {
        return this.mockMarker.x;
    }

    get mockY()
    {
        return this.mockMarker.y;
    }
}
