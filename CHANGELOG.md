# moize CHANGELOG

## 5.4.4

- Fix export in TypeScript declarations([#105](https://github.com/planttheidea/moize/pull/105))

## 5.4.3

- Improve typings for TypeScript ([#103](https://github.com/planttheidea/moize/pull/103))

## 5.4.2

- Ignore when `maxArgs` or `maxSize` arguments are negative

## 5.4.1

- Upgrade to `babel@7`
- Add `"sideEffects": false` to `package.json` for better tree-shaking in `webpack`

## 5.4.0

- Add ESM support for NodeJS with separate [`.mjs` extension](https://nodejs.org/api/esm.html) exports

## 5.3.2

**BUGFIXES**

- Bump `micro-memoize` dependency to fix recursive race condition issue

## 5.3.1

**BUGFIXES**

- Clean up logic surrounding `update` function to not unnecessarily assign the value twice

## 5.3.0

**NEW FEATURES**

- Add the [`moized.update`](README.md#updatekey-value) method for direct cache manipulation

## 5.2.3

**BUGFIXES**

- Actually fix the issue that `5.2.2` was supposed to fix (appreciate the persistence [@vlad-zhukov](https://github.com/vlad-zhukov))

## 5.2.2

**BUGFIXES**

- Fix issue where manually removing a key from `cache` would not clear / remove the expiration timeout

## 5.2.1

**BUGFIXES**

- Fix `Object.assign` usage on functions (derp)

## 5.2.0

**NEW FEATURES**

- Add `collectStats` as a convenience method on the main `moize` object

**BUGFIXES**

- Fix naming convention for determining if statistics are being collected on the `moize`d function (`isCollectingStats` now, was mistakenly `collectStats` before)

## 5.1.2

**BUGFIXES**

- Reference the correct option name for `micro-memoize` (isMatchingKey) instead of `moize` (matchesKey) for instance methods (oops)

## 5.1.1

**BUGFIXES**

- Ensure instance methods that update the cache work correctly with new `matchesKey` option

## 5.1.0

**NEW FEATURES**

- Add [`matchesKey`](#matcheskey) option
- Change `isSerialized` to use `matchesKey` with custom `isMatchingKey` instead of standard `isEqual`

**BUGFIXES**

- Prevent `isDeepEqual` from being passed to the `micro-memoize` options

## 5.0.1

- Include `fast-equals` as an explicit dependency

## 5.0.0

- Complete refactor to leverage [`micro-memoize`](https://github.com/planttheidea/micro-memoize) under the hood (doubles the speed, and allows for more functionality)

**BREAKING CHANGES**

- The default `equals` option now uses [SameValueZero](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero) equality instead of strict equality
- `equals` option is now performed iteratively on each argument in the key, rather on the key as a whole
  - `matchesKey` option now performs the full-key comparison that `equals` did in v4
- `serialize` option has been changed to `isSerialized`
- `serializeFunctions` option has been changed to `shouldSerializeFunctions`
- CommonJS consumers must now use `require('moize').default`
- The shape of the `cache` object has changed
  - If you were modifying it directly instead of using the [convenience methods](#direct-cache-manipulation), you may experience breakages
- `moize.promise` now sets both `isPromise` and `updateExpire` options (v4 and below only set `isPromise`)
- When `isPromise` is `true` and a `maxAge` is applied, the `maxAge` now begins when the function is created rather than the resolution of the promise
  - If you want the `maxAge` to apply upon resolution, then either set the `updateExpire` option or use the `moize.promise` convenience method

**NEW FEATURES**

- Deep equality now available without custom `equals` function (either [`isDeepEqual`](README.md#isdeepequal) option, or [`moize.deep`](README.md#moizedeep) convenience method)
- Statistics can now be collected for both global and method-specific contexts (see [Collecting statistics](#collecting-statistics) and [`profileName`](README.md#profilename))
- Statistics-based introspection methods exist to support reading stats
  - [`getStats`](README.md#getstats) will get the stats for the `profileName` passed, or if none is passed then gets the global stats
  - [`isCollectingStats`](README.md#iscollectingstats) returns whether stats are being collected
- Cache change listeners are now available to listen for changes
  - [`onCacheAdd`](README.md#oncacheadd) will fire when a new entry is added to the cache
  - [`onCacheChange`](README.md#oncachechange) will fire when the cache is added to or the LRU order has changed
  - [`onCacheHit`](README.md#oncachehit) will fire when an existing entry in cache is used

**BUGFIXES**

- `isPromise` methods that resolved had the values re-wrapped in a new promise, which obfuscated chaining on the method (now the original promise is maintained)
- Internal de-circularizer for serialized methods was flaky in deeply-nested scenarios (now uses [`json-stringify-safe`](https://github.com/moll/json-stringify-safe))

**DEPRECATIONS**

- `promiseLibrary` is no longer a supported option (it is no longer needed, as the original promise is now maintained)

## 4.0.4

- Add `default` property to `moize` which points to itself, allowing TypeScript to import correctly as an ES module

## 4.0.3

- Fix issue where items manually added to cache did not have the same options (`maxAge`, `maxSize`, etc.) applied to them as those added to cache through function call

## 4.0.2

- Remove duplicate internal method

## 4.0.1

- Update issue where `onExpire` was firing prior to removal of the key from cache

## 4.0.0

- Add programmatic update of expiration based on return from `onExpire`

**BREAKING CHANGES**

- `onExpire` will update the expiration if `false` is returned
  - In prior versions, the return of `onExpire` was ignored entirely

## 3.5.0

- Add `updateExpire` option, which if true will reset the expiration countdown based on `maxAge` when a cached value for that key has been hit
- Update TypeScript typings (thanks @Joshuaweiss)

## 3.4.2

- Remove unneeded constants declarations for smaller footprint

## 3.4.1

- Remove code duplication and unnecessary cache key segregation (reduced library size by ~10.6%)
- Improve Flow typings (no longer driven off of TypeScript typings)

## 3.4.0

- Add `onExpire` callback that fires when a cache item expires

## 3.3.1

- Fix TypeScript definitions with correct declarations (thanks @iHaiduk)

## 3.3.0

- Add `es` transpilation in addition to standard `lib`, preserving ES2015 modules for [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module)

## 3.2.2

- Refactor `ReactCacheKey` to double the speed (yes, double)

## 3.2.1

- Fix issue where `MultipleParameterCacheKey` and `ReactCacheKey` were not applying `equals` correctly

## 3.2.0

- Add `transformArgs` option, which allows trasformation of the arguments prior to being used as a key

## 3.1.2

- Fix `clear` referencing incorrect object
- Fix `equals` not using `matchesCustom` when used in conjunction with `serialize`

## 3.1.1

- BAD PUBLISH - do not use!

## 3.1.0

- New: add `isMoized` introspection method
- New; add FlowType declarations based on TypeScript typings
- New: add `prettier` to project, with pre-commit hooks to format the code
- Fix: only serialize key once when attempting to match in cache (was serializing on every iteration)

## 3.0.2

- Improve performance of `take` by making it a higher-order function

## 3.0.1

- Update TypeScript typings to include new `equals` option

## 3.0.0

- Improve performance of multiple parameter cache matching (~3x faster)
- Improve performance of `react` functional component cache matching (~9.5x faster)
- Improve performance of serialized parameter cache matching (~1.5x faster)
- Improve performance of use with `maxArgs`
- Add `equals` option for ability to provide custom equality comparison method
- Add `moize.reactSimple` shortcut method to limit `react` cache size to `1` (mimics the `PureComponent` optimization)
- Add `isReact` option for simpler `react` configuration via `options`
- Fix issue where `moize` was only able to curry `options` once
- Fix issue with `react` cache where different functions with identical names / body contents were seen as equal
- Fix issue where `maxArgs` was not always respected for `serialize` caches

**BREAKING CHANGES**

- Custom `cache` is no longer available in `options`
- `moize.react` now performs a shallow equal comparison of `props` and `context` instead of deep value comparison
  - If you want to perform a deep value equality comparison (if you are mutation props, for example), pass a deep equality comparison method via the `equals` option such as `lodash`'s `isEqual`
  - If you want to continue using the v2 version of `moize.react`, you can manually apply the options: `moize.serialize(fn, {maxArgs: 2, serializeFunctions: true})`
- The direct cache manipulation `delete` method has been renamed to `remove`
- The direct cache manipulation `hasCacheFor` method has been renamed to `has`
- The `key` passed to direct cache manipulation methods (`add`, `has`, `remove`) must now be an array
  - The array reflects the arguments passed to the method (`moized.hasCacheFor('foo', 'bar')` => `moized.has(['foo', 'bar'])`)

## 2.5.1

- Surface types for TypeScript correctly

## 2.5.0

- Add TypeScript definitions (thanks [vhfmag](https://github.com/vhfmag))
- Skip unneeded first entry iteration when getting the multi-parameter key or finding the index of a key

## 2.4.1

- Make positive integer checker use regex instead of bitwise operation

## 2.4.0

- Add `hasCacheFor` method to determine if the memoized function has cache for given arguments

## 2.3.3

- Remove unneeded iterator key generator method
- Various micro-optimizations

## 2.3.2

- Add `lodash-webpack-plugin` for smaller `dist` builds

## 2.3.1

- Streamline the creation of curriable shortcuts (`moize.maxAge`, `moize.maxSize`)
- Add curriable shortcut for `moize.maxArgs` (missed in initial release)

## 2.3.0

- More options have shortcut methods
  - `maxAge`
    - Curried method (example: `moize.maxAge(5000)(method)`)
  - `maxSize`
    - Curried method (example: `moize.maxSize(5)(method)`)
  - `promise` (shortcut for `isPromise: true`)
  - `serialize`
  - `simple` (shortcut for `maxSize: 1`)
- `moize` functions are now composable (example usage: `moize.compose(moize.react, moize.simple)`)

## 2.2.3

- Simplify internal vs custom cache recognition
- Typing and documentation cleanup

## 2.2.2

- Abstract out `promiseResolver` and `promiseRejecter` into separate testable functions
- Various code cleanups and typing enhancements

## 2.2.1

- Fix issue with `delete` checking `size` of the `Cache` before it had actually updated

## 2.2.0

- Added `promiseLibrary` option to allow use of custom promise implementation
- Bolster `isPromise` logic, auto-removing from cache when the promise is rejected
- Update README for more detailed information on both `isPromise` and `promiseLibrary` options
- Convert `Cache` key iteration to use custom iterator instead of standard loop for more stable iteration

## 2.1.6

- Code cleanup

## 2.1.5

- Fix issue where `delete` would always set the `lastItem` to `undefined` even when items still remained in cache

## 2.1.4

- Move multiple-parameter key matching to cache (allows for custom `cache` to have its own implementation)
- Update documentation for the custom `cache` implementation, as it requires `getMultiParamKey` now, plus give a better example of an alternative `cache`
- Make `keys()` and `values()` methods no-ops when cache implementation is custom
- Make `deleteItemFromCache` method safe with custom `cache` implementations

## 2.1.3

- Enhance `Cache` more for multiple-parameter functions (now benchmarks faster in all categories)

## 2.1.2

- Have `areArraysShallowEqual` use `isEqual` instead of strict equality to allow for `NaN` as key

## 2.1.1

- Optimize cache class to be more efficient in both `has` and `get` operations
- Fix issue with `delete` that was preventing delete of falsy keys

## 2.1.0

- Add `add` method on cache to allow for manual cache insertion

## 2.0.3

- Ensure `maxArgs` is respected for unserialized functions
- Change the arguments length check from `=== 1` to `>` so that zero arguments (`undefined` key) pulls from cache directly instead of tries to go through key matching for multiparam

## 2.0.2

- Prevent memoization on `moize.react` based on third parameter to functional components (object of all internal react functions)

## 2.0.1

- Fix static types applied to functional components not being applied to memoized component

## 2.0.0

- Refactor to use object equality instead of serialization (vast speed improvements over 1.x.x with multiple parameters)

**BREAKING CHANGES**

- If you were relying on the serialization (using value equality instead of object equality), it will no longer memoize (you can set `serialize: true` if you want to continue using that option)
- If you were using `moize` to memoize React components, you should change your invocations from `moize` to `moize.react` ([see README](README.md#usage-with-functional-react-components))

## 1.5.0

- Add `values` method on memoized function (gets list of computed values stored in cache)
- Fix issue with `clear` method not being present on `Cache`

## 1.4.5

- Switch to using Cache for caching instead of native Map (was previously only used for polyfilling, but is twice as fast ... I feel silly for not testing its performance prior)
- Simplify and optimize Cache to crank out as much speed as possible

## 1.4.4

- Add `displayName` property to memoized function for better display of memoized `react` components in DevTools
- Throw a `TypeError` when the parameter passed to moize is not a function

## 1.4.3

- Move internal serializer generation to utils, for further partial application leveraging

## 1.4.2

- Leverage partial functions in a number of places (less arguments passed around, improves performance by ~6%)

## 1.4.1

- Correct README error explaining `serializeFunctions` option

## 1.4.0

- Add `serializeFunctions` option

## 1.3.3

- Ensure all numeric parameters (`maxAge`, `maxArgs`, `maxSize`) are a finite positive integer

## 1.3.2

- Replace array-based decycle with Map (performance on circular objects)

## 1.3.1

- Fix README errors

## 1.3.0

- Add keys method to memoized function, to know the size and also get keys for potential deletion
- Update decycle method with modern techniques and helper functions for better circular reference performance

## 1.2.0

- Add `maxArgs` configuration option to limit the number of arguments to use in the key creation for cache

## 1.1.2

- Remove external dependencies in favor of local `Cache` and `decycle` implementation (smaller bundle size)

## 1.1.1

- Make handling of circular handling automatic by stringifying in `try` / `catch`, and remove manual `isCircular` configuration option

## 1.1.0

- Add `cycle` dependency to handle circular objects
- Add `clear` and `delete` methods on the memoized function to allow for direct cache manipulation

## 1.0.3

- Remove warning related to `map-or-similar` dependency consumption

## 1.0.2

- Remove no-longer-needed dependencies

## 1.0.1

- Remove unneeded folders and files from npm package

## 1.0.0

- Initial release
