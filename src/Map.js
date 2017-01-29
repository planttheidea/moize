// @flow

// utils
import {
  getIndexOfItemInMap,
  isKeyLastItem,
  splice
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
    if (isKeyLastItem(this.lastItem, key)) {
      this.lastItem = undefined;
    }

    const index: number = getIndexOfItemInMap(this, key);

    if (!!~index) {
      splice(this.list, index);
      this.size--;
    }
  }

  /**
   * @function forEach
   * @memberOf MapLike
   * @instance
   *
   * @description
   * forEach method to loop over items in the list
   *
   * @param {function} fn function to call when looping over the list
   */
  forEach(fn: Function) {
    let index: number = -1;

    while (++index < this.size) {
      fn(this.list[index].value, this.list[index].key);
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
    if (isKeyLastItem(this.lastItem, key)) {
      // $FlowIgnore: this.lastItem.value exists
      return this.lastItem.value;
    }

    const index: number = getIndexOfItemInMap(this, key);

    if (!!~index) {
      this.lastItem = this.list[index];

      return this.list[index].value;
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
    if (isKeyLastItem(this.lastItem, key)) {
      return true;
    }

    const index = getIndexOfItemInMap(this, key);

    if (!!~index) {
      this.lastItem = this.list[index];

      return true;
    }

    return false;
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
   * @returns {MapLike} the map object
   */
  set(key: any, value: any) {
    if (isKeyLastItem(this.lastItem, key)) {
      // $FlowIgnore: this.lastItem.value exists
      this.lastItem.value = value;
    } else {
        const index: number = getIndexOfItemInMap(this, key);

        if (!!~index) {
          this.lastItem = this.list[index];
          this.list[index].value = value;
        } else {
          this.lastItem = {
            key,
            value
          };

          this.list.push(this.lastItem);
          this.size++;
        }
    }

    return this;
  }
}

export default MapLike;
