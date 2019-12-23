/* globals self */

/* eslint-disable prefer-rest-params */

import * as Types from './types';

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
export function assignFallback(target: any) {
  const { length } = arguments;

  if (length < 2) {
    return target;
  }

  let source;

  for (let index = 1; index < length; index++) {
    source = arguments[index];

    if (source && typeof source === 'object') {
      for (const key in source) {
        if (hasOwnProperty(source, key)) {
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
export const assign =
  typeof Object.assign === 'function' ? Object.assign : assignFallback;

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
export function combine(...args: Types.Fn[]): Types.Fn | void {
  const handlers = getValidHandlers(args);

  switch (handlers.length) {
    case 0:
      return;

    case 1:
      return handlers[0];

    default:
      return handlers.reduceRight(function combined(f, g) {
        return function () {
          f.apply(this, arguments);
          g.apply(this, arguments);
        };
      });
  }
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
export function compose(...args: Types.Fn[]): Types.Fn {
  const handlers = getValidHandlers(args);

  switch (handlers.length) {
    case 0:
      return undefined;

    case 1:
      return handlers[0];

    default:
      return handlers.reduce(function (f, g) {
        return function () {
          return f(g.apply(this, arguments));
        };
      });
  }
}

export function getGlobalObject() {
  if (typeof globalThis !== 'undefined') {
    // eslint-disable-next-line no-undef
    return globalThis;
  }

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    return window;
  }

  if (typeof global !== 'undefined') {
    return global;
  }

  /* eslint-disable no-restricted-globals */

  if (typeof self !== 'undefined') {
    return self;
  }

  /* eslint-enable */

  try {
    // eslint-disable-next-line no-new-func
    return Function('return this')();
  } catch {
    throw new Error(
      'The global object is not available in this environment. Please surface either `globalThis`, `window`, `global`, or `self` as a reference to it.',
    );
  }
}

/**
 * @private
 *
 * @function getValidHandlers
 *
 * @description
 * get the handlers from the list of items passed
 *
 * @param handlers the possible handlers
 * @returns the list of handlers
 */
export function getValidHandlers(handlers: any[]) {
  return handlers.filter((handler) => typeof handler === 'function');
}

export const hasOwnProperty = makeCallable(Object.prototype.hasOwnProperty);

/**
 * @private
 *
 * @function isMemoized
 *
 * @description
 * is the value passed a previously-memoized function
 *
 * @param value the value to test
 * @returns is the value a memoized function
 */
export function isMemoized<Fn extends Types.Moizeable>(
  value: any,
): value is Types.Moized<Fn> {
  return typeof value === 'function' && value.isMemoized === true;
}

/**
 * @private
 *
 * @function isValidNumericOption
 *
 * @description
 * is the option passed a valid number value
 *
 * @param option the option to test
 * @returns is the option a valid number
 */
export function isValidNumericOption(option: any) {
  return (
    typeof option === 'number' &&
    option > -1 &&
    // eslint-disable-next-line no-self-compare
    option === option &&
    (option === Math.floor(option) || option === Infinity)
  );
}

/**
 * @private
 *
 * @function makeCallable
 *
 * @description
 * make a prototype method that would normally require the use of `.call()` directly callable
 *
 * @param method the method to make callable
 * @returns the callable method
 */
export function makeCallable(method: Types.Fn) {
  return Function.prototype.bind.call(Function.prototype.call, method);
}

export const slice = makeCallable(Array.prototype.slice);
