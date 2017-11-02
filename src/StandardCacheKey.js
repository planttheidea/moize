// @flow

/**
 * @private
 *
 * @class StandardCacheKey
 *
 * @classdesc
 * cache key used when there is a single standard parameter
 */
class StandardCacheKey {
  constructor(key: Array<any>) {
    this.key = this._isMultiParamKey(key) ? key : key[0];
    this.size = key.length;

    return this;
  }

  key: any;
  size: number;

  /**
   * @function _isMultiParamKey
   * @memberof StandardCacheKey
   * @instance
   *
   * @description
   * is the key passed a multiple-parameter key
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} is the key a multiple-parameter key
   */
  _isMultiParamKey(key: Array<any>): boolean {
    return key.length > 1;
  }

  /**
   * @function _matchesMultiple
   * @memberof StandardCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  _matchesMultiple(key: Array<any>): boolean {
    if (key.length !== this.size) {
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

  /**
   * @function _matchesSingle
   * @memberof StandardCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  _matchesSingle(key: Array<any>): boolean {
    return key[0] === this.key;
  }

  /**
   * @function matches
   * @memberof StandardCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<any>): boolean {
    return this._isMultiParamKey(key) ? this._matchesMultiple(key) : this._matchesSingle(key);
  }

  /**
   * @function matchesCustom
   * @memberof StandardCacheKey
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
    return isEqual(this._isMultiParamKey(key) ? key : key[0], this.key);
  }
}

export default StandardCacheKey;
