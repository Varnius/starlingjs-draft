import Image from './image';

/** A MovieClip is a simple way to display an animation depicted by a list of textures.
 *
 *  <p>Pass the frames of the movie in a vector of textures to the constructor. The movie clip
 *  will have the width and height of the first frame. If you group your frames with the help
 *  of a texture atlas (which is recommended), use the <code>getTextures</code>-method of the
 *  atlas to receive the textures in the correct (alphabetic) order.</p>
 *
 *  <p>You can specify the desired framerate via the constructor. You can, however, manually
 *  give each frame a custom duration. You can also play a sound whenever a certain frame
 *  appears, or execute a callback (a 'frame action').</p>
 *
 *  <p>The methods <code>play</code> and <code>pause</code> control playback of the movie. You
 *  will receive an event of type <code>Event.COMPLETE</code> when the movie finished
 *  playback. If the movie is looping, the event is dispatched once per loop.</p>
 *
 *  <p>As any animated object, a movie clip has to be added to a juggler (or have its
 *  <code>advanceTime</code> method called regularly) to run. The movie will dispatch
 *  an event of type 'Event.COMPLETE' whenever it has displayed its last frame.</p>
 *
 *  @see starling.textures.TextureAtlas
 */
export default class MovieClip extends Image {
    _frames;
    _defaultFrameDuration;
    _currentTime;
    _currentFrameID;
    _loop;
    _playing;
    _muted;
    _wasStopped;
    _soundTransform;

    /** Creates a movie clip from the provided textures and with the specified default framerate.
     *  The movie will have the size of the first frame. */
    constructor(textures, fps = 12) {
        if (textures.length > 0) {
            super(textures[0]);
            this.init(textures, fps);
        } else {
            throw new Error('[ArgumentError] Empty texture array');
        }
    }

    init(textures, fps) {
        if (fps <= 0) throw new Error('[ArgumentError] Invalid fps: ' + fps);
        const numFrames = textures.length;

        this._defaultFrameDuration = 1.0 / fps;
        this._loop = true;
        this._playing = true;
        this._currentTime = 0.0;
        this._currentFrameID = 0;
        this._wasStopped = true;
        this._frames = [];

        for (let i = 0; i < numFrames; ++i)
            this._frames[i] = new MovieClipFrame(textures[i], this._defaultFrameDuration, this._defaultFrameDuration * i);
    }

    // frame manipulation

    /** Adds an additional frame, optionally with a sound and a custom duration. If the
     *  duration is omitted, the default framerate is used (as specified in the constructor). */
    addFrame(texture, sound = null, duration = -1) {
        this.addFrameAt(this.numFrames, texture, sound, duration);
    }

    /** Adds a frame at a certain index, optionally with a sound and a custom duration. */
    addFrameAt(frameID, texture, sound = null, duration = -1) {
        if (frameID < 0 || frameID > this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        if (duration < 0) duration = this._defaultFrameDuration;

        const { _frames } = this;

        const frame = new MovieClipFrame(texture, duration);
        frame.sound = sound;
        _frames.insertAt(frameID, frame);

        if (frameID === this.numFrames) {
            const prevStartTime = frameID > 0 ? _frames[frameID - 1].startTime : 0.0;
            const prevDuration = frameID > 0 ? _frames[frameID - 1].duration : 0.0;
            frame.startTime = prevStartTime + prevDuration;
        } else
            this.updateStartTimes();
    }

    /** Removes the frame at a certain ID. The successors will move down. */
    removeFrameAt(frameID) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        if (this.numFrames === 1) throw new Error('[IllegalOperationError] Movie clip must not be empty');

        this._frames.removeAt(frameID);

        if (frameID !== this.numFrames)
            this.updateStartTimes();
    }

