// @flow

/**
 * @private
 *
 * @class SingleParameterCacheKey
 *
 * @classdesc
 * cache key used when there is a single standard parameter
 */
class SingleParameterCacheKey {
  constructor(key: Array<any>) {
    this.key = key[0];

    return this;
  }

  key: any = null;

  /**
   * @function matches
   * @memberof SingleParameterCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<any>): boolean {
    return key.length < 2 && key[0] === this.key;
  }

  /**
   * @function matchesCustom
   * @memberof SingleParameterCacheKey
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
    return key.length < 2 && isEqual(key[0], this.key);
  }
}

export default SingleParameterCacheKey;
