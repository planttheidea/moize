import { Handler, Moized, Options } from './types';

/**
 * @private
 *
 * @constant DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Options = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  matchesKey: undefined,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: 1,
  onCacheAdd: undefined,
  onCacheChange: undefined,
  onCacheHit: undefined,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  shouldSerializeFunctions: false,
  transformArgs: undefined,
  updateExpire: false,
};

/**
 * @private
 *
 * @function assignFallback
 *
 * @description
 * fallback to the built-in Object.assign when not available
 *
 * @param target the target object
 * @param sources the sources to assign to the target
 * @returns the assigned target
 */
export function assignFallback(target: any, ...sources: any[]) {
  if (!sources.length) {
    return target;
  }

  let source;

  for (let index = 0; index < sources.length; index++) {
    source = sources[index];

    if (source && typeof source === 'object') {
      for (const key in source) {
        if (hasOwnProperty(source, key)) {
          // eslint-disable-next-line no-param-reassign
          target[key] = source[key];
        }
      }
    }
  }

  return target;
}

/**
 * @private
 *
 * @constant assign the method to assign sources into a target
 */
export const assign = typeof Object.assign === 'function' ? Object.assign : assignFallback;

/**
 * @private
 *
 * @function combine
 *
 * @description
 * combine all functions that are functions into a single function that calls
 * all functions in the order passed
 *
 * @param functions the functions to combine
 * @returns the combined function
 */
export function combine(...args: any[]): Handler | void {
  const handlers = getValidHandlers(args);

  if (!handlers.length) {
    return;
  }

  return handlers.reduceRight(function combined(f: Handler, g: Handler) {
    return function () {
      /* eslint-disable prefer-rest-params */
      f.apply(this, arguments);
      g.apply(this, arguments);
      /* eslint-enable */
    };
  });
}

/**
 * @private
 *
 * @function compose
 *
 * @description
 * combine all functions that are functions into a single function pipeline
 *
 * @param functions the functions to compose
 * @returns the composed function
 */
export function compose(...args: any[]): Handler | void {
  const handlers = getValidHandlers(args);

  if (!handlers.length) {
    return;
  }

  return handlers.reduceRight(function reduced(f: Handler, g: Handler) {
    return function () {
      // eslint-disable-next-line prefer-rest-params
      return g(f.apply(this, arguments));
    };
  });
}

export function getValidHandlers(args: any[]) {
  const handlers: Handler[] = [];

  let arg;

  for (let index = 0; index < args.length; index++) {
    arg = args[index];

    if (typeof arg === 'function') {
      handlers.push(arg);
    }
  }

  return handlers;
}

export const hasOwnProperty = makeCallable(Object.prototype.hasOwnProperty);

export function isOptions(value: any): value is Options {
  return !!value && typeof value === 'object';
}

export function isMemoized<Fn extends Function>(value: any): value is Moized<Fn> {
  return typeof value === 'function' && value.isMemoized === true;
}

export function makeCallable(method: (...args: any[]) => any) {
  return Function.prototype.bind.call(Function.prototype.call, method);
}

export const slice = makeCallable(Array.prototype.slice);

/**
 * @private
 *
 * @function throwIfNotInteger
 *
 * @description
 * throw an error if the value passed is a number but not a positive integer
 *
 * @throws
 *
 * @param value the value to test
 * @param name the name of the value
 */
export function throwIfNotInteger(value: number | void, name: string) {
  if (value == null || value === DEFAULT_OPTIONS[name]) {
    return;
  }

  if (
    value < 0 ||
    // eslint-disable-next-line no-self-compare
    value !== value ||
    value !== ~~value
  ) {
    throw new TypeError(`${name} must be a positive integer`);
  }
}