    /** Returns the texture of a certain frame. */
    getFrameTexture(frameID) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        return this._frames[frameID].texture;
    }

    /** Sets the texture of a certain frame. */
    setFrameTexture(frameID, texture) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        this._frames[frameID].texture = texture;
    }

    /** Returns the sound of a certain frame. */
    getFrameSound(frameID) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        return this._frames[frameID].sound;
    }

    /** Sets the sound of a certain frame. The sound will be played whenever the frame
     *  is displayed. */
    setFrameSound(frameID, sound) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        this._frames[frameID].sound = sound;
    }

    /** Returns the method that is executed at a certain frame. */
    getFrameAction(frameID) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        return this._frames[frameID].action;
    }

    /** Sets an action that will be executed whenever a certain frame is reached. */
    setFrameAction(frameID, action) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        this._frames[frameID].action = action;
    }

    /** Returns the duration of a certain frame (in seconds). */
    getFrameDuration(frameID) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        return this._frames[frameID].duration;
    }

    /** Sets the duration of a certain frame (in seconds). */
    setFrameDuration(frameID, duration) {
        if (frameID < 0 || frameID >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        this._frames[frameID].duration = duration;
        this.updateStartTimes();
    }

    /** Reverses the order of all frames, making the clip run from end to start.
     *  Makes sure that the currently visible frame stays the same. */
    reverseFrames() {
        this._frames.reverse();
        this._currentTime = this.totalTime - this._currentTime;
        this._currentFrameID = this.numFrames - this._currentFrameID - 1;
        this.updateStartTimes();
    }

    // playback methods

    /** Starts playback. Beware that the clip has to be added to a juggler, too! */
    play() {
        this._playing = true;
    }

    /** Pauses playback. */
    pause() {
        this._playing = false;
    }

    /** Stops playback, resetting 'currentFrame' to zero. */
    stop() {
        this._playing = false;
        this._wasStopped = true;
        this.currentFrame = 0;
    }

    // helpers

    updateStartTimes() {
        const numFrames = this.numFrames;
        let prevFrame = this._frames[0];
        prevFrame.startTime = 0;

        for (let i = 1; i < numFrames; ++i) {
            this._frames[i].startTime = prevFrame.startTime + prevFrame.duration;
            prevFrame = this._frames[i];
        }
    }

    // IAnimatable

    /** @inheritDoc */
    advanceTime(passedTime) {
        if (!this._playing) return;

        const { _frames, _loop } = this;

        // The tricky part in this method is that whenever a callback is executed
        // (a frame action or a 'COMPLETE' event handler), that callback might modify the clip.
        // Thus, we have to start over with the remaining time whenever that happens.

        let frame = _frames[this._currentFrameID];

        if (this._wasStopped) {
            // if the clip was stopped and started again,
            // sound and action of this frame need to be repeated.

            this._wasStopped = false;
            frame.playSound(this._soundTransform);

            if (frame.action) {
                frame.executeAction(this, this._currentFrameID);
                this.advanceTime(passedTime);
                return;
            }
        }

        if (this._currentTime === this.totalTime) {
            if (this._loop) {
                this._currentTime = 0.0;
                this._currentFrameID = 0;
                frame = _frames[0];
                frame.playSound(this._soundTransform);
                this.texture = frame.texture;

                if (frame.action) {
                    frame.executeAction(this, this._currentFrameID);
                    this.advanceTime(passedTime);
                    return;
                }
            } else return;
        }

        const finalFrameID = _frames.length - 1;
        let restTimeInFrame = frame.duration - this._currentTime + frame.startTime;
        let dispatchCompleteEvent = false;
        let frameAction = null;
        const previousFrameID = this._currentFrameID;
        let changedFrame;

        while (passedTime >= restTimeInFrame) {
            changedFrame = false;
            passedTime -= restTimeInFrame;
            this._currentTime = frame.startTime + frame.duration;

            if (this._currentFrameID === finalFrameID) {
                if (this.hasEventListener(Event.COMPLETE)) {
                    dispatchCompleteEvent = true;
                } else if (_loop) {
                    this._currentTime = 0;
                    this._currentFrameID = 0;
                    changedFrame = true;
                } else return;
            } else {
                this._currentFrameID += 1;
                changedFrame = true;
            }

            frame = _frames[this._currentFrameID];
            frameAction = frame.action;

            if (changedFrame)
                frame.playSound(this._soundTransform);

            if (dispatchCompleteEvent) {
                this.texture = frame.texture;
                this.dispatchEventWith(Event.COMPLETE);
                this.advanceTime(passedTime);
                return;
            } else if (frameAction) {
                this.texture = frame.texture;
                this.frame.executeAction(this, this._currentFrameID);
                this.advanceTime(passedTime);
                return;
            }

            restTimeInFrame = frame.duration;

            // prevent a mean floating point problem (issue #851)
            if (passedTime + 0.0001 > restTimeInFrame && passedTime - 0.0001 < restTimeInFrame)
                passedTime = restTimeInFrame;
        }

        if (previousFrameID !== this._currentFrameID)
            this.texture = _frames[this._currentFrameID].texture;

        this._currentTime += passedTime;
    }

    // properties

    /** The total number of frames. */
    get numFrames() {
        return this._frames.length;
    }

    /** The total duration of the clip in seconds. */
    get totalTime() {
        const lastFrame = this._frames[this._frames.length - 1];
        return lastFrame.startTime + lastFrame.duration;
    }

    /** The time that has passed since the clip was started (each loop starts at zero). */
    get currentTime() {
        return this._currentTime;
    }

    set currentTime(value) {
        if (value < 0 || value > this.totalTime) throw new Error('[ArgumentError] Invalid time: ' + value);

        const { _frames } = this;
        const lastFrameID = _frames.length - 1;
        this._currentTime = value;
        this._currentFrameID = 0;

        while (this._currentFrameID < lastFrameID && _frames[this._currentFrameID + 1].startTime <= value)
            ++this._currentFrameID;

        const frame = _frames[this._currentFrameID];
        this.texture = frame.texture;
    }

    /** Indicates if the clip should loop. @default true */
    get loop() {
        return this._loop;
    }

    set loop(value) {
        this._loop = value;
    }

    /** If enabled, no new sounds will be started during playback. Sounds that are already
     *  playing are not affected. */
    get muted() {
        return this._muted;
    }

    set muted(value) {
        this._muted = value;
    }

    /** The SoundTransform object used for playback of all frame sounds. @default null */
    get soundTransform() {
        return this._soundTransform;
    }

    set soundTransform(value) {
        this._soundTransform = value;
    }

    /** The index of the frame that is currently displayed. */
    get currentFrame() {
        return this._currentFrameID;
    }

    set currentFrame(value) {
        if (value < 0 || value >= this.numFrames) throw new Error('[ArgumentError] Invalid frame id');
        this.currentTime = this._frames[value].startTime;
    }

    /** The default number of frames per second. Individual frames can have different
     *  durations. If you change the fps, the durations of all frames will be scaled
     *  relatively to the previous value. */
    get fps() {
        return 1.0 / this._defaultFrameDuration;
    }

    set fps(value) {
        if (value <= 0) throw new Error('[ArgumentError] Invalid fps: ' + value);

        const { _frames } = this;

        const newFrameDuration = 1.0 / value;
        const acceleration = newFrameDuration / this._defaultFrameDuration;
        this._currentTime *= acceleration;
        this._defaultFrameDuration = newFrameDuration;

        for (let i = 0; i < this.numFrames; ++i)
            _frames[i].duration *= acceleration;

        this.updateStartTimes();
    }

    /** Indicates if the clip is still playing. Returns <code>false</code> when the end
     *  is reached. */
    get isPlaying() {
        if (this._playing)
            return this._loop || this._currentTime < this.totalTime;
        else
            return false;
    }

    /** Indicates if a (non-looping) movie has come to its end. */
    get isComplete() {
        return !this._loop && this._currentTime >= this.totalTime;
    }
}

class MovieClipFrame {
    constructor(texture, duration = 0.1, startTime = 0) {
        this.texture = texture;
        this.duration = duration;
        this.startTime = startTime;
    }

    texture;
    sound;
    duration;
    startTime;
    action;

    playSound(transform) {
        if (this.sound) this.sound.play(0, 0, transform);
    }

    executeAction(movie, frameID) {
        if (this.action) {
            const numArgs = this.action.length;

            if (numArgs === 0) this.action();
            else if (numArgs === 1) this.action(movie);
            else if (numArgs === 2) this.action(movie, frameID);
            else throw new Error('Frame actions support zero, one or two parameters: movie:MovieClip, frameID');
        }
    }
}
