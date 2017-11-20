import Event from '../../src/events/event';
import EventDispatcher from '../../src/events/event-dispatcher';
import Sprite from '../../src/display/sprite';

describe('Event', () =>
{
    it('should bubble', () =>
    {
        const eventType = 'test';

        const grandParent = new Sprite();
        const parent = new Sprite();
        const child = new Sprite();

        grandParent.addChild(parent);
        parent.addChild(child);

        let grandParentEventHandlerHit = false;
        let parentEventHandlerHit = false;
        let childEventHandlerHit = false;
        let hitCount = 0;

        // bubble up

        grandParent.addEventListener(eventType, onGrandParentEvent);
        parent.addEventListener(eventType, onParentEvent);
        child.addEventListener(eventType, onChildEvent);

        let event = new Event(eventType, true);
        child.dispatchEvent(event);

        expect(grandParentEventHandlerHit).to.be.true;
        expect(parentEventHandlerHit).to.be.true;
        expect(childEventHandlerHit).to.be.true;

        expect(hitCount).to.equal(3);

        // remove event handler

        parentEventHandlerHit = false;
        parent.removeEventListener(eventType, onParentEvent);
        child.dispatchEvent(event);

        expect(parentEventHandlerHit).to.be.false;
        expect(hitCount).to.equal(5);

        // don't bubble

        event = new Event(eventType);

        grandParentEventHandlerHit = parentEventHandlerHit = childEventHandlerHit = false;
        parent.addEventListener(eventType, onParentEvent);
        child.dispatchEvent(event);

        expect(hitCount).to.equal(6);

        expect(childEventHandlerHit).to.be.true;
        expect(parentEventHandlerHit).to.be.false;
        expect(grandParentEventHandlerHit).to.be.false;

        function onGrandParentEvent(e)
        {
            grandParentEventHandlerHit = true;
            expect(child).to.be.equal(e.target);
            expect(grandParent).to.be.equal(e.currentTarget);
            hitCount++;
        }

        function onParentEvent(e)
        {
            parentEventHandlerHit = true;
            expect(child).to.be.equal(e.target);
            expect(parent).to.be.equal(e.currentTarget);
            hitCount++;
        }

        function onChildEvent(e)
        {
            childEventHandlerHit = true;
            expect(child).to.be.equal(e.target);
            expect(child).to.be.equal(e.currentTarget);
            hitCount++;
        }
    });

    it('should stop propagation', () =>
    {
        const eventType = 'test';

        const grandParent = new Sprite();
        const parent = new Sprite();
        const child = new Sprite();

        grandParent.addChild(parent);
        parent.addChild(child);

        let hitCount = 0;

        // stop propagation at parent

        child.addEventListener(eventType, onEvent);
        parent.addEventListener(eventType, onEventStopPropagation);
        parent.addEventListener(eventType, onEvent);
        grandParent.addEventListener(eventType, onEvent);

        child.dispatchEvent(new Event(eventType, true));

        expect(hitCount).to.equal(3);

        // stop immediate propagation at parent

        parent.removeEventListener(eventType, onEventStopPropagation);
        parent.removeEventListener(eventType, onEvent);

        parent.addEventListener(eventType, onEventStopImmediatePropagation);
        parent.addEventListener(eventType, onEvent);

        child.dispatchEvent(new Event(eventType, true));

        expect(hitCount).to.equal(5);

        function onEvent()
        {
            hitCount++;
        }

        function onEventStopPropagation(event)
        {
            event.stopPropagation();
            hitCount++;
        }

        function onEventStopImmediatePropagation(event)
        {
            event.stopImmediatePropagation();
            hitCount++;
        }
    });

    it('should allow to remove event listeners', () =>
    {
        let hitCount = 0;
        const dispatcher = new EventDispatcher();

        dispatcher.addEventListener('Type1', onEvent);
        dispatcher.addEventListener('Type2', onEvent);
        dispatcher.addEventListener('Type3', onEvent);

        hitCount = 0;
        dispatcher.dispatchEvent(new Event('Type1'));
        expect(hitCount).to.equal(1);

        dispatcher.dispatchEvent(new Event('Type2'));
        expect(hitCount).to.equal(2);

        dispatcher.dispatchEvent(new Event('Type3'));
        expect(hitCount).to.equal(3);

        hitCount = 0;
        dispatcher.removeEventListener('Type1', onEvent);
        dispatcher.dispatchEvent(new Event('Type1'));
        expect(hitCount).to.equal(0);

        dispatcher.dispatchEvent(new Event('Type3'));
        expect(hitCount).to.equal(1);

        hitCount = 0;
        dispatcher.removeEventListeners();
        dispatcher.dispatchEvent(new Event('Type1'));
        dispatcher.dispatchEvent(new Event('Type2'));
        dispatcher.dispatchEvent(new Event('Type3'));
        expect(hitCount).to.equal(0);

        function onEvent()
        {
            ++hitCount;
        }
    });

    it('should handle blank event dispatcher', () =>
    {
        const dispatcher = new EventDispatcher();

        expect(() => dispatcher.removeEventListener('Test', null)).to.not.throw();
        expect(() => dispatcher.removeEventListeners('Test')).to.not.throw();
    });

    it('should handle duplicate event handler', () =>
    {
        const dispatcher = new EventDispatcher();
        let callCount = 0;

        dispatcher.addEventListener('test', onEvent);
        dispatcher.addEventListener('test', onEvent);

        dispatcher.dispatchEvent(new Event('test'));
        expect(callCount).to.equal(1);

        function onEvent()
        {
            callCount++;
        }
    });

    it('should bubble with modified chain', () =>
    {
        const eventType = 'test';

        const grandParent = new Sprite();
        const parent = new Sprite();
        const child = new Sprite();

        grandParent.addChild(parent);
        parent.addChild(child);

        let hitCount = 0;

        // listener on 'child' changes display list; bubbling must not be affected.

        grandParent.addEventListener(eventType, onEvent);
        parent.addEventListener(eventType, onEvent);
        child.addEventListener(eventType, onEvent);
        child.addEventListener(eventType, onEventRemoveFromParent);

        child.dispatchEvent(new Event(eventType, true));

        expect(parent.parent).to.be.null;
        expect(hitCount).to.equal(3);

        function onEvent()
        {
            hitCount++;
        }

        function onEventRemoveFromParent()
        {
            parent.removeFromParent();
        }
    });

    it('should redispatch', () =>
    {
        const eventType = 'test';

        const grandParent = new Sprite();
        const parent = new Sprite();
        const child = new Sprite();

        grandParent.addChild(parent);
        parent.addChild(child);

        grandParent.addEventListener(eventType, onEvent);
        parent.addEventListener(eventType, onEvent);
        child.addEventListener(eventType, onEvent);
        parent.addEventListener(eventType, onEventRedispatch);

        const targets = [];
        const currentTargets = [];

        child.dispatchEventWith(eventType, true);

        // main bubble
        expect(child).to.equal(targets[0]);
        expect(child).to.equal(currentTargets[0]);

        // main bubble
        expect(child).to.equal(targets[1]);
        expect(parent).to.equal(currentTargets[1]);

        // inner bubble
        expect(parent).to.equal(targets[2]);
        expect(parent).to.equal(currentTargets[2]);

        // inner bubble
        expect(parent).to.equal(targets[3]);
        expect(grandParent).to.equal(currentTargets[3]);

        // main bubble
        expect(child).to.equal(targets[4]);
        expect(grandParent).to.equal(currentTargets[4]);

        function onEvent(event)
        {
            targets.push(event.target);
            currentTargets.push(event.currentTarget);
        }

        function onEventRedispatch(event)
        {
            parent.removeEventListener(eventType, onEventRedispatch);
            parent.dispatchEvent(event);
        }
    });

    it('should allow to check if there is an event listener', () =>
    {
        const eventType = 'event';
        const dispatcher = new EventDispatcher();

        const onEvent = () =>
        {
        };
        const onSomethingElse = () =>
        {
        };

        expect(dispatcher.hasEventListener(eventType)).to.be.false;
        expect(dispatcher.hasEventListener(eventType, onEvent)).to.be.false;

        dispatcher.addEventListener(eventType, onEvent);

        expect(dispatcher.hasEventListener(eventType)).to.be.true;
        expect(dispatcher.hasEventListener(eventType, onEvent)).to.be.true;
        expect(dispatcher.hasEventListener(eventType, onSomethingElse)).to.be.false;

        dispatcher.removeEventListener(eventType, onEvent);

        expect(dispatcher.hasEventListener(eventType)).to.be.false;
        expect(dispatcher.hasEventListener(eventType, onEvent)).to.be.false;
    });
});
