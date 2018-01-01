import MovieClip from '../../src/display/movie-clip';
import Event from '../../src/events/event';

import MockTexture from '../test-utils/mock-texture';

describe('MovieClip', () => {
    const E = 0.0001;

    const createFrames = count => {
        const frames = [];

        for (let i = 0; i < count; ++i) {
            frames.push(new MockTexture());
        }

        return frames;
    };

    it('should manipulate frames', () => {
        const fps = 4.0;
        const frameDuration = 1.0 / fps;

        const texture0 = new MockTexture();
        const texture1 = new MockTexture();
        const texture2 = new MockTexture();
        const texture3 = new MockTexture();

        const movie = new MovieClip([texture0], fps);

        expect(movie.width).to.be.closeTo(texture0.width, E);
        expect(movie.height).to.be.closeTo(texture0.height, E);
        expect(movie.totalTime).to.be.closeTo(frameDuration, E);
        expect(movie.numFrames).to.equal(1);
        expect(movie.currentFrame).to.equal(0);

        movie.loop = true;
        expect(movie.loop).to.be.true;

        movie.play();
        expect(movie.isPlaying).to.be.true;

        movie.addFrame(texture1);
        expect(movie.numFrames).to.equal(2);
        expect(movie.getFrameTexture(0)).to.equal(texture0);
        expect(movie.getFrameTexture(1)).to.equal(texture1);
        expect(movie.getFrameSound(0)).to.be.null;
        expect(movie.getFrameSound(1)).to.be.null;
        expect(movie.getFrameDuration(0)).to.be.closeTo(frameDuration, E);
        expect(movie.getFrameDuration(1)).to.be.closeTo(frameDuration, E);

        movie.addFrame(texture2, null, 0.5);
        expect(movie.getFrameDuration(2)).to.be.closeTo(0.5, E);
        expect(movie.totalTime).to.be.closeTo(1.0, E);

        movie.addFrameAt(2, texture3); // -> 0, 1, 3, 2
        expect(movie.numFrames).to.equal(4);
        expect(movie.getFrameTexture(1)).to.equal(texture1);
        expect(movie.getFrameTexture(2)).to.equal(texture3);
        expect(movie.getFrameTexture(3)).to.equal(texture2);
        expect(movie.totalTime).to.be.closeTo(1.0 + frameDuration, E);

        movie.removeFrameAt(0); // -> 1, 3, 2
        expect(movie.numFrames).to.equal(3);
        expect(movie.getFrameTexture(0)).to.equal(texture1);
        expect(movie.totalTime).to.be.closeTo(1.0, E);

        movie.removeFrameAt(1); // -> 1, 2
        expect(movie.numFrames).to.equal(2);
        expect(movie.getFrameTexture(0)).to.equal(texture1);
        expect(movie.getFrameTexture(1)).to.equal(texture2);
        expect(movie.totalTime).to.be.closeTo(0.75, E);

        movie.setFrameTexture(1, texture3);
        expect(movie.getFrameTexture(1)).to.equal(texture3);

        movie.setFrameDuration(1, 0.75);
        expect(movie.totalTime).to.be.closeTo(1.0, E);

        movie.addFrameAt(2, texture3);
        expect(movie.getFrameTexture(2)).to.equal(texture3);
    });

    it('should advance time', () => {
        const fps = 4.0;
        const frameDuration = 1.0 / fps;

        const texture0 = new MockTexture();
        const texture1 = new MockTexture();
        const texture2 = new MockTexture();
        const texture3 = new MockTexture();

        const movie = new MovieClip([texture0], fps);
        movie.addFrame(texture2, null, 0.5);
        movie.addFrame(texture3);
        movie.addFrameAt(0, texture1);
        movie.play();
        movie.loop = true;

        expect(movie.currentFrame).to.equal(0);
        movie.advanceTime(frameDuration / 2.0);
        expect(movie.currentFrame).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(1);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(2);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(2);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(3);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(0);
        expect(movie.isComplete).to.be.false;

        movie.loop = false;
        movie.advanceTime(movie.totalTime + frameDuration);
        expect(movie.currentFrame).to.equal(3);
        expect(movie.isPlaying).to.be.false;
        expect(movie.isComplete).to.be.true;

        movie.currentFrame = 0;
        expect(movie.currentFrame).to.equal(0);
        movie.advanceTime(frameDuration * 1.1);
        expect(movie.currentFrame).to.equal(1);

        movie.stop();
        expect(movie.isPlaying).to.be.false;
        expect(movie.isComplete).to.be.false;
        expect(movie.currentFrame).to.equal(0);
    });

    it('should change fps', () => {
        const frames = createFrames(3);
        const movie = new MovieClip(frames, 4.0);

        expect(movie.fps).to.be.closeTo(4.0, E);

        movie.fps = 3.0;
        expect(movie.fps).to.be.closeTo(3.0, E);
        expect(movie.getFrameDuration(0)).to.be.closeTo(1.0 / 3.0, E);
        expect(movie.getFrameDuration(1)).to.be.closeTo(1.0 / 3.0, E);
        expect(movie.getFrameDuration(2)).to.be.closeTo(1.0 / 3.0, E);

        movie.setFrameDuration(1, 1.0);
        expect(movie.getFrameDuration(1)).to.be.closeTo(1.0, E);

        movie.fps = 6.0;
        expect(movie.getFrameDuration(1)).to.be.closeTo(0.5, E);
        expect(movie.getFrameDuration(0)).to.be.closeTo(1.0 / 6.0, E);
    });

    it('should handle COMPETE event', () => {
        const fps = 4.0;
        const frameDuration = 1.0 / fps;
        let completedCount = 0;

        const frames = createFrames(4);
        const movie = new MovieClip(frames, fps);
        movie.addEventListener(Event.COMPLETE, onMovieCompleted);
        movie.loop = false;
        movie.play();

        expect(movie.isComplete).to.be.false;
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(1);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(2);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(3);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration * 0.5);
        movie.advanceTime(frameDuration * 0.5);
        expect(movie.currentFrame).to.equal(3);
        expect(completedCount).to.equal(1);
        expect(movie.isComplete).to.be.true;
        movie.advanceTime(movie.numFrames * 2 * frameDuration);
        expect(movie.currentFrame).to.equal(3);
        expect(completedCount).to.equal(1);
        expect(movie.isComplete).to.be.true;

        movie.loop = true;
        completedCount = 0;

        expect(movie.isComplete).to.be.false;
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(1);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(2);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(3);
        expect(completedCount).to.equal(0);
        movie.advanceTime(frameDuration);
        expect(movie.currentFrame).to.equal(0);
        expect(completedCount).to.equal(1);
        movie.advanceTime(movie.numFrames * 2 * frameDuration);
        expect(completedCount).to.equal(3);

        function onMovieCompleted() {
            completedCount++;
        }
    });

    it('should change current frame in COMPLETE event', () => {
        const fps = 4.0;
        const frames = createFrames(4);
        const movie = new MovieClip(frames, fps);

        movie.loop = true;
        movie.addEventListener(Event.COMPLETE, onMovieCompleted);
        movie.play();
        movie.advanceTime(1.75);

        expect(movie.isPlaying).to.be.false;
        expect(movie.currentFrame).to.equal(0);

        function onMovieCompleted() {
            movie.pause();
            movie.currentFrame = 0;
        }
    });

    it('should remove all frames', () => {
        const frames = createFrames(2);
        const movie = new MovieClip(frames);

        // it must not be allowed to remove the last frame
        movie.removeFrameAt(0);
        let throwsError = false;

        try {
            movie.removeFrameAt(0);
        } catch (error) {
            throwsError = true;
        }

        expect(throwsError).to.be.true;
    });

    it('should handle last texture with fast playback', () => {
        const fps = 20.0;
        const frames = createFrames(3);
        const movie = new MovieClip(frames, fps);
        movie.addEventListener(Event.COMPLETE, onMovieCompleted);
        movie.play();
        movie.advanceTime(1.0);

        function onMovieCompleted() {
            expect(movie.texture).to.equal(frames[2]);
        }
    });

    it('should handle assigned texture with complete handler', () => {
        // https://github.com/PrimaryFeather/Starling-Framework/issues/232

        const frames = createFrames(2);
        const movie = new MovieClip(frames, 2);
        movie.loop = true;
        movie.play();

        movie.addEventListener(Event.COMPLETE, onComplete);
        expect(movie.texture).to.equal(frames[0]);

        movie.advanceTime(0.5);
        expect(movie.texture).to.equal(frames[1]);

        movie.advanceTime(0.5);
        expect(movie.texture).to.equal(frames[0]);

        movie.advanceTime(0.5);
        expect(movie.texture).to.equal(frames[1]);

        function onComplete() { /* does not have to do anything */
        }
    });

    it('should stop movie in complete handler', () => {
        const frames = createFrames(5);
        const movie = new MovieClip(frames, 5);

        movie.play();
        movie.addEventListener(Event.COMPLETE, onComplete);
        movie.advanceTime(1.3);

        expect(movie.isPlaying).to.be.false;
        expect(movie.currentTime).to.be.closeTo(0.0, E);
        expect(movie.texture).to.equal(frames[0]);

        movie.play();
        movie.advanceTime(0.3);
        expect(movie.currentTime).to.be.closeTo(0.3, E);
        expect(movie.texture).to.equal(frames[1]);

        function onComplete() {
            movie.stop();
        }
    });

    it.only('should reverse frames', () => {
        let i;
        const numFrames = 4;
        const frames = createFrames(numFrames);
        const movie = new MovieClip(frames, 5);
        movie.setFrameDuration(0, 0.4);
        movie.play();

        for (i = 0; i < numFrames; ++i)
            expect(frames[i]).to.equal(movie.getFrameTexture(i));

        movie.advanceTime(0.5);
        movie.reverseFrames();

        for (i = 0; i < numFrames; ++i)
            expect(frames[numFrames - i - 1]).to.equal(movie.getFrameTexture(i));

        expect(2).to.equal(movie.currentFrame);
        expect(movie.currentTime).to.equal(0.5);
        expect(movie.getFrameDuration(0)).to.be.closeTo(0.2, E);
        expect(movie.getFrameDuration(3)).to.be.closeTo(0.4, E);
    });

    it('should set current time', () => {
        let actionCount = 0;
        const numFrames = 4;
        const frames = createFrames(numFrames);
        const movie = new MovieClip(frames, numFrames);
        movie.setFrameAction(1, onAction);
        movie.play();

        movie.currentTime = 0.1;
        expect(movie.currentFrame).to.equal(0);
        expect(movie.currentTime).to.be.closeTo(0.1, E);
        expect(actionCount).to.equal(0);

        movie.currentTime = 0.25;
        expect(movie.currentFrame).to.equal(1);
        expect(movie.currentTime).to.be.closeTo(0.25, E);
        expect(actionCount).to.equal(0);

        // 'advanceTime' should now get that action executed
        movie.advanceTime(0.01);
        expect(actionCount).to.equal(1);
        movie.advanceTime(0.01);
        expect(actionCount).to.equal(1);

        movie.currentTime = 0.3;
        expect(movie.currentFrame).to.equal(1);
        expect(movie.currentTime).to.be.closeTo(0.3, E);

        movie.currentTime = 1.0;
        expect(movie.currentFrame).to.equal(3);
        expect(movie.currentTime).to.be.closeTo(1.0, E);

        function onAction() {
            ++actionCount;
        }
    });

    it('should handle basic frame actions', () => {
        let actionCount = 0;
        let completeCount = 0;

        const numFrames = 4;
        const frames = createFrames(numFrames);
        const movie = new MovieClip(frames, numFrames);
        movie.setFrameAction(1, onFrame);
        movie.setFrameAction(3, onFrame);
        movie.loop = false;
        movie.play();

        // simple test of two actions
        movie.advanceTime(1.0);
        expect(actionCount).to.equal(2);

        // now pause movie in action
        movie.loop = true;
        movie.setFrameAction(2, pauseMovie);
        movie.advanceTime(1.0);
        expect(actionCount).to.equal(3);
        expect(movie.currentTime).to.be.closeTo(0.5, E);
        expect(movie.isPlaying).to.be.false;

        // restarting the clip should execute the action at the current frame
        movie.advanceTime(1.0);
        expect(movie.isPlaying).to.be.false;
        expect(actionCount).to.equal(3);

        // remove that action
        movie.play();
        movie.setFrameAction(2, null);
        movie.currentFrame = 0;
        movie.advanceTime(1.0);
        expect(movie.isPlaying).to.be.true;
        expect(actionCount).to.equal(5);

        // add a COMPLETE event handler as well
        movie.addEventListener(Event.COMPLETE, onComplete);
        movie.advanceTime(1.0);
        expect(actionCount).to.equal(7);
        expect(completeCount).to.equal(1);

        // frame action should be executed before COMPLETE action, so we can pause the movie
        movie.setFrameAction(3, pauseMovie);
        movie.advanceTime(1.0);
        expect(actionCount).to.equal(8);
        expect(movie.isPlaying).to.be.false;
        expect(completeCount).to.equal(1);

        // adding a frame action while we're in the first frame and then moving on -> no action
        movie.currentFrame = 0;
        expect(movie.currentFrame).to.equal(0);
        movie.setFrameAction(0, onFrame);
        movie.play();
        movie.advanceTime(0.1);
        expect(actionCount).to.equal(8);
        movie.advanceTime(0.1);
        expect(actionCount).to.equal(8);

        // but after stopping the clip, the action should be executed
        movie.stop();
        movie.play();
        movie.advanceTime(0.1);
        expect(actionCount).to.equal(9);
        movie.advanceTime(0.1);
        expect(actionCount).to.equal(9);

        function onFrame(movieParam, frameID) {
            actionCount++;
            expect(movieParam).to.equal(movie);
            expect(movie.currentFrame).to.equal(frameID);
            expect(movie.currentTime).to.be.closeTo(frameID / numFrames, E);
        }

        function pauseMovie() {
            movie.pause();
        }

        function onComplete() {
            expect(movie.currentTime).to.be.closeTo(movie.totalTime, E);
            completeCount++;
        }
    });

    it('should handle floating point issue', () => {
        // -> https://github.com/Gamua/Starling-Framework/issues/851

        const numFrames = 30;
        let completeCount = 0;
        const frames = createFrames(numFrames);
        const movie = new MovieClip(frames, numFrames);

        movie.loop = false;
        movie.addEventListener(Event.COMPLETE, onComplete);
        movie.currentTime = 0.9649999999999999;
        movie.advanceTime(0.03500000000000014);

        expect(completeCount).to.equal(1);

        function onComplete() {
            completeCount++;
        }
    });
});
