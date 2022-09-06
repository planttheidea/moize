import {
    createCustomEqual,
    createCustomCircularEqual,
    sameValueZeroEqual,
} from 'fast-equals';

import type { BaseCircularMeta as Cache } from 'fast-equals';

export { sameValueZeroEqual };

function areRegExpsEqual(a: RegExp, b: RegExp) {
    return (
        a.source === b.source &&
        a.global === b.global &&
        a.ignoreCase === b.ignoreCase &&
        a.multiline === b.multiline &&
        a.unicode === b.unicode &&
        a.sticky === b.sticky &&
        a.lastIndex === b.lastIndex
    );
}

const getCache =
    typeof WeakMap !== 'undefined'
        ? function getDefaultCache(): Cache {
              return new WeakMap();
          }
        : function getFallbackCache(): Cache {
              const entries: Array<[object, any]> = [];

              return {
                  delete(key) {
                      for (let index = 0; index < entries.length; ++index) {
                          if (entries[index][0] === key) {
                              entries.splice(index, 1);
                              return true;
                          }
                      }

                      return false;
                  },

                  get(key) {
                      for (let index = 0; index < entries.length; ++index) {
                          if (entries[index][0] === key) {
                              return entries[index][1];
                          }
                      }
                  },

                  set(key, value) {
                      for (let index = 0; index < entries.length; ++index) {
                          if (entries[index][0] === key) {
                              entries[index][1] = value;
                              return this;
                          }
                      }

                      entries.push([key, value]);

                      return this;
                  },
              };
          };

const isDeeplyEqual = createCustomEqual<undefined>(() => ({ areRegExpsEqual }));
const isShallowlyEqual = createCustomEqual<undefined>(() => ({
    areRegExpsEqual,
    createIsNestedEqual: () => sameValueZeroEqual,
}));

export const deepEqual = <A, B>(a: A, b: B) => isDeeplyEqual(a, b, undefined);
export const shallowEqual = <A, B>(a: A, b: B) =>
    isShallowlyEqual(a, b, undefined);

const isDeeplyEqualCircular = createCustomCircularEqual<Cache>(() => ({
    areRegExpsEqual,
}));
const isShallowlyEqualCircular = createCustomCircularEqual<Cache>(() => ({
    areRegExpsEqual,
    createIsNestedEqual: () => sameValueZeroEqual,
}));

export const deepEqualCircular = <A, B>(a: A, b: B) =>
    isDeeplyEqualCircular(a, b, getCache());
export const shallowEqualCircular = <A, B>(a: A, b: B) =>
    isShallowlyEqualCircular(a, b, getCache());
