// @flow

// utils
import {getKeyCount} from './utils';

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
    this.key = {
      context: this._getKeyPart(key[1]),
      props: this._getKeyPart(key[0])
    };

    return this;
  }

  key: any = null;

  /**
   * @function _getKeyPart
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * get the object of metadata for the key part
   *
   * @param {Object} keyPart the key part to get the metadata of
   * @returns {Object} the metadata for the key part
   */
  _getKeyPart(keyPart: ?Object): Object {
    const keys = keyPart ? Object.keys(keyPart) : [];

    return {
      keys,
      size: keys.length,
      value: keyPart
    };
  }

  /**
   * @function _isPropShallowEqual
   * @memberof ReactCacheKey
   * @instance
   *
   * @description
   * check if the prop value passed is equal to the key's value
   *
   * @param {Object} object the new key to test against the instance
   * @param {Object} existing the key object stored in the instance
   * @param {Array<string>} existing.keys the keys of the existing object
   * @param {number} existing.size the length of the keys array
   * @param {Object} value the value of the key part
   * @returns {boolean} is the prop value shallow equal to the object
   */
  _isPropShallowEqual(object: Object, existing: Object): boolean {
    if (getKeyCount(object) !== existing.size) {
      return false;
    }

    let index: number = 0,
        key: string;

    while (index < existing.size) {
      key = existing.keys[index];

      if (object[key] !== existing.value[key]) {
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
   * @param {Object} object the new key to test against the instance
   * @param {Object} existingObject the key stored in the instance
   * @param {function} isEqual custom equality comparator
   * @returns {boolean} are the objects equal based on the isEqual method passed
   */
  _isPropCustomEqual(
    object: Object,
    existingObject: Object,
    isEqual: Function
  ): boolean {
    return isEqual(object, existingObject);
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
    return (
      this._isPropShallowEqual(key[0], this.key.props) &&
      this._isPropShallowEqual(key[1], this.key.context)
    );
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
    return (
      this._isPropCustomEqual(key[0], this.key.props.value, isEqual) &&
      this._isPropCustomEqual(key[1], this.key.context.value, isEqual)
    );
  }
}

export default ReactCacheKey;
