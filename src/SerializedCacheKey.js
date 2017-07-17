// @flow

// serialize
import {
  stringify
} from './serialize';

/**
 * @private
 *
 * @class SerializedCacheKey
 *
 * @classdesc
 * cache key used when the parameters should be serialized
 */
class SerializedCacheKey {
  constructor(key: Array<any>, serializerFunction: Function) {
    this.key = serializerFunction(key);
    this.serializer = serializerFunction;

    return this;
  }

  key: any = null;
  serializer: Function = stringify;

  /**
   * @function matches
   * @memberof SerializedCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *W
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<any>): boolean {
    return this.serializer(key) === this.key;
  }

  /**
   * @function matchesCustom
   * @memberof SerializedCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance based on the custom equality function passed
   *
   * @param {Array<*>} key the key to test
   * @param {function} isEqual method to compare equality of the keys
   * @returns {boolean} does the key passed match that in the instance
   */
  matchesCustom(key: Array<any>, isEqual: Function): boolean {
    return isEqual(this.serializer(key), this.key);
  }
}

export default SerializedCacheKey;
