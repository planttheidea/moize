/* eslint-disable prefer-rest-params */

import { Handler, Moizable, Moized } from './types';

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
export function compose(...args: any[]): Handler | void {
  const handlers = getValidHandlers(args);

  if (!handlers.length) {
    return;
  }

  return handlers.reduceRight(function reduced(f: Handler, g: Handler) {
    return function () {
      return g(f.apply(this, arguments));
    };
  });
}

export function getValidHandlers(args: any[]) {
  return args.reduce((handlers: Handler[], arg: any) => {
    if (typeof arg === 'function') {
      handlers.push(arg);
    }

    return handlers;
  }, []);
}

export const hasOwnProperty = makeCallable(Object.prototype.hasOwnProperty);

export function isMemoized<Fn extends Moizable>(value: any): value is Moized<Fn> {
  return typeof value === 'function' && value.isMemoized === true;
}

export function makeCallable(method: (...args: any[]) => any) {
  return Function.prototype.bind.call(Function.prototype.call, method);
}

export const slice = makeCallable(Array.prototype.slice);
