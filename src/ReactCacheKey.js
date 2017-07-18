// @flow

/**
 * @private
 *
 * @class ReactCacheKey
 *
 * @classdesc
 * cache key used specifically for react components
 */
class ReactCacheKey {
  constructor(key: Array<Object>) {
    const context = key[1];
    const props = key[0];

    this.key = {
      context,
      contextSize: context ? Object.keys(context).length : 0,
      props,
      propsSize: props ? Object.keys(props).length : 0
    };

    return this;
  }

  key: any = null;

  /**
   * @function _isPropShallowEqual
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * check if the prop value passed is equal to the key's value
   *
   * @param {string} prop the key property to test
   * @param {Object} object the value of the key to test against
   * @returns {boolean} is the prop value shallow equal to the object
   */
  _isPropShallowEqual(prop: string, object: Object): boolean {
    const keys: Array<string> = Object.keys(object);

    if (keys.length !== this.key[`${prop}Size`]) {
      return false;
    }

    let index: number = 0;

    while (index < keys.length) {
      if (object[keys[index]] !== this.key[prop][keys[index]]) {
        return false;
      }

      index++;
    }

    return true;
  }

  /**
   * @function _isPropCustomEqual
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * check if the prop value passed is equal to the key's value
   *
   * @param {string} prop the key property to test
   * @param {Object} object the value of the key to test against
   * @param {function} isEqual method to check equality of keys
   * @returns {boolean} is the prop value shallow equal to the object
   */
  _isPropCustomEqual(prop: string, object: Object, isEqual: Function): boolean {
    const keys: Array<string> = Object.keys(object);

    if (keys.length !== this.key[`${prop}Size`]) {
      return false;
    }

    let index: number = 0;

    while (index < keys.length) {
      if (!isEqual(object[keys[index]], this.key[prop][keys[index]])) {
        return false;
      }

      index++;
    }

    return true;
  }

  /**
   * @function matches
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @returns {boolean} does the key passed match that in the instance
   */
  matches(key: Array<Object>): boolean {
    return this._isPropShallowEqual('props', key[0]) && this._isPropShallowEqual('context', key[1]);
  }

  /**
   * @function matchesCustom
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * does the passed key match the key in the instance
   *
   * @param {Array<*>} key the key to test
   * @param {function} isEqual method to check equality of keys
   * @returns {boolean} does the key passed match that in the instance
   */
  matchesCustom(key: Array<Object>, isEqual: Function): boolean {
    return this._isPropCustomEqual('props', key[0], isEqual) && this._isPropCustomEqual('context', key[1], isEqual);
  }
}

export default ReactCacheKey;
