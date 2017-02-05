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
 * @class Cache
 * @classdesc class that mimics parts of the Map infrastructure, but faster
 */
class Cache {
  lastItem: ?Object = undefined;
  list: Array<any> = [];
  size: number = 0;

  /**
   * @function clear
   * @memberOf Cache
   * @instance
   *
   * @description
   * remove all keys from the map
   */
  clear(): void {
    this.list = [];

    this.setLastItem();
    this.updateSize();
  }

  /**
   * @function delete
   * @memberOf Cache
   * @instance
   *
   * @description
   * remove the key from the map
   *
   * @param {*} key key to delete from the map
   */
  delete(key: any): void {
    const index: number = getIndexOfItemInMap(this.list, this.size, key);

    if (~index) {
      splice(this.list, index);

      this.updateSize();

      if (this.size === 0) {
        this.setLastItem();
      }
    }
  }

  /**
   * @function get
   * @memberOf Cache
   * @instance
   *
   * @description
   * get the value for the given key
   *
   * @param {*} key key to get the value for
   * @returns {*} value at the key location
   */
  get(key: any): any {
    if (this.size === 0) {
      return undefined;
    }

    // $FlowIgnore: this.lastItem.key exists
    if (key === this.lastItem.key) {
      // $FlowIgnore: this.lastItem.value exists
      return this.lastItem.value;
    }

    const index: number = getIndexOfItemInMap(this.list, this.size, key);

    if (~index) {
      const item = this.list[index];

      this.setLastItem(unshift(splice(this.list, index), item));

      // $FlowIgnore this.lastItem exists
      return this.lastItem.value;
    }
  }

  /**
   * @function has
   * @memberOf Cache
   * @instance
   *
   * @description
   * does the map have the key provided
   *
   * @param {*} key key to test for in the map
   * @returns {boolean} does the map have the key
   */
  has(key: any): boolean {
    if (this.size === 0) {
      return false;
    }

    // $FlowIgnore: this.lastItem.key exists
    return key === this.lastItem.key || !!~getIndexOfItemInMap(this.list, this.size, key);
  }

  /**
   * @function set
   * @memberOf Cache
   * @instance
   *
   * @description
   * set the value at the key location, or add a new item with that key value
   *
   * @param {*} key key to assign value of
   * @param {*} value value to store in the map at key
   */
  set(key: any, value: any): void {
    this.setLastItem(unshift(this.list, {
      key,
      isMultiParamKey: !!(key && key.isMultiParamKey),
      value
    }));
    this.updateSize();
  }

  /**
   * @function setLastItem
   *
   * @description
   * assign the lastItem
   *
   * @param {*} lastItem the item to assign
   */
  setLastItem(lastItem: any): void {
    this.lastItem = lastItem;
  }

  /**
   * @function updateSize
   *
   * @description
   * update the instance size to that of the list length
   */
  updateSize(): void {
    this.size = this.list.length;
  }
}

export default Cache;
