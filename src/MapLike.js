// @flow

// utils
import {
  getIndexOfItemInMap,
  splice,
  unshift
} from './utils';

/**
 * @private
 *
 * @class MapLike
 * @classdesc class that mimics parts of the Map infrastructure, but faster
 */
class MapLike {
  lastItem: ?Object = undefined;
  list: Array<any> = [];
  size: number = 0;

  /**
   * @function clear
   * @memberOf MapLike
   * @instance
   *
   * @description
   * remove all keys from the map
   */
  clear() {
    this.lastItem = undefined;
    this.list = [];
    this.size = 0;
  }

  /**
   * @function delete
   * @memberOf MapLike
   * @instance
   *
   * @description
   * remove the key from the map
   *
   * @param {*} key key to delete from the map
   */
  delete(key: any) {
    const index: number = getIndexOfItemInMap(this.list, this.size, key);

    if (~index) {
      splice(this.list, index);
      this.size--;

      if (this.size === 0) {
        this.lastItem = undefined;
      }
    }
  }

  /**
   * @function get
   * @memberOf MapLike
   * @instance
   *
   * @description
   * get the value for the given key
   *
   * @param {*} key key to get the value for
   * @returns {*} value at the key location
   */
  get(key: any) {
    if (!this.size) {
      return undefined;
    }

    // $FlowIgnore: this.lastItem.key exists
    if (this.lastItem.key === key) {
      // $FlowIgnore: this.lastItem.value exists
      return this.lastItem.value;
    }

    const index: number = getIndexOfItemInMap(this.list, this.size, key);

    if (~index) {
      const item = this.list[index];

      this.lastItem = unshift(splice(this.list, index), item);

      return this.lastItem.value;
    }
  }

  /**
   * @function has
   * @memberOf MapLike
   * @instance
   *
   * @description
   * does the map have the key provided
   *
   * @param {*} key key to test for in the map
   * @returns {boolean} does the map have the key
   */
  has(key: any) {
    if (!this.size) {
      return false;
    }

    // $FlowIgnore: this.lastItem.key exists
    return key === this.lastItem.key || !!~getIndexOfItemInMap(this.list, this.size, key);
  }

  /**
   * @function set
   * @memberOf MapLike
   * @instance
   *
   * @description
   * set the value at the key location, or add a new item with that key value
   *
   * @param {*} key key to assign value of
   * @param {*} value value to store in the map at key
   */
  set(key: any, value: any) {
    this.lastItem = unshift(this.list, {
      key,
      isMultiParamKey: !!(key && key.isMultiParamKey),
      value
    });

    this.size++;
  }
}

export default MapLike;
