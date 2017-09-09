// @flow

// types
import type {ListItem} from './types';

// utils
import {findIndex, findIndexAfterFirst, isFunction, splice, unshift} from './utils';

/**
 * @private
 *
 * @class Cache
 *
 * @classdesc
 * class that is similar to the Map infrastructure, but faster and
 * more targeted to moize use cases
 */
class Cache {
  lastItem: ListItem = {};
  list: Array<ListItem> = [];
  size: number = 0;

  constructor(options) {
      this.options = options || {};
  }

  /**
   * @function add
   * @memberof Cache
   * @instance
   *
   * @description
   * add a new item to cache
   *
   * @param {*} key the key to assign
   * @param {*} value the value to assign at key
   */
  add(key: any, value: any, ttlTimer: any): any {
    this.lastItem = unshift(this.list, {
      key,
      value,
      ttlTimer
    });

    this.size++;
  }

  /**
   * @function clear
   * @memberof Cache
   * @instance
   *
   * @description
   * clear the cache of all items
   */
  clear() {
    this.lastItem = {};
    this.list.length = this.size = 0;
  }

  /**
   * @function expireAfter
   * @memberof Cache
   * @instance
   *
   * @description
   * remove from cache after maxAge time has passed
   *
   * @param {*} key the key to remove
   * @param {number} maxAge the time in milliseconds to wait before removing the key
   * @param {Function} onExpire a callback that is called before removing the key, can return false to cancel removal and reset expiration timer
   */
  expireAfter(key: any, maxAge: number, onExpire: ?Function) {
    return setTimeout(() => {
      if (isFunction(onExpire)) {
        // $FlowIgnore onExpire is a function
        if (onExpire(key.key) !== false) {
            return this.remove(key);
        } else {
            return this.expireAfter(key, maxAge, onExpire);
        }
      }
      return this.remove(key);
    }, maxAge);
  }

  /**
   * @function get
   * @memberof Cache
   * @instance
   *
   * @description
   * get the value of an item from cache if it exists
   *
   * @param {*} key the key to get the value of
   * @returns {*} the value at key
   */
  get(key: any): any {
    if (this.size) {
      if (key === this.lastItem.key) {
        if (this.options.updateExpire && this.lastItem.ttlTimer) {
            clearTimeout(this.lastItem.ttlTimer);
            this.lastItem.ttlTimer = this.expireAfter(key, this.options.maxAge, this.options.onExpire);
        }
        return this.lastItem.value;
      }

      const index: number = findIndexAfterFirst(this.list, key);

      if (~index) {
        this.lastItem = this.list[index];

        if (this.options.updateExpire && this.list[index].ttlTimer) {
            clearTimeout(this.list[index].ttlTimer);
            this.list[index].ttlTimer = this.expireAfter(key, this.options.maxAge, this.options.onExpire);
        }

        return unshift(splice(this.list, index), this.lastItem).value;
      }
    }
  }

  /**
   * @private
   *
   * @function has
   *
   * @description
   * does the key exist in the cache
   *
   * @param {*} key the key to find in cache
   * @returns {boolean} does the key exist in cache
   */
  has(key: any): boolean {
    return this.size !== 0 && (key === this.lastItem.key || !!~findIndexAfterFirst(this.list, key));
  }

  /**=
   * @function remove
   * @memberof Cache
   * @instance
   *
   * @description
   * remove the item at key from cache
   *
   * @param {*} key the key to remove from cache
   * @returns {void}
   */
  remove(key: any) {
    const index: number = findIndex(this.list, key);

    if (~index) {
      splice(this.list, index);

      if (this.size === 1) {
        return this.clear();
      }

      this.size--;

      if (!index) {
        this.lastItem = this.list[0];
      }
    }
  }

  /**
   * @function update
   * @memberof Cache
   * @instance
   *
   * @description
   * update an item in-place with a new value
   *
   * @param {*} key key to update value of
   * @param {*} value value to store in the map at key
   */
  update(key: any, value: any) {
    const index: number = findIndex(this.list, key);

    if (~index) {
      this.list[index].value = value;

      if (this.lastItem && key === this.lastItem.key) {
        this.lastItem.value = value;
      }
    }
  }
}

export default Cache;
