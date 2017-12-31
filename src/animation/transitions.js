/** The Transitions class contains static methods that define easing functions.
 *  Those functions are used by the Tween class to execute animations.
 *
 *  <p>Here is a visual representation of the available transitions:</p>
 *  <img src="http://gamua.com/img/blog/2010/sparrow-transitions.png"/>
 *
 *  <p>You can define your own transitions through the "registerTransition" function. A
 *  transition function must have the following signature, where <code>ratio</code> is
 *  in the range 0-1:</p>
 *
 *  <pre>function myTransition(ratio)</pre>
 */
export default class Transitions {
    static LINEAR = 'linear';
    static EASE_IN = 'easeIn';
    static EASE_OUT = 'easeOut';
    static EASE_IN_OUT = 'easeInOut';
    static EASE_OUT_IN = 'easeOutIn';
    static EASE_IN_BACK = 'easeInBack';
    static EASE_OUT_BACK = 'easeOutBack';
    static EASE_IN_OUT_BACK = 'easeInOutBack';
    static EASE_OUT_IN_BACK = 'easeOutInBack';
    static EASE_IN_ELASTIC = 'easeInElastic';
    static EASE_OUT_ELASTIC = 'easeOutElastic';
    static EASE_IN_OUT_ELASTIC = 'easeInOutElastic';
    static EASE_OUT_IN_ELASTIC = 'easeOutInElastic';
    static EASE_IN_BOUNCE = 'easeInBounce';
    static EASE_OUT_BOUNCE = 'easeOutBounce';
    static EASE_IN_OUT_BOUNCE = 'easeInOutBounce';
    static EASE_OUT_IN_BOUNCE = 'easeOutInBounce';

    static sTransitions;

    /** @private */
    constructor() {
        throw new Error('[AbstractClassErorr]');
    }

    /** Returns the transition function that was registered under a certain name. */
    static getTransition(name) {
        if (!Transitions.sTransitions) Transitions.registerDefaults();
        return Transitions.sTransitions[name];
    }

    /** Registers a new transition function under a certain name. */
    static register(name, func) {
        if (!Transitions.sTransitions) Transitions.registerDefaults();
        Transitions.sTransitions[name] = func;
    }

    static registerDefaults() {
        Transitions.sTransitions = new Map();

        const { register } = Transitions;

        register(Transitions.LINEAR, Transitions.linear);
        register(Transitions.EASE_IN, Transitions.easeIn);
        register(Transitions.EASE_OUT, Transitions.easeOut);
        register(Transitions.EASE_IN_OUT, Transitions.easeInOut);
        register(Transitions.EASE_OUT_IN, Transitions.easeOutIn);
        register(Transitions.EASE_IN_BACK, Transitions.easeInBack);
        register(Transitions.EASE_OUT_BACK, Transitions.easeOutBack);
        register(Transitions.EASE_IN_OUT_BACK, Transitions.easeInOutBack);
        register(Transitions.EASE_OUT_IN_BACK, Transitions.easeOutInBack);
        register(Transitions.EASE_IN_ELASTIC, Transitions.easeInElastic);
        register(Transitions.EASE_OUT_ELASTIC, Transitions.easeOutElastic);
        register(Transitions.EASE_IN_OUT_ELASTIC, Transitions.easeInOutElastic);
        register(Transitions.EASE_OUT_IN_ELASTIC, Transitions.easeOutInElastic);
        register(Transitions.EASE_IN_BOUNCE, Transitions.easeInBounce);
        register(Transitions.EASE_OUT_BOUNCE, Transitions.easeOutBounce);
        register(Transitions.EASE_IN_OUT_BOUNCE, Transitions.easeInOutBounce);
        register(Transitions.EASE_OUT_IN_BOUNCE, Transitions.easeOutInBounce);
    }

    // transition functions

    static linear(ratio) {
        return ratio;
    }

    static easeIn(ratio) {
        return ratio * ratio * ratio;
    }

    static easeOut(ratio) {
        const invRatio = ratio - 1.0;
        return invRatio * invRatio * invRatio + 1;
    }

    static easeInOut(ratio) {
        return Transitions.easeCombined(Transitions.easeIn, Transitions.easeOut, ratio);
    }

    static easeOutIn(ratio) {
        return Transitions.easeCombined(Transitions.easeOut, Transitions.easeIn, ratio);
    }

    static easeInBack(ratio) {
        const s = 1.70158;
        return Math.pow(ratio, 2) * ((s + 1.0) * ratio - s);
    }

    static easeOutBack(ratio) {
        const invRatio = ratio - 1.0;
        const s = 1.70158;
        return Math.pow(invRatio, 2) * ((s + 1.0) * invRatio + s) + 1.0;
    }

    static easeInOutBack(ratio) {
        return Transitions.easeCombined(Transitions.easeInBack, Transitions.easeOutBack, ratio);
    }

    static easeOutInBack(ratio) {
        return Transitions.easeCombined(Transitions.easeOutBack, Transitions.easeInBack, ratio);
    }

    static easeInElastic(ratio) {
        if (ratio === 0 || ratio === 1) return ratio;
        else {
            const p = 0.3;
            const s = p / 4.0;
            const invRatio = ratio - 1;
            return -1.0 * Math.pow(2.0, 10.0 * invRatio) * Math.sin((invRatio - s) * (2.0 * Math.PI) / p);
        }
    }

    static easeOutElastic(ratio) {
        if (ratio === 0 || ratio === 1) return ratio;
        else {
            const p = 0.3;
            const s = p / 4.0;
            return Math.pow(2.0, -10.0 * ratio) * Math.sin((ratio - s) * (2.0 * Math.PI) / p) + 1;
        }
    }

    static easeInOutElastic(ratio) {
        return Transitions.easeCombined(Transitions.easeInElastic, Transitions.easeOutElastic, ratio);
    }

    static easeOutInElastic(ratio) {
        return Transitions.easeCombined(Transitions.easeOutElastic, Transitions.easeInElastic, ratio);
    }

    static easeInBounce(ratio) {
        return 1.0 - Transitions.easeOutBounce(1.0 - ratio);
    }

    static easeOutBounce(ratio) {
        const s = 7.5625;
        const p = 2.75;
        let l;
        if (ratio < (1.0 / p)) {
            l = s * Math.pow(ratio, 2);
        } else if (ratio < (2.0 / p)) {
            ratio -= 1.5 / p;
            l = s * Math.pow(ratio, 2) + 0.75;
        } else if (ratio < 2.5 / p) {
            ratio -= 2.25 / p;
            l = s * Math.pow(ratio, 2) + 0.9375;
        } else {
            ratio -= 2.625 / p;
            l = s * Math.pow(ratio, 2) + 0.984375;
        }
        return l;
    }

    static easeInOutBounce(ratio) {
        return Transitions.easeCombined(Transitions.easeInBounce, Transitions.easeOutBounce, ratio);
    }

    static easeOutInBounce(ratio) {
        return Transitions.easeCombined(Transitions.easeOutBounce, Transitions.easeInBounce, ratio);
    }

    static easeCombined(startFunc, endFunc, ratio) {
        if (ratio < 0.5) return 0.5 * startFunc(ratio * 2.0);
        else return 0.5 * endFunc((ratio - 0.5) * 2.0) + 0.5;
    }
}
