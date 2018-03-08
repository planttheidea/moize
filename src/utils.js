// @flow

// types
import type {Expiration} from './types';

/**
 * @private
 *
 * @function combine
 *
 * @description
 * method to combine functions and return a single function that fires them all
 *
 * @param {...Array<function>} functions the functions to compose
 * @returns {function(...Array<*>): *} the composed function
 */
export const combine = (...functions: Array<any>): Function => {
  // $FlowIgnore return value is always a function
  return functions.reduce((f: Function, g: any): Function => {
    return typeof f === 'function'
      ? typeof g === 'function'
        ? function(): any {
          /* eslint-disable prefer-spread */
          f.apply(this, arguments);
          g.apply(this, arguments);
          /* eslint-enable */
        }
        : f
      : typeof g === 'function' ? g : function() {};
  });
};

/**
 * @private
 *
 * @function compose
 *
 * @description
 * method to compose functions and return a single function
 *
 * @param {...Array<function>} functions the functions to compose
 * @returns {function(...Array<*>): *} the composed function
 */
export const compose = (...functions: Array<any>): Function => {
  // $FlowIgnore return value is always a function
  return functions.reduce((f: Function, g: any): Function => {
    return typeof f === 'function'
      ? typeof g === 'function'
        ? function(): any {
          return f(g.apply(this, arguments)); // eslint-disable-line prefer-spread
        }
        : f
      : typeof g === 'function'
        ? g
        : function(arg) {
          return arg;
        };
  });
};

/**
 * @private
 *
 * @function findExpirationIndex
 *
 * @description
 * find the index of the expiration based on the key
 *
 * @param {Array<Expiration>} expirations the list of expirations
 * @param {Array<any>} key the key to match
 * @returns {number} the index of the expiration
 */
export const findExpirationIndex = (expirations: Array<Expiration>, key: Array<any>): number => {
  for (let index: number = 0; index < expirations.length; index++) {
    if (expirations[index].key === key) {
      return index;
    }
  }

  return -1;
};

/**
 * @private
 *
 * @function findKeyIndex
 *
 * @description
 * find the index of the key in the list of cache keys
 *
 * @param {function} isEqual the method to test equality
 * @param {Array<Array<any>>} keys the list of keys in cache
 * @param {Array<any>} key the key to match
 * @returns {number} the index of the key
 */
export const findKeyIndex = (isEqual: Function, keys: Array<Array<any>>, key: Array<any>): number => {
  cacheKeys: for (let keysIndex = 0; keysIndex < keys.length; keysIndex++) {
    if (keys[keysIndex].length === key.length) {
      for (let keyIndex = 0; keyIndex < key.length; keyIndex++) {
        if (!isEqual(key[keyIndex], keys[keysIndex][keyIndex])) {
          continue cacheKeys;
        }
      }

      return keysIndex;
    }
  }

  return -1;
};
