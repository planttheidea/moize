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
    return this.key === this.serializer(key);
  }
}

export default SerializedCacheKey;
