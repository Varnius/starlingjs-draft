import DisplayObject from './display-object';

import Matrix from '../math/matrix';
import Point from '../math/point';
import Rectangle from '../math/rectangle';

import Event from '../events/event';

import BatchToken from '../rendering/batch-token';

import MatrixUtil from '../utils/matrix-util';

/**
 *  A DisplayObjectContainer represents a collection of display objects.
 *  It is the base class of all display objects that act as a container for other objects. By
 *  maintaining an ordered list of children, it defines the back-to-front positioning of the
 *  children within the display tree.
 *
 *  <p>A container does not a have size in itself. The width and height properties represent the
 *  extents of its children. Changing those properties will scale all children accordingly.</p>
 *
 *  <p>As this is an abstract class, you can't instantiate it directly, but have to
 *  use a subclass instead. The most lightweight container class is "Sprite".</p>
 *
 *  <strong>Adding and removing children</strong>
 *
 *  <p>The class defines methods that allow you to add or remove children. When you add a child,
 *  it will be added at the frontmost position, possibly occluding a child that was added
 *  before. You can access the children via an index. The first child will have index 0, the
 *  second child index 1, etc.</p>
 *
 *  Adding and removing objects from a container triggers non-bubbling events.
 *
 *  <ul>
 *   <li><code>Event.ADDED</code>: the object was added to a parent.</li>
 *   <li><code>Event.ADDED_TO_STAGE</code>: the object was added to a parent that is
 *       connected to the stage, thus becoming visible now.</li>
 *   <li><code>Event.REMOVED</code>: the object was removed from a parent.</li>
 *   <li><code>Event.REMOVED_FROM_STAGE</code>: the object was removed from a parent that
 *       is connected to the stage, thus becoming invisible now.</li>
 *  </ul>
 *
 *  Especially the <code>ADDED_TO_STAGE</code> event is very helpful, as it allows you to
 *  automatically execute some logic (e.g. start an animation) when an object is rendered the
 *  first time.
 *
 *  @see Sprite
 *  @see DisplayObject
 */
export default class DisplayObjectContainer extends DisplayObject {
    // members

    _children;
    _touchGroup;

    // helper objects
    static sHelperMatrix = new Matrix();
    static sHelperPoint = new Point();
    static sBroadcastListeners = [];
    static sSortBuffer = [];
    static sCacheToken = new BatchToken();

    // construction

    /** @private */
    constructor() {
        super();
        // todo: handle
        //if (Capabilities.isDebugger &&
        //    getQualifiedClassName(this) === "starling.display:Container")
        //{
        //    throw new AbstractClassError();
        //}

        this._children = [];
    }

    /** Disposes the resources of all children. */
    dispose() {
        for (let i = this._children.length - 1; i >= 0; --i)
            this._children[i].dispose();

        super.dispose();
    }

    // child management

    /** Adds a child to the container. It will be at the frontmost position. */
    addChild(child) {
        return this.addChildAt(child, this._children.length);
    }

    /** Adds a child to the container at a certain index. */
    addChildAt(child, index) {
        const numChildren = this._children.length;

        if (index >= 0 && index <= numChildren) {
            this.setRequiresRedraw();

            if (child.parent === this) {
                this.setChildIndex(child, index); // avoids dispatching events
            } else {
                this._children.splice(index, 0, child);

                child.removeFromParent();
                child.setParent(this);
                child.dispatchEventWith(Event.ADDED, true);

                if (this.stage) {
                    const isContainer = child instanceof DisplayObjectContainer;
                    if (isContainer) child.broadcastEventWith(Event.ADDED_TO_STAGE);
                    else child.dispatchEventWith(Event.ADDED_TO_STAGE);
                }
            }

            return child;
        } else {
            throw new RangeError('Invalid child index');
        }
    }

    /** Removes a child from the container. If the object is not a child, the method returns
     *  <code>null</code>. If requested, the child will be disposed right away. */
    removeChild(child, dispose = false) {
        const childIndex = this.getChildIndex(child);
        if (childIndex !== -1) return this.removeChildAt(childIndex, dispose);
        else return null;
    }

    /** Removes a child at a certain index. The index positions of any display objects above
     *  the child are decreased by 1. If requested, the child will be disposed right away. */
    removeChildAt(index, dispose = false) {
        if (index >= 0 && index < this._children.length) {
            this.setRequiresRedraw();

            const child = this._children[index];
            child.dispatchEventWith(Event.REMOVED, true);

            if (this.stage) {
                const container = child instanceof DisplayObjectContainer;
                if (container) child.broadcastEventWith(Event.REMOVED_FROM_STAGE);
                else child.dispatchEventWith(Event.REMOVED_FROM_STAGE);
            }

            child.setParent(null);
            index = this._children.indexOf(child); // index might have changed by event handler
            if (index >= 0) this._children.splice(index, 1);
            if (dispose) child.dispose();

            return child;
        } else {
            throw new RangeError('Invalid child index');
        }
    }

