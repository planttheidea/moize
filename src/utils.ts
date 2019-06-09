/* eslint-disable prefer-rest-params */

import { Moize } from './types';

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
  const { length } = sources;

  if (!length) {
    return target;
  }

  let source;

  for (let index = 0; index < length; index++) {
    source = sources[index];

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
export function combine(...args: any[]): Moize.Handler | void {
  const handlers = getValidHandlers(args);

  if (!handlers.length) {
    return;
  }

  return handlers.reduceRight(function combined(
    f: Moize.Handler,
    g: Moize.Handler,
  ) {
    return function () {
      f.apply(this, arguments);
      g.apply(this, arguments);
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
export function compose(...args: any[]): Moize.Handler | void {
  const handlers = getValidHandlers(args);

  if (!handlers.length) {
    return;
  }

  return handlers.reduceRight(function reduced(
    f: Moize.Handler,
    g: Moize.Handler,
  ) {
    return function () {
      return g(f.apply(this, arguments));
    };
  });
}

/**
 * @private
 *
 * @function getValidHandlers
 *
 * @description
 * get the handlers from the list of items passed
 *
 * @param possibleHandlers the possible handlers
 * @returns the list of handlers
 */
export function getValidHandlers(possibleHandlers: any[]) {
  return possibleHandlers.filter(
    possibleHandler => typeof possibleHandler === 'function',
  );
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
export function isMemoized<Fn extends Moize.Moizable>(
  value: any,
): value is Moize.Moized<Fn> {
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
    (option === ~~option || option === Infinity)
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
export function makeCallable(method: Moize.Handler) {
  return Function.prototype.bind.call(Function.prototype.call, method);
}

export const slice = makeCallable(Array.prototype.slice);
