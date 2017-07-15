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
 * @class SingleParameterCacheKey
 *
 * @classdesc
 * cache key used when there is a single standard parameter
 */
class SingleParameterCacheKey {
  constructor(key: Array<any>): CacheKey {
    this.key = key[0];

    return this;
  }

  isMultiParamKey: boolean = false;
  key: any = null;
  serializer: Function = noop;
  size: number = 1;

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
    return !isMultiParamKey && key[0] === this.key;
  }
}

export default SingleParameterCacheKey;