    /** Removes a range of children from the container (endIndex included).
     *  If no arguments are given, all children will be removed. */
    removeChildren(beginIndex = 0, endIndex = -1, dispose = false) {
        if (endIndex < 0 || endIndex >= this.numChildren)
            endIndex = this.numChildren - 1;

        for (let i = beginIndex; i <= endIndex; ++i)
            this.removeChildAt(beginIndex, dispose);
    }

    /** Returns a child object at a certain index. If you pass a negative index,
     *  '-1' will return the last child, '-2' the second to last child, etc. */
    getChildAt(index) {
        const numChildren = this._children.length;

        if (index < 0)
            index = numChildren + index;

        if (index >= 0 && index < numChildren)
            return this._children[index];
        else
            throw new RangeError('Invalid child index');
    }

    /** Returns a child object with a certain name (non-recursively). */
    getChildByName(name) {
        const numChildren = this._children.length;
        for (let i = 0; i < numChildren; ++i)
            if (this._children[i].name === name) return this._children[i];

        return null;
    }

    /** Returns the index of a child within the container, or "-1" if it is not found. */
    getChildIndex(child) {
        return this._children.indexOf(child);
    }

    /** Moves a child to a certain index. Children at and after the replaced position move up.*/
    setChildIndex(child, index) {
        const oldIndex = this.getChildIndex(child);
        if (oldIndex === index) return;
        if (oldIndex === -1) throw new Error('[ArgumentError] Not a child of this container');

        this._children.splice(oldIndex, 1);
        this._children.splice(index, 0, child);
        this.setRequiresRedraw();
    }

    /** Swaps the indexes of two children. */
    swapChildren(child1, child2) {
        const index1 = this.getChildIndex(child1);
        const index2 = this.getChildIndex(child2);
        if (index1 === -1 || index2 === -1) throw new Error('[ArgumentError] Not a child of this container');
        this.swapChildrenAt(index1, index2);
    }

    /** Swaps the indexes of two children. */
    swapChildrenAt(index1, index2) {
        const child1 = this.getChildAt(index1);
        const child2 = this.getChildAt(index2);
        this._children[index1] = child2;
        this._children[index2] = child1;
        this.setRequiresRedraw();
    }

    /** Sorts the children according to a given function (that works just like the sort function
     *  of the Vector class). */
    sortChildren(compareFunction) {
        DisplayObjectContainer.sSortBuffer.length = this._children.length;
        DisplayObjectContainer.mergeSort(this._children, compareFunction, 0, this._children.length, DisplayObjectContainer.sSortBuffer);
        DisplayObjectContainer.sSortBuffer.length = 0;
        this.setRequiresRedraw();
    }

    /** Determines if a certain object is a child of the container (recursively). */
    contains(child) {
        while (child) {
            if (child === this) return true;
            else child = child.parent;
        }
        return false;
    }

    // other methods

    /** @inheritDoc */
    getBounds(targetSpace, out = null) {
        if (!out) out = new Rectangle();

        const numChildren = this._children.length;

        if (numChildren === 0) {
            this.getTransformationMatrix(targetSpace, DisplayObjectContainer.sHelperMatrix);
            MatrixUtil.transformCoords(DisplayObjectContainer.sHelperMatrix, 0.0, 0.0, DisplayObjectContainer.sHelperPoint);
            out.setTo(DisplayObjectContainer.sHelperPoint.x, DisplayObjectContainer.sHelperPoint.y, 0, 0);
        } else if (numChildren === 1) {
            this._children[0].getBounds(targetSpace, out);
        } else {
            let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

            for (let i = 0; i < numChildren; ++i) {
                this._children[i].getBounds(targetSpace, out);

                if (minX > out.x) minX = out.x;
                if (maxX < out.right) maxX = out.right;
                if (minY > out.y) minY = out.y;
                if (maxY < out.bottom) maxY = out.bottom;
            }

            out.setTo(minX, minY, maxX - minX, maxY - minY);
        }

        return out;
    }

    /** @inheritDoc */
    hitTest(localPoint) {
        if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;

        let target = null;
        const localX = localPoint.x;
        const localY = localPoint.y;
        const numChildren = this._children.length;

        for (let i = numChildren - 1; i >= 0; --i) { // front to back!
            const child = this._children[i];
            if (child.isMask) continue;

            DisplayObjectContainer.sHelperMatrix.copyFrom(child.transformationMatrix);
            DisplayObjectContainer.sHelperMatrix.invert();

            MatrixUtil.transformCoords(DisplayObjectContainer.sHelperMatrix, localX, localY, DisplayObjectContainer.sHelperPoint);
            target = child.hitTest(DisplayObjectContainer.sHelperPoint);

            if (target) return this._touchGroup ? this : target;
        }

        return null;
    }

