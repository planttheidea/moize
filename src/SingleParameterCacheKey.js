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

  isMultiParamKey: boolean = false;
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
   * @param {boolean} isMultiParamKey is the key a multi-parameter key
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<any>, isMultiParamKey: boolean): boolean {
    return !isMultiParamKey && key[0] === this.key;
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
   * @param {boolean} isMultiParamKey is the key a multi-parameter key
   * @param {function} isEqual method to compare equality of the keys
   * @returns {boolean} does the key passed match that in the instance
   */
  matchesCustom(
    key: Array<any>,
    isMultiParamKey: boolean,
    isEqual: Function
  ): boolean {
    return !isMultiParamKey && isEqual(key[0], this.key);
  }
}

export default SingleParameterCacheKey;
