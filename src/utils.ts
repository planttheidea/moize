import { Moize, Moizeable, Moized, Options } from './internalTypes.js';

/**
 * Compose functions into a single function.
 */
export function compose<Method>(...functions: Method[]): Method {
    return functions.reduce(function (f: any, g: any) {
        if (typeof f === 'function') {
            return typeof g === 'function'
                ? function (this: any) {
                      return f(g.apply(this, arguments));
                  }
                : f;
        }

        if (typeof g === 'function') {
            return g;
        }
    });
}

/**
 * Determine whether the value passed is a moized method.
 */
export function isMoized(fn: any): fn is Moize<Options<Moizeable>> {
    return typeof fn === 'function' && !!fn.isMemoized && !!fn.fn;
}

export function setName<Fn extends Moizeable>(
    moized: Moized<Fn, Options<Fn>>,
    fn: Fn,
    options: Options<Fn>,
) {
    try {
        const name = fn.name || options.statsName || 'anonymous';

        Object.defineProperty(moized, 'name', {
            configurable: true,
            enumerable: false,
            value: `moized(${name})`,
            writable: true,
        });
    } catch {
        // Do nothing where `function.name` is not configurable
    }
}