    /** @inheritDoc */
    render(painter) {
        const numChildren = this._children.length;
        const frameID = painter.frameID;
        const cacheEnabled = frameID !== 0;
        const selfOrParentChanged = this._lastParentOrSelfChangeFrameID === frameID;

        painter.pushState();

        for (let i = 0; i < numChildren; ++i) {
            const child = this._children[i];

            if (child._hasVisibleArea) {
                if (i !== 0)
                    painter.restoreState();

                if (selfOrParentChanged)
                    child._lastParentOrSelfChangeFrameID = frameID;

                if (child._lastParentOrSelfChangeFrameID !== frameID &&
                    child._lastChildChangeFrameID !== frameID &&
                    child._tokenFrameID === frameID - 1 && cacheEnabled) {
                    painter.fillToken(DisplayObjectContainer.sCacheToken);
                    painter.drawFromCache(child._pushToken, child._popToken);
                    painter.fillToken(child._popToken);

                    child._pushToken.copyFrom(DisplayObjectContainer.sCacheToken);
                } else {
                    const pushToken = cacheEnabled ? child._pushToken : null;
                    const popToken = cacheEnabled ? child._popToken : null;
                    const filter = child._filter;
                    const mask = child._mask;

                    painter.fillToken(pushToken);
                    painter.setStateTo(child.transformationMatrix, child.alpha, child.blendMode);

                    if (mask) painter.drawMask(mask, child);

                    if (filter) filter.render(painter);
                    else child.render(painter);

                    if (mask) painter.eraseMask(mask, child);

                    painter.fillToken(popToken);
                }

                if (cacheEnabled)
                    child._tokenFrameID = frameID;
            }
        }

        painter.popState();
    }

    /** Dispatches an event on all children (recursively). The event must not bubble. */
    broadcastEvent(event) {
        if (event.bubbles)
            throw new Error('[ArgumentError] Broadcast of bubbling events is prohibited');

        // The event listeners might modify the display tree, which could make the loop crash.
        // Thus, we collect them in a list and iterate over that list instead.
        // And since another listener could call this method internally, we have to take
        // care that the static helper vector does not get corrupted.

        const fromIndex = DisplayObjectContainer.sBroadcastListeners.length;
        this.getChildEventListeners(this, event.type, DisplayObjectContainer.sBroadcastListeners);
        const toIndex = DisplayObjectContainer.sBroadcastListeners.length;

        for (let i = fromIndex; i < toIndex; ++i)
            DisplayObjectContainer.sBroadcastListeners[i].dispatchEvent(event);

        DisplayObjectContainer.sBroadcastListeners.length = fromIndex;
    }

    /** Dispatches an event with the given parameters on all children (recursively).
     *  The method uses an internal pool of event objects to avoid allocations. */
    broadcastEventWith(eventType, data = null) {
        const event = Event.fromPool(eventType, false, data);
        this.broadcastEvent(event);
        Event.toPool(event);
    }

    /** The number of children of this container. */
    get numChildren() {
        return this._children.length;
    }

    /** If a container is a 'touchGroup', it will act as a single touchable object.
     *  Touch events will have the container as target, not the touched child.
     *  (Similar to 'mouseChildren' in the classic display list, but with inverted logic.)
     *  @default false */
    get touchGroup() {
        return this._touchGroup;
    }

    set touchGroup(value) {
        this._touchGroup = value;
    }

    // helpers

    static mergeSort(input, compareFunc, startIndex, length, buffer) {
        // This is a port of the C++ merge sort algorithm shown here:
        // http://www.cprogramming.com/tutorial/computersciencetheory/mergesort.html

        if (length > 1) {
            let i;
            const endIndex = startIndex + length;
            const halfLength = length / 2;
            let l = startIndex;              // current position in the left subvector
            let r = startIndex + halfLength; // current position in the right subvector

            // sort each subvector
            DisplayObjectContainer.mergeSort(input, compareFunc, startIndex, halfLength, buffer);
            DisplayObjectContainer.mergeSort(input, compareFunc, startIndex + halfLength, length - halfLength, buffer);

            // merge the vectors, using the buffer vector for temporary storage
            for (i = 0; i < length; i++) {
                // Check to see if any elements remain in the left vector;
                // if so, we check if there are any elements left in the right vector;
                // if so, we compare them. Otherwise, we know that the merge must
                // take the element from the left vector. */
                if (l < startIndex + halfLength &&
                    (r === endIndex || compareFunc(input[l], input[r]) <= 0)) {
                    buffer[i] = input[l];
                    l++;
                } else {
                    buffer[i] = input[r];
                    r++;
                }
            }

            // copy the sorted subvector back to the input
            for (i = startIndex; i < endIndex; i++)
                input[i] = buffer[i - startIndex]; // todo: dropped cast to int
        }
    }

    /** @private */
    getChildEventListeners = (object, eventType, listeners) => {
        const isContainer = object instanceof DisplayObjectContainer;

        if (object.hasEventListener(eventType))
            listeners[listeners.length] = object; // avoiding 'push'

        if (isContainer) {
            const children = object._children;
            const numChildren = children.length;

            for (let i = 0; i < numChildren; ++i)
                this.getChildEventListeners(children[i], eventType, listeners);
        }
    }
}
