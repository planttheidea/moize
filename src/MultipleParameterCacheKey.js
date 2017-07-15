// @flow

// types
import type {
  CacheKey
} from './types';

// utils
import {
  noop
} from './utils';

/**
 * @class MultipleParameterCacheKey
 *
 * @classdesc
 * cache key used when there are multiple standard parameters
 */
class MultipleParameterCacheKey {
  constructor(key: Array<any>): CacheKey {
    this.key = key;
    this.size = key.length;

    return this;
  }

  isMultiParamKey: boolean = true;
  key: any = null;
  serializer: Function = noop;
  size: number = 0;

  /**
   * @function matches
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @param {boolean} isMultiParamKey is the key a multi-parameter key
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<any>, isMultiParamKey: boolean): boolean {
    if (!isMultiParamKey || key.length !== this.size) {
      return false;
    }

    let index: number = 0;

    while (index < this.size) {
      if (key[index] !== this.key[index]) {
        return false;
      }

      index++;
    }

    return true;
  }
}

export default MultipleParameterCacheKey;
